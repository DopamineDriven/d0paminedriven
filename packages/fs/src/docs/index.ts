import { createReadStream } from "node:fs";
import { relative } from "node:path";
import { Readable } from "node:stream";
import { inflateSync } from "fflate";
import type {
  DocSpecs,
  PdfImageAnalysisMetadata,
  ZipEntry
} from "@/types/index.ts";
import { mimeToExt } from "@/mime/index.ts";


export class DocMetadataExtractor {
  // Safer decoding with fallback paths
  protected toSafeString(buf: Uint8Array, encoding = "utf-8"): string {
    try {
      // TextDecoder is available in browsers and modern runtimes
      return new TextDecoder(encoding, { fatal: false }).decode(buf);
    } catch {
      // Fallback to latin1-ish if decoder fails
      return Array.from(buf)
        .map(b => String.fromCharCode(b))
        .join("");
    }
  }

  /**
   * Detect XObject image references in the PDF
   * Images are declared as XObjects with /Subtype /Image
   */
  private detectXObjectImages(text: string): {
    count: number;
    types: (
      | "jpeg"
      | "jpeg2000"
      | "png-like"
      | "ccitt-fax"
      | "jbig2"
      | "inline"
    )[];
  } {
    const types = Array.of<
      "jpeg" | "jpeg2000" | "png-like" | "ccitt-fax" | "jbig2" | "inline"
    >();

    // Find all XObject Image declarations
    // Pattern: obj ... /Type /XObject /Subtype /Image ... /Filter /SomeFilter
    const imageObjPattern =
      /\d+\s+\d+\s+obj[\s\S]*?\/Subtype\s*\/Image[\s\S]*?endobj/g;
    const imageMatches = text.match(imageObjPattern) ?? [];

    // Also catch the reverse order: /Subtype before /Type
    const reversePattern =
      /\d+\s+\d+\s+obj[\s\S]*?\/Type\s*\/XObject[\s\S]*?\/Subtype\s*\/Image[\s\S]*?endobj/g;
    const reverseMatches = text.match(reversePattern) ?? [];

    const allImageBlocks = [...new Set([...imageMatches, ...reverseMatches])];

    for (const block of allImageBlocks) {
      // Detect filter types to understand image encoding
      if (
        /\/Filter\s*\/DCTDecode/.test(block) ||
        /\/Filter\s*\[.*?\/DCTDecode/.test(block)
      ) {
        types.push("jpeg");
      }
      if (
        /\/Filter\s*\/JPXDecode/.test(block) ||
        /\/Filter\s*\[.*?\/JPXDecode/.test(block)
      ) {
        types.push("jpeg2000");
      }
      if (
        /\/Filter\s*\/CCITTFaxDecode/.test(block) ||
        /\/Filter\s*\[.*?\/CCITTFaxDecode/.test(block)
      ) {
        types.push("ccitt-fax");
      }
      if (
        /\/Filter\s*\/JBIG2Decode/.test(block) ||
        /\/Filter\s*\[.*?\/JBIG2Decode/.test(block)
      ) {
        types.push("jbig2");
      }
      // FlateDecode with ColorSpace often indicates PNG-like raster
      if (
        /\/Filter\s*\/FlateDecode/.test(block) &&
        /\/ColorSpace/.test(block)
      ) {
        types.push("png-like");
      }
    }

    // Count unique image objects by their object numbers
    const objNumbers = new Set<string>();

    const objNumPattern = /(\d+)\s+\d+\s+obj[\s\S]*?\/Subtype\s*\/Image/g;
    let match: RegExpExecArray | null;
    while ((match = objNumPattern.exec(text)) !== null) {
      if (match?.[1]) objNumbers.add(match[1]);
    }

    return { count: objNumbers.size, types: Array.from(types) };
  }

  /**
   * Detect inline images (BI ... ID ... EI blocks)
   * These are embedded directly in content streams, common in older PDFs
   */
  private detectInlineImages(text: string) {
    // Inline image format: BI <params> ID <data> EI
    // The BI must be preceded by whitespace and followed by image params
    const inlinePattern = /\sBI\s[\s\S]*?\sID[\s\S]*?\sEI\s/g;
    const matches = text.match(inlinePattern);
    return matches?.length ?? 0;
  }

  /**
   * Check for vector graphics (Form XObjects, paths, etc.)
   * These don't need multimodal but indicate visual complexity
   */
  private detectVectorGraphics(text: string) {
    // Form XObjects (reusable graphics)
    const hasFormXObjects = /\/Subtype\s*\/Form/.test(text);

    // Complex path operations (bezier curves, fills)
    // c = curveto, re = rectangle, f/F = fill, S = stroke
    const hasComplexPaths =
      /\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+c/.test(
        text
      );

    // Shading patterns (gradients)
    const hasShading =
      /\/ShadingType\s+\d/.test(text) || /\/Pattern/.test(text);

    return hasFormXObjects || hasComplexPaths || hasShading;
  }
  private hasFaxEncoding(
    types: (
      | "jpeg"
      | "jpeg2000"
      | "png-like"
      | "ccitt-fax"
      | "jbig2"
      | "inline"
    )[]
  ) {
    for (const type of types) {
      if (type === "ccitt-fax") return true;
      if (type === "jbig2") return true;
    }
    return false;
  }
  /**
   * Estimate if PDF is scanned (image-only with no real text layer)
   */
  private detectScannedPdf(
    text: string,
    imageAnalysis: {
      count: number;
      types: (
        | "jpeg"
        | "jpeg2000"
        | "png-like"
        | "ccitt-fax"
        | "jbig2"
        | "inline"
      )[];
    },
    pageCount: number | null
  ): boolean {
    // Strong indicators of scanned content
    const hasFaxEncoding = this.hasFaxEncoding(imageAnalysis.types);

    // Check for text content
    const textBlocks = text.match(/BT[\s\S]*?ET/g) ?? [];
    const hasSubstantialText = textBlocks.length > 5;

    // Check for ToUnicode mappings (indicates real text, not OCR'd)
    const hasToUnicode = /\/ToUnicode/.test(text);

    // Heuristic: if we have ~1 image per page and minimal text, likely scanned
    const pages = pageCount ?? 1;
    const imagesPerPage = imageAnalysis.count / pages;

    if (hasFaxEncoding) return true;
    if (imagesPerPage >= 0.8 && !hasSubstantialText && !hasToUnicode)
      return true;

    return false;
  }

  /**
   * Analyze images in compressed streams (for Acrobat-optimized PDFs)
   * Reuses your existing decompression infrastructure
   */
  private detectImagesInCompressedStreams(buffer: Buffer) {
    const types = new Set<
      "jpeg" | "jpeg2000" | "png-like" | "ccitt-fax" | "jbig2" | "inline"
    >();
    let additionalImages = 0;

    try {
      // Reuse your existing decompression
      const text = buffer.toString("latin1");
      const objStreams = this.parseObjectStreams(buffer, text);
      const flateStreams = this.decompressFlateStreams(buffer);

      for (const content of [...objStreams, ...flateStreams]) {
        // Look for image declarations in decompressed content
        const imageRefs = content.match(/\/Subtype\s*\/Image/g);
        if (imageRefs) {
          additionalImages += imageRefs.length;

          // Check filter types
          if (/\/DCTDecode/.test(content)) types.add("jpeg");
          if (/\/JPXDecode/.test(content)) types.add("jpeg2000");
          if (/\/CCITTFaxDecode/.test(content)) types.add("ccitt-fax");
          if (/\/JBIG2Decode/.test(content)) types.add("jbig2");
          if (/\/FlateDecode[\s\S]{0,200}\/ColorSpace/.test(content))
            types.add("png-like");
        }
      }
    } catch {
      // Decompression failed
    }

    return { additionalImages, types };
  }

  public analyzePdfImages(buffer: Buffer, pageCount: number | null) {
    const text = buffer.toString("latin1");

    // Detect images from uncompressed content
    const xobjectAnalysis = this.detectXObjectImages(text);
    const inlineCount = this.detectInlineImages(text);

    // Check compressed streams for additional images
    const compressedAnalysis = this.detectImagesInCompressedStreams(buffer);

    const xobjSet = new Set([...xobjectAnalysis.types]);

    // Merge results
    const allTypes = compressedAnalysis.types.union(xobjSet);

    if (inlineCount > 0) {
      allTypes.add("inline");
    }

    const totalImages =
      xobjectAnalysis.count + inlineCount + compressedAnalysis.additionalImages;
    const hasImages = totalImages > 0;
    const hasVectorGraphics = this.detectVectorGraphics(text);

    // Determine if likely scanned
    const isLikelyScanned = this.detectScannedPdf(
      text,
      { count: totalImages, types: Array.from(allTypes) },
      pageCount
    );

    // Calculate coverage estimate
    const pages = pageCount ?? 1;
    const imagesPerPage = totalImages / pages;

    let estimatedImageCoverage:
      | "none"
      | "moderate"
      | "minimal"
      | "heavy"
      | null = null;
    if (totalImages === 0) {
      estimatedImageCoverage = "none";
    } else if (imagesPerPage < 0.5) {
      estimatedImageCoverage = "minimal";
    } else if (imagesPerPage < 2) {
      estimatedImageCoverage = "moderate";
    } else {
      estimatedImageCoverage = "heavy";
    }

    // Make recommendation
    let recommendation: "multimodal" | "text-only" | null = null;

    if (isLikelyScanned) {
      // Scanned PDFs absolutely need multimodal
      recommendation = "multimodal";
    } else if (estimatedImageCoverage === "none" && !hasVectorGraphics) {
      // Pure text PDF, text-only is fine and cheaper
      recommendation = "text-only";
    } else if (estimatedImageCoverage === "minimal" && !isLikelyScanned) {
      // Few images, text extraction probably captures the important stuff
      recommendation = "text-only";
    } else {
      // Moderate to heavy images, or has charts/diagrams
      recommendation = "multimodal";
    }

    return {
      hasImages,
      imageCount: totalImages,
      estimatedImageCoverage,
      imageTypes: allTypes,
      isLikelyScanned,
      hasVectorGraphics,
      recommendation
    };
  }

  protected detectTextEncodingPrefix(buffer: Uint8Array): {
    encoding: string;
    offset: number;
  } {
    // BOM detection for common encodings
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
    )
      return { encoding: "utf-8", offset: 3 };
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe)
      return { encoding: "utf-16le", offset: 2 };
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff)
      return { encoding: "utf-16be", offset: 2 };
    return { encoding: "utf-8", offset: 0 };
  }

  // Best-effort text detection/decoding with UTF-8 validation and Windows-1252 fallback
  protected detectAndDecodeText(buffer: Uint8Array): string {
    const { encoding, offset } = this.detectTextEncodingPrefix(buffer);
    const body = buffer.subarray(offset);
    if (encoding === "utf-8" && offset === 0) {
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(body);
      } catch {
        return new TextDecoder("windows-1252", { fatal: false }).decode(body);
      }
    }
    return this.toSafeString(body, encoding);
  }

  private _stripXmlTags(xml: string): string {
    return xml
      .replace(/<\/?[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  private getExtFromFilename(filename?: string): string | null {
    if (!filename) return null;
    const i = filename.lastIndexOf(".");
    if (i === -1) return null;
    return filename.slice(i + 1).toLowerCase();
  }

  private firstN(text: string | null | undefined, n = 240): string | null {
    if (!text) return null;
    const t = text.slice(0, n);
    return t.length < text.length ? `${t}…` : t;
  }

  private countWords(text: string): number {
    const words = text.trim().match(/[\p{L}\p{N}_]+/gu);
    return words ? words.length : 0;
  }

  private countLines(text: string): number {
    if (!text) return 0;
    // Normalise CRLF
    return text.replace(/\r\n/g, "\n").split("\n").length;
  }
  private extToLanguage(ext: string | null): string | null {
    if (!ext) return null;
    const map: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      rs: "rust",
      go: "go",
      java: "java",
      c: "c",
      h: "c",
      cpp: "cpp",
      hpp: "cpp",
      cs: "csharp",
      php: "php",
      swift: "swift",
      kotlin: "kotlin",
      kt: "kotlin",
      m: "objective-c",
      mm: "objective-c++",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      json: "json",
      yml: "yaml",
      yaml: "yaml",
      md: "markdown",
      markdown: "markdown",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      sql: "sql",
      csv: "csv",
      txt: "text",
      tex: "tex"
    };
    return map[ext] ?? null;
  }

  // -------- PDF helpers --------

  /**
   * Decompress FlateDecode streams to search for page info
   * Many modern PDFs compress their object streams
   */
  private decompressFlateStreams(buffer: Buffer): string[] {
    const decompressed: string[] = [];
    const text = buffer.toString("latin1");

    // Find stream...endstream blocks with FlateDecode
    // Match the dictionary, then find the stream content
    const streamPattern =
      /<<[^>]*\/Filter\s*\/FlateDecode[^>]*>>[\r\n]*stream\r?\n/g;

    let match: RegExpExecArray | null;
    while ((match = streamPattern.exec(text)) !== null) {
      try {
        const streamStart = match.index + match[0].length;
        const endstreamPos = text.indexOf("endstream", streamStart);
        if (endstreamPos === -1) continue;

        // Get raw bytes from buffer (not string) to preserve binary data
        const compressedData = buffer.subarray(streamStart, endstreamPos);

        // Trim trailing whitespace that might be before endstream
        let dataEnd = compressedData.length;
        while (
          dataEnd > 0 &&
          (compressedData[dataEnd - 1] === 0x0a ||
            compressedData[dataEnd - 1] === 0x0d ||
            compressedData[dataEnd - 1] === 0x20)
        ) {
          dataEnd--;
        }

        const trimmedData = compressedData.subarray(0, dataEnd);
        const inflated = inflateSync(new Uint8Array(trimmedData));
        decompressed.push(Buffer.from(inflated).toString("latin1"));
      } catch {
        // Stream might not be pure FlateDecode or corrupted
        continue;
      }
    }

    return decompressed;
  }

  /**
   * Parse Object Streams (/Type /ObjStm) used by Acrobat-optimized PDFs
   * These bundle multiple objects into compressed containers
   */
  private parseObjectStreams(buffer: Buffer, text: string): string[] {
    const extractedObjects: string[] = [];

    // Find all ObjStm objects - they contain /Type /ObjStm, /N (count), /First (offset)
    const objStmPattern =
      /(\d+)\s+\d+\s+obj[^]*?\/Type\s*\/ObjStm[^]*?\/N\s+(\d+)[^]*?\/First\s+(\d+)[^]*?stream\r?\n/g;

    let match: RegExpExecArray | null;
    while ((match = objStmPattern.exec(text)) !== null) {
      try {
        if (!match[2] || !match[3]) continue;
        const numObjects = parseInt(match[2], 10);
        const firstOffset = parseInt(match[3], 10);

        if (numObjects <= 0 || numObjects > 10000) continue;
        if (firstOffset < 0 || firstOffset > 1000000) continue;

        // Find stream data
        const streamStart = match.index + match[0].length;
        const endstreamPos = text.indexOf("endstream", streamStart);
        if (endstreamPos === -1) continue;

        const compressedData = buffer.subarray(streamStart, endstreamPos);

        // Trim trailing whitespace
        let dataEnd = compressedData.length;
        while (
          dataEnd > 0 &&
          (compressedData[dataEnd - 1] === 0x0a ||
            compressedData[dataEnd - 1] === 0x0d ||
            compressedData[dataEnd - 1] === 0x20)
        ) {
          dataEnd--;
        }

        const trimmedData = compressedData.subarray(0, dataEnd);
        const decompressed = inflateSync(new Uint8Array(trimmedData));
        const decompressedStr = Buffer.from(decompressed).toString("latin1");

        // First part is index: "objNum1 offset1 objNum2 offset2 ..."
        // Actual objects start at firstOffset
        if (firstOffset < decompressedStr.length) {
          const objectData = decompressedStr.slice(firstOffset);
          extractedObjects.push(objectData);
        }
      } catch {
        continue;
      }
    }

    return extractedObjects;
  }

  /**
   * Parse cross-reference table to find object offsets
   */
  private parseXrefTable(
    text: string
  ): Map<number, { offset: number; gen: number }> {
    const objects = new Map<number, { offset: number; gen: number }>();

    // Traditional xref table
    const xrefMatch = text.match(/xref\s+([\s\S]*?)trailer/);
    if (xrefMatch?.[1]) {
      const lines = xrefMatch[1].trim().split(/\r?\n/);
      let currentObj = 0;

      for (const line of lines) {
        // Subsection header: "0 6" means starting at object 0, 6 objects
        const subsection = line.match(/^(\d+)\s+(\d+)\s*$/);
        if (subsection?.[1]) {
          currentObj = parseInt(subsection[1], 10);
          continue;
        }

        // Entry: "0000000000 65535 f" or "0000000015 00000 n"
        const entry = line.match(/^(\d{10})\s+(\d{5})\s+([fn])/);
        if (entry?.[3] === "n" && entry[1] && entry[2]) {
          objects.set(currentObj, {
            offset: parseInt(entry[1], 10),
            gen: parseInt(entry[2], 10)
          });
        }
        currentObj++;
      }
    }

    return objects;
  }

  /**
   * Parse PDF 1.5+ cross-reference streams (/Type /XRef)
   * These replace traditional xref tables in modern PDFs
   */
  private parseXrefStream(buffer: Buffer, text: string): Map<number, number> {
    const objects = new Map<number, number>();

    // Find XRef stream - look for /Type /XRef with /W array
    const xrefStreamMatch = text.match(
      /<<[^>]*\/Type\s*\/XRef[^>]*\/W\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s*\][^>]*>>[\r\n]*stream\r?\n/
    );
    if (!xrefStreamMatch?.[1] || !xrefStreamMatch[2] || !xrefStreamMatch[3]) {
      return objects;
    }

    const w1 = parseInt(xrefStreamMatch[1], 10);
    const w2 = parseInt(xrefStreamMatch[2], 10);
    const w3 = parseInt(xrefStreamMatch[3], 10);
    const entrySize = w1 + w2 + w3;

    if (entrySize <= 0 || entrySize > 20) return objects;

    // Get /Size
    const sizeMatch = text.match(/\/Size\s+(\d+)/);
    const size = sizeMatch?.[1] ? parseInt(sizeMatch[1], 10) : 0;
    if (size <= 0) return objects;

    // Get /Index if present (defines which objects are in the stream)
    const indexMatch = text.match(/\/Index\s*\[\s*([\d\s]+)\s*\]/);
    let indices: number[] = [];
    if (indexMatch?.[1]) {
      indices = indexMatch[1]
        .trim()
        .split(/\s+/)
        .map(n => parseInt(n, 10));
    }

    try {
      if (xrefStreamMatch.index === undefined) return objects;
      const streamStart = xrefStreamMatch.index + xrefStreamMatch[0].length;
      const endstreamPos = text.indexOf("endstream", streamStart);
      if (endstreamPos === -1) return objects;

      const compressedData = buffer.subarray(streamStart, endstreamPos);

      // Trim trailing whitespace
      let dataEnd = compressedData.length;
      while (
        dataEnd > 0 &&
        (compressedData[dataEnd - 1] === 0x0a ||
          compressedData[dataEnd - 1] === 0x0d ||
          compressedData[dataEnd - 1] === 0x20)
      ) {
        dataEnd--;
      }

      const trimmedData = compressedData.subarray(0, dataEnd);
      const decompressed = inflateSync(new Uint8Array(trimmedData));

      // Parse entries based on /Index or sequential from 0
      let entryIndex = 0;

      if (indices.length >= 2) {
        // /Index defines subsections: [start1 count1 start2 count2 ...]
        for (let i = 0; i < indices.length; i += 2) {
          const start = indices[i] ?? 0;
          const count = indices[i + 1] ?? 0;

          for (
            let j = 0;
            j < count && entryIndex * entrySize < decompressed.length;
            j++
          ) {
            const offset = entryIndex * entrySize;

            // Read type field
            let type = 0;
            for (let k = 0; k < w1; k++) {
              type = (type << 8) | (decompressed[offset + k] ?? 0);
            }

            // Type 1 = regular object with byte offset
            if (type === 1) {
              let byteOffset = 0;
              for (let k = 0; k < w2; k++) {
                byteOffset =
                  (byteOffset << 8) | (decompressed[offset + w1 + k] ?? 0);
              }
              objects.set(start + j, byteOffset);
            }

            entryIndex++;
          }
        }
      } else {
        // Sequential from 0
        for (let i = 0; i < size && i * entrySize < decompressed.length; i++) {
          const offset = i * entrySize;

          let type = 0;
          for (let j = 0; j < w1; j++) {
            type = (type << 8) | (decompressed[offset + j] ?? 0);
          }

          if (type === 1) {
            let byteOffset = 0;
            for (let j = 0; j < w2; j++) {
              byteOffset =
                (byteOffset << 8) | (decompressed[offset + w1 + j] ?? 0);
            }
            objects.set(i, byteOffset);
          }
        }
      }
    } catch {
      // Decompression failed
    }

    return objects;
  }

  /**
   * Extract page count from object at specific offset
   */
  private extractPageCountFromObject(
    buffer: Buffer,
    offset: number
  ): number | null {
    try {
      // Read enough bytes to capture the object
      const chunk = buffer
        .subarray(offset, Math.min(offset + 4096, buffer.length))
        .toString("latin1");

      // Check if this is a Pages object with Count
      if (/\/Type\s*\/Pages/.test(chunk)) {
        const countMatch = chunk.match(/\/Count\s+(\d+)/);
        if (countMatch?.[1]) {
          return parseInt(countMatch[1], 10);
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  // -------- Multi-strategy page counting --------

  /**
   * Strategy 1: Direct /Pages /Count in uncompressed content (fastest, high confidence)
   * Finds the ROOT Pages object by looking for the highest /Count value
   */
  private strategy1DirectPagesCount(text: string): number | null {
    // More flexible patterns that handle whitespace variations
    const patterns = [
      /\/Type\s*\/Pages\s*[^>]*?\/Count\s+(\d+)/g,
      /\/Count\s+(\d+)\s*[^>]*?\/Type\s*\/Pages/g
    ];

    let maxCount = 0;

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          const count = parseInt(match[1], 10);
          // Root Pages node has the highest count (sum of all children)
          if (count > maxCount && count < 100000) {
            maxCount = count;
          }
        }
      }
    }

    return maxCount > 0 ? maxCount : null;
  }

  /**
   * Strategy 2: Linearized hint (high confidence for linearized PDFs)
   * /N in the linearization dict is the total page count
   */
  private strategy2Linearized(text: string): number | null {
    // Linearized PDFs have page count in first ~1KB
    const header = text.slice(0, 2048);

    if (/\/Linearized\s+[\d.]+/.test(header)) {
      // /N is the page count in linearized dict
      const nMatch = header.match(/\/N\s+(\d+)/);
      if (nMatch?.[1]) {
        const count = parseInt(nMatch[1], 10);
        if (count > 0 && count < 100000) return count;
      }
    }

    return null;
  }

  /**
   * Strategy 3: Follow Catalog -> Pages reference chain (high confidence)
   */
  private strategy3CatalogChain(buffer: Buffer, text: string): number | null {
    // Find Catalog object's Pages reference
    const catalogMatch = text.match(
      /\/Type\s*\/Catalog[\s\S]{0,500}?\/Pages\s+(\d+)\s+(\d+)\s+R/
    );
    if (!catalogMatch?.[1]) return null;

    const pagesObjNum = parseInt(catalogMatch[1], 10);

    // Try to find the Pages object directly by its number
    const objPattern = new RegExp(
      `(?:^|\\r|\\n)${pagesObjNum}\\s+\\d+\\s+obj[\\s\\S]*?endobj`,
      "m"
    );

    const objMatch = text.match(objPattern);
    if (objMatch?.[0]) {
      // Only match /Count if this object has /Type /Pages
      if (/\/Type\s*\/Pages/.test(objMatch[0])) {
        const countMatch = objMatch[0].match(/\/Count\s+(\d+)/);
        if (countMatch?.[1]) {
          const count = parseInt(countMatch[1], 10);
          if (count > 0 && count < 100000) return count;
        }
      }
    }

    // Try using xref table for precise location
    const xrefObjects = this.parseXrefTable(text);
    let pagesOffset = xrefObjects.get(pagesObjNum);

    // Try xref stream if traditional table didn't work
    if (!pagesOffset) {
      const xrefStreamObjects = this.parseXrefStream(buffer, text);
      const streamOffset = xrefStreamObjects.get(pagesObjNum);
      if (streamOffset) {
        pagesOffset = { offset: streamOffset, gen: 0 };
      }
    }

    if (pagesOffset) {
      const count = this.extractPageCountFromObject(buffer, pagesOffset.offset);
      if (count && count > 0 && count < 100000) return count;
    }

    return null;
  }

  /**
   * Strategy 4: Decompress FlateDecode streams and Object Streams (medium confidence)
   * Handles Acrobat-optimized PDFs where page tree is compressed
   */
  private strategy4DecompressedStreams(buffer: Buffer): number | null {
    const text = buffer.toString("latin1");

    try {
      // Get content from Object Streams (Acrobat-optimized PDFs)
      const objStreams = this.parseObjectStreams(buffer, text);

      // Also try regular FlateDecode streams
      const flateStreams = this.decompressFlateStreams(buffer);

      const allDecompressed = [...objStreams, ...flateStreams];

      let maxCount = 0;

      for (const content of allDecompressed) {
        // Search for /Type /Pages with /Count in decompressed content
        const patterns = [
          /\/Type\s*\/Pages[\s\S]{0,300}?\/Count\s+(\d+)/g,
          /\/Count\s+(\d+)[\s\S]{0,300}?\/Type\s*\/Pages/g
        ];

        for (const pattern of patterns) {
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(content)) !== null) {
            if (match[1]) {
              const count = parseInt(match[1], 10);
              // Take the highest count (root Pages node)
              if (count > maxCount && count < 100000) {
                maxCount = count;
              }
            }
          }
        }
      }

      return maxCount > 0 ? maxCount : null;
    } catch {
      return null;
    }
  }

  /**
   * Strategy 5: Count unique Page objects from Kids arrays (medium confidence)
   * Only counts refs that point to actual /Type /Page objects
   */
  private strategy5KidsPageRefs(text: string): number | null {
    const pageRefs = new Set<string>();

    // First, collect all refs from Kids arrays
    const kidsMatches = text.matchAll(/\/Kids\s*\[\s*([\s\S]*?)\s*\]/g);
    const allRefs: string[] = [];

    for (const match of kidsMatches) {
      if (match[1]) {
        const refs = match[1].matchAll(/(\d+)\s+\d+\s+R/g);
        for (const ref of refs) {
          if (ref[1]) allRefs.push(ref[1]);
        }
      }
    }

    // Check which refs are Page (not Pages) objects
    for (const objNum of allRefs) {
      // Look for this object and verify it's a Page (not Pages)
      const objPattern = new RegExp(
        `(?:^|\\r|\\n)${objNum}\\s+\\d+\\s+obj[\\s\\S]{0,500}?\\/Type\\s*\\/Page\\b(?!s)`,
        "m"
      );
      if (objPattern.test(text)) {
        pageRefs.add(objNum);
      }
    }

    return pageRefs.size > 0 ? pageRefs.size : null;
  }

  /**
   * Strategy 6: Brute force count /Type /Page objects (low confidence)
   */
  private strategy6BruteForce(text: string): number | null {
    // Count objects that have /Type /Page (not /Pages) with MediaBox or Parent
    // This helps filter out false positives
    const strictPattern =
      /\d+\s+\d+\s+obj[\s\S]*?\/Type\s*\/Page\b(?!s)[\s\S]*?\/(?:MediaBox|Parent)/g;
    const strictMatches = text.match(strictPattern);
    if (strictMatches && strictMatches.length > 0) {
      return strictMatches.length;
    }

    // Looser fallback: any /Type /Page
    const loosePattern = /\/Type\s*\/Page\b(?!s)/g;
    const looseMatches = text.match(loosePattern);
    return looseMatches ? looseMatches.length : null;
  }

  /**
   * Strategy 7: Estimate from file characteristics (last resort)
   */
  private strategy7Estimate(buffer: Buffer, text: string): number | null {
    const fileSizeKB = buffer.length / 1024;

    // Check if it's a scanned PDF (typically larger per page)
    const hasImages = /\/XObject/.test(text) && /\/Image/.test(text);
    const hasText = /BT[\s\S]*?ET/.test(text);

    if (hasImages && !hasText) {
      // Scanned PDF: ~100-500KB per page
      return Math.max(1, Math.round(fileSizeKB / 300));
    } else if (hasText) {
      // Text PDF: ~5-50KB per page
      return Math.max(1, Math.round(fileSizeKB / 25));
    }

    // Generic estimate
    return Math.max(1, Math.round(fileSizeKB / 50));
  }

  /**
   * Count PDF pages with confidence tracking
   * Returns both the count and how confident we are in the result
   */
  private countPDFPagesWithConfidence(buffer: Buffer): {
    pageCount: number | null;
    confidence: "high" | "medium" | "low" | "estimated";
  } {
    const text = buffer.toString("latin1");

    // Strategy 1: Direct /Pages /Count (high confidence)
    const directCount = this.strategy1DirectPagesCount(text);
    if (directCount && directCount > 0) {
      return { pageCount: directCount, confidence: "high" };
    }

    // Strategy 2: Linearized /N (high confidence)
    const linearizedCount = this.strategy2Linearized(text);
    if (linearizedCount && linearizedCount > 0) {
      return { pageCount: linearizedCount, confidence: "high" };
    }

    // Strategy 3: Catalog chain (high confidence)
    const catalogCount = this.strategy3CatalogChain(buffer, text);
    if (catalogCount && catalogCount > 0) {
      return { pageCount: catalogCount, confidence: "high" };
    }

    // Strategy 4: Decompressed streams including ObjStm (medium confidence)
    const decompressedCount = this.strategy4DecompressedStreams(buffer);
    if (decompressedCount && decompressedCount > 0) {
      return { pageCount: decompressedCount, confidence: "medium" };
    }

    // Strategy 5: Kids refs to Page objects (medium confidence)
    const kidsCount = this.strategy5KidsPageRefs(text);
    if (kidsCount && kidsCount > 0) {
      return { pageCount: kidsCount, confidence: "medium" };
    }

    // Strategy 6: Brute force Page count (low confidence)
    const bruteCount = this.strategy6BruteForce(text);
    if (bruteCount && bruteCount > 0) {
      return { pageCount: bruteCount, confidence: "low" };
    }

    // Strategy 7: Estimate (last resort)
    const estimatedCount = this.strategy7Estimate(buffer, text);
    return { pageCount: estimatedCount, confidence: "estimated" };
  }

  /**
   * Legacy method for backward compatibility
   */
  private countPDFPages(buffer: Buffer): number | null {
    return this.countPDFPagesWithConfidence(buffer).pageCount;
  }

  private extractPDFText(buffer: Buffer, maxLength = 500): string | null {
    try {
      const text = buffer.toString("latin1");
      const textBlocks = Array.of<string>();
      const btMatches = text.matchAll(/BT([\s\S]*?)ET/g);
      for (const m of btMatches) {
        const body = m[1];
        // Tj with () strings
        if (body) {
          for (const tj of body.matchAll(/\(([^)]*)\)\s*Tj/g)) {
            if (tj[1]) textBlocks.push(this.decodePdfString(tj[1]));
            if (textBlocks.join(" ").length > maxLength) break;
          }
          // Tj with <hex>
          for (const hex of body.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
            if (hex[1]) textBlocks.push(this.decodeHexString(hex[1]));
            if (textBlocks.join(" ").length > maxLength) break;
          }
          // TJ arrays
          for (const tja of body.matchAll(/\[(.*?)\]\s*TJ/g)) {
            const arr = tja[1];
            if (arr) {
              for (const str of arr.matchAll(/\(([^)]*)\)/g)) {
                if (str[1]) textBlocks.push(this.decodePdfString(str[1]));
                if (textBlocks.join(" ").length > maxLength) break;
              }
              for (const hx of arr.matchAll(/<([0-9A-Fa-f]+)>/g)) {
                if (hx[1]) textBlocks.push(this.decodeHexString(hx[1]));
                if (textBlocks.join(" ").length > maxLength) break;
              }
            }
          }
        }
        if (textBlocks.join(" ").length > maxLength) break;
      }
      if (!textBlocks.length) return null;
      let result = textBlocks
        .join(" ")
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!result) return null;
      if (result.length > maxLength) result = result.slice(0, maxLength) + "…";
      return result;
    } catch {
      return null;
    }
  }
  private decodePdfString(str: string): string {
    if (!str) return "";
    let out = str.replace(/\\(\d{1,3})/g, (_, oct: string) => {
      const code = parseInt(oct, 8);
      return code < 256 ? String.fromCharCode(code) : "";
    });
    out = out
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\b/g, "\b")
      .replace(/\\f/g, "\f")
      .replace(/\\([()\\])/g, "$1");
    return out;
  }
  private decodeHexString(hex: string): string {
    if (!hex) return "";

    // Remove spaces and ensure even length
    hex = hex.replace(/\s/g, "");
    if (hex.length % 2) hex += "0";

    let result = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, 2), 16);
      if (!isNaN(code)) {
        result += String.fromCharCode(code);
      }
    }
    return result;
  }
  /**
   * Parse PDF date format into ISO 8601
   * PDF Format: D:YYYYMMDDHHmmSSOHH'mm'
   * Your implementation is good but needs small fixes
   */
  private parsePdfDate(value: string): string | null {
    if (!value) return null;

    // Clean the input
    const v = value.startsWith("D:") ? value.slice(2) : value;

    // Fixed regex - make timezone optional and handle variations
    const re =
      /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:(Z|[+\-])(\d{2})'?(\d{2})'?)?/;
    const m = v.match(re);
    if (!m) return null;

    const [_, Y, Mo, D, H, Mi, S, tzIndicator, tzHours, tzMinutes] = m;

    // Build date components with defaults
    const yyyy = Y;
    const mm = Mo ?? "01";
    const dd = D ?? "01";
    const hh = H ?? "00";
    const mi = Mi ?? "00";
    const ss = S ?? "00";

    // Build timezone string
    let tz = "";
    if (tzIndicator) {
      if (tzIndicator === "Z") {
        tz = "Z";
      } else {
        // Handle +/- timezone
        const tzH = tzHours ?? "00";
        const tzM = tzMinutes ?? "00";
        tz = `${tzIndicator}${tzH.padStart(2, "0")}:${tzM.padStart(2, "0")}`;
      }
    }

    // Return ISO 8601 format
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hh.padStart(2, "0")}:${mi.padStart(2, "0")}:${ss.padStart(2, "0")}${tz}`;
  }
  private getPdfInfoString(text: string, key: string): string | null {
    // Parenthesis format
    let m = text.match(new RegExp(`\/${key}\\s*\(([^)]*)\)`));
    if (m?.[1]) return this.decodePdfString(m[1]);
    // Hex format
    m = text.match(new RegExp(`\/${key}\\s*<([0-9A-Fa-f]+)>`));
    if (m?.[1]) return this.decodeHexString(m[1]);
    return null;
  }

  /**
   * Extract date fields from PDF - handles all encoding formats
   * This is what you need to call from your main PDF parser
   */
  private extractPdfDate(text: string, fieldName: string): string | null {
    // Method 1: Parentheses format (most common)
    // Example: /CreationDate (D:20241225120000+05'00')
    let match = text.match(new RegExp(`\/${fieldName}\\s*\\(([^)]+)\\)`));
    if (match?.[1]) {
      // Decode PDF string escapes first
      const decoded = this.decodePdfString(match[1]);
      return this.parsePdfDate(decoded);
    }

    // Method 2: Hexadecimal format
    // Example: /CreationDate <443A32303234313232353132303030302B30352730302720>
    match = text.match(new RegExp(`\/${fieldName}\\s*<([0-9A-Fa-f]+)>`));
    if (match?.[1]) {
      const decoded = this.decodeHexString(match[1]);
      return this.parsePdfDate(decoded);
    }

    // Method 3: Direct string (rare but possible)
    // Example: /CreationDate D:20241225120000Z
    match = text.match(new RegExp(`\/${fieldName}\\s+(D:[^\\s/>]+)`));
    if (match?.[1]) {
      return this.parsePdfDate(match[1]);
    }

    return null;
  }

  /**
   * Extract dates from XMP metadata packet
   * Used as fallback when traditional PDF Info dictionary lacks dates
   */
  private extractXmpDates(text: string): {
    createdDate: string | null;
    modifiedDate: string | null;
  } {
    // Look for XMP packet
    const xmpMatch = text.match(/<\?xpacket[^>]*\?>([\s\S]*?)<\/x:xmpmeta>/);
    if (!xmpMatch?.[1]) {
      return { createdDate: null, modifiedDate: null };
    }

    const xmpContent = xmpMatch[1];
    let createdDate: string | null = null;
    let modifiedDate: string | null = null;

    // Try various XMP date field formats
    // Format 1: <xmp:CreateDate>2025-09-25T03:22:11-04:00</xmp:CreateDate>
    let match = xmpContent.match(/<xmp:CreateDate>([^<]+)<\/xmp:CreateDate>/);
    if (match?.[1]) {
      createdDate = match[1];
    }

    match = xmpContent.match(/<xmp:ModifyDate>([^<]+)<\/xmp:ModifyDate>/);
    if (match?.[1]) {
      modifiedDate = match[1];
    }

    // Format 2: xmp:CreateDate="2025-09-25T03:22:11-04:00"
    if (!createdDate) {
      match = xmpContent.match(/xmp:CreateDate=["']([^"']+)["']/);
      if (match?.[1]) {
        createdDate = match[1];
      }
    }

    if (!modifiedDate) {
      match = xmpContent.match(/xmp:ModifyDate=["']([^"']+)["']/);
      if (match?.[1]) {
        modifiedDate = match[1];
      }
    }

    // Also check for PDF-specific XMP fields
    if (!createdDate) {
      match = xmpContent.match(/<pdf:CreationDate>([^<]+)<\/pdf:CreationDate>/);
      if (match?.[1]) {
        createdDate = match[1];
      }
    }

    if (!modifiedDate) {
      match = xmpContent.match(/<pdf:ModDate>([^<]+)<\/pdf:ModDate>/);
      if (match?.[1]) {
        modifiedDate = match[1];
      }
    }

    return { createdDate, modifiedDate };
  }

  private cleanPdfImgAnalysis(buffer: Buffer, pageCount: number | null) {
    const { imageTypes, ...rest } = this.analyzePdfImages(buffer, pageCount);
    return {
      imageTypes: Array.from(imageTypes),
      ...rest
    } satisfies PdfImageAnalysisMetadata;
  }
  public parsePdf(buffer: Buffer, mime: "application/pdf") {
    // Use latin1 for stable byte->char mapping during regex scans
    const text = buffer.toString("latin1");
    const headerMatch = text.match(/^%PDF-([0-9.]+)/);
    const pdfVersion = headerMatch?.[1] ?? null;
    const isLinearized = /Linearized/i.test(text);
    const isEncrypted = /\/Encrypt\b/.test(text);

    // Better page counting: prefer /Pages /Count, then Kids refs, then fallback
    const pageCount = this.countPDFPages(buffer);

    // Basic text extraction for preview
    const textPreview = this.extractPDFText(buffer, 500);
    const isSearchable =
      !!textPreview || /\bToUnicode\b/.test(text) || /\/Font\b/.test(text);

    // Info dictionary extraction with () and <hex> handling
    const author = this.getPdfInfoString(text, "Author");
    const subject = this.getPdfInfoString(text, "Subject");
    const title = this.getPdfInfoString(text, "Title");
    const creator = this.getPdfInfoString(text, "Creator");
    const producer = this.getPdfInfoString(text, "Producer");
    const keywordsRaw = this.getPdfInfoString(text, "Keywords");
    let keywords = keywordsRaw
      ? keywordsRaw
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean)
      : null;
    // Best-effort: include creator/producer as keywords if present
    if (creator || producer) {
      const extra = [creator, producer].filter(Boolean) as string[];
      keywords = (keywords ?? []).concat(extra);
    }

    // Dates: robust parsing of various PDF date shapes
    // Try traditional PDF Info dictionary first
    let createdDate = this.extractPdfDate(text, "CreationDate");
    let modifiedDate = this.extractPdfDate(text, "ModDate");

    // If no dates found in traditional format, try XMP metadata
    if (!createdDate && !modifiedDate) {
      const xmpDates = this.extractXmpDates(text);
      createdDate = xmpDates.createdDate;
      modifiedDate = xmpDates.modifiedDate;
    }

    return {
      type: "DOCUMENT",
      format: "pdf",
      mimeType: mime ?? "application/pdf",
      pageCount,
      wordCount: textPreview ? this.countWords(textPreview) : null,
      lineCount: null,
      language: null,
      encoding: null,
      author: author ?? creator ?? producer ?? null,
      subject: subject ?? title ?? null,
      keywords,
      pdfVersion,
      isEncrypted,
      isSearchable,
      isLinearized,
      textPreview,
      createdDate,
      modifiedDate,
      metadata: this.cleanPdfImgAnalysis(buffer, pageCount)
    } as DocSpecs<PdfImageAnalysisMetadata>;
  }
  public parseRtf(buffer: Buffer, mime: string): DocSpecs {
    const latin = buffer.toString("latin1");
    // Extremely naive RTF to text: remove control words and groups
    const text = latin
      .replace(/\\'[0-9a-fA-F]{2}/g, " ")
      .replace(/\\[a-zA-Z]+-?\d* ?/g, " ")
      .replace(/[{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = this.countWords(text);
    const lines = this.countLines(text);
    return {
      type: "DOCUMENT",
      format: "rtf",
      mimeType: mime,
      pageCount: null,
      wordCount: words,
      lineCount: lines,
      language: null,
      encoding: "rtf",
      author: null,
      subject: null,
      keywords: null,
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: true,
      isLinearized: null,
      textPreview: this.firstN(text),
      createdDate: null,
      modifiedDate: null
    } satisfies DocSpecs;
  }

  public parsePlainText(
    buffer: Buffer,
    mime: string,
    filename?: string
  ): DocSpecs {
    const u8 = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    const { encoding } = this.detectTextEncodingPrefix(u8);
    const text = this.detectAndDecodeText(u8);
    const ext = this.getExtFromFilename(filename);
    const language = this.extToLanguage(ext);
    const words = this.countWords(text);
    const lines = this.countLines(text);
    return {
      type: "DOCUMENT",
      format:
        ext === "md"
          ? "md"
          : ext === "csv"
            ? "csv"
            : ext === "json"
              ? "json"
              : ext === "html"
                ? "html"
                : "txt",
      mimeType: mime,
      pageCount: null,
      wordCount: words,
      lineCount: lines,
      language,
      encoding,
      author: null,
      subject: null,
      keywords: null,
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: true,
      isLinearized: null,
      textPreview: this.firstN(text),
      createdDate: null,
      modifiedDate: null
    } satisfies DocSpecs;
  }
  /** ---- Minimal ZIP reader utilities (central directory based) ---- */
  private findEOCD(buffer: Buffer): number {
    // EOCD signature: 0x06054b50
    const sig = 0x06054b50;
    const maxSearch = Math.min(buffer.length, 0xffff + 22); // comment <= 65535
    for (let i = buffer.length - 22; i >= buffer.length - maxSearch; i--) {
      if (i < 0) break;
      if (buffer.readUInt32LE(i) === sig) return i;
    }
    return -1;
  }
  public readCentralDirectory(buffer: Buffer): ZipEntry[] {
    try {
      const eocd = this.findEOCD(buffer);
      if (eocd < 0 || eocd + 22 > buffer.length) return [];
      const sig = buffer.readUInt32LE(eocd);
      if (sig !== 0x06054b50) return [];

      const diskNumber = buffer.readUInt16LE(eocd + 4);
      const diskWithCD = buffer.readUInt16LE(eocd + 6);
      if (diskNumber !== 0 || diskWithCD !== 0) return [];

      const totalEntries = buffer.readUInt16LE(eocd + 10);
      const cdirSize = buffer.readUInt32LE(eocd + 12);
      const cdirOffset = buffer.readUInt32LE(eocd + 16);

      if (cdirOffset + cdirSize > buffer.length) {
        return this.recoverCentralDirectory(buffer, cdirOffset, totalEntries);
      }
      return this.parseCentralDirectory(buffer, cdirOffset, totalEntries);
    } catch {
      return [];
    }
  }

  private parseCentralDirectory(
    buffer: Buffer,
    offset: number,
    totalEntries: number
  ): ZipEntry[] {
    const entries: ZipEntry[] = [];
    let p = offset;
    const CEN_SIG = 0x02014b50;
    for (let i = 0; i < totalEntries; i++) {
      if (p + 46 > buffer.length) break;
      if (buffer.readUInt32LE(p) !== CEN_SIG) break;
      const compression = buffer.readUInt16LE(p + 10);
      const compSize = buffer.readUInt32LE(p + 20);
      const uncompSize = buffer.readUInt32LE(p + 24);
      const nameLen = buffer.readUInt16LE(p + 28);
      const extraLen = buffer.readUInt16LE(p + 30);
      const commentLen = buffer.readUInt16LE(p + 32);
      const localHeaderOffset = buffer.readUInt32LE(p + 42);
      const nameStart = p + 46;
      const nameEnd = nameStart + nameLen;
      if (nameEnd > buffer.length) break;
      const name = buffer.subarray(nameStart, nameEnd).toString("utf-8");
      entries.push({
        name,
        compressedSize: compSize,
        uncompressedSize: uncompSize,
        compressionMethod: compression,
        localHeaderOffset
      });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  private recoverCentralDirectory(
    buffer: Buffer,
    startOffset: number,
    maxEntries: number
  ): ZipEntry[] {
    const entries: ZipEntry[] = [];
    const CEN_SIG = 0x02014b50;
    let p = Math.max(0, startOffset);
    while (p + 46 <= buffer.length && entries.length < maxEntries) {
      if (buffer.readUInt32LE(p) === CEN_SIG) {
        const compression = buffer.readUInt16LE(p + 10);
        const compSize = buffer.readUInt32LE(p + 20);
        const uncompSize = buffer.readUInt32LE(p + 24);
        const nameLen = buffer.readUInt16LE(p + 28);
        const extraLen = buffer.readUInt16LE(p + 30);
        const commentLen = buffer.readUInt16LE(p + 32);
        const localHeaderOffset = buffer.readUInt32LE(p + 42);
        const nameStart = p + 46;
        const nameEnd = nameStart + nameLen;
        if (nameEnd > buffer.length) break;
        const name = buffer.subarray(nameStart, nameEnd).toString("utf-8");
        entries.push({
          name,
          compressedSize: compSize,
          uncompressedSize: uncompSize,
          compressionMethod: compression,
          localHeaderOffset
        });
        p += 46 + nameLen + extraLen + commentLen;
        continue;
      }
      p += 1;
    }
    return entries;
  }
  public readLocalFileData(buffer: Buffer, entry: ZipEntry): Uint8Array | null {
    // Local file header signature 0x04034b50
    const LH_SIG = 0x04034b50;
    const p = entry.localHeaderOffset;
    if (buffer.readUInt32LE(p) !== LH_SIG) return null;
    const _generalFlag = buffer.readUInt16LE(p + 6);
    const method = buffer.readUInt16LE(p + 8);
    const nameLen = buffer.readUInt16LE(p + 26);
    const extraLen = buffer.readUInt16LE(p + 28);
    const dataStart = p + 30 + nameLen + extraLen;

    // If bit 3 set, sizes are in data descriptor after data; but central dir gave us sizes
    const compSize = entry.compressedSize;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buffer.length) return null;
    const comp = buffer.subarray(dataStart, dataEnd);
    if (method === 0) {
      return new Uint8Array(comp);
    }
    if (method === 8) {
      try {
        return inflateSync(new Uint8Array(comp));
      } catch {
        return null;
      }
    }
    // Unsupported method
    return null;
  }
  public parseOpenXml(
    buffer: Buffer,
    mime: string,
    kind: "docx" | "pptx" | "xlsx"
  ): DocSpecs {
    const entries = this.readCentralDirectory(buffer);
    const byName = new Map(entries.map(e => [e.name, e] as const));
    const core = byName.get("docProps/core.xml");
    const app = byName.get("docProps/app.xml");
    const coreXml = core ? this.readLocalFileData(buffer, core) : null;
    const appXml = app ? this.readLocalFileData(buffer, app) : null;

    let author: string | null = null;
    let subject: string | null = null;
    let keywords: string[] | null = null;
    let createdDate: string | null = null;
    let modifiedDate: string | null = null;

    if (coreXml) {
      const s = this.toSafeString(coreXml);
      const get = (tag: string) =>
        s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      author = get("dc:creator")?.[1]?.trim() ?? null;
      subject = get("dc:subject")?.[1]?.trim() ?? null;
      const kw = get("cp:keywords")?.[1]?.trim() ?? null;
      keywords = kw
        ? kw
            .split(/[,;]/)
            .map(x => x.trim())
            .filter(Boolean)
        : null;
      createdDate = get("dcterms:created")?.[1]?.trim() ?? null;
      modifiedDate = get("dcterms:modified")?.[1]?.trim() ?? null;
    }

    let pageCount: number | null = null;
    let wordCount: number | null = null;
    if (appXml) {
      const s = this.toSafeString(appXml);
      const getNum = (tag: string) => {
        const m = s.match(new RegExp(`<${tag}[^>]*>([0-9]+)<\\/${tag}>`));
        return m?.[1] ? Number.parseInt(m[1], 10) : null;
      };
      if (kind === "docx") {
        pageCount = getNum("Pages");
        wordCount = getNum("Words");
      } else if (kind === "pptx") {
        const slides = getNum("Slides");
        pageCount = slides ?? null;
      } else if (kind === "xlsx") {
        const sheets = getNum("Worksheets");
        pageCount = sheets ?? null;
      }
    }

    // Optional: quick text preview from primary document part (best effort)
    let textPreview: string | null = null;
    let extraKeywords = Array.of<string>();
    if (kind === "docx") {
      const docEntry = byName.get("word/document.xml");
      if (docEntry) {
        const data = this.readLocalFileData(buffer, docEntry);
        if (data) {
          const xml = this.toSafeString(data);
          // Extract text from w:t nodes
          const t = xml
            .replace(/<w:\w+[^>]*>/g, " ")
            .replace(/<\/w:\w+>/g, " ")
            .replace(/<\/?[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          textPreview = this.firstN(t, 280);
          if (textPreview) {
            const words = this.countWords(textPreview);
            wordCount ??= words;
          }
        }
      }
    } else if (kind === "xlsx") {
      // Count worksheets by listing entries and parse sheet names
      const worksheetCount = entries.filter(e =>
        e.name.startsWith("xl/worksheets/sheet")
      ).length;
      if (worksheetCount) pageCount = worksheetCount;

      const workbook = byName.get("xl/workbook.xml");
      let hasHiddenSheets = false;
      if (workbook) {
        const data = this.readLocalFileData(buffer, workbook);
        if (data) {
          const xml = this.toSafeString(data);
          const sheets = Array.from(
            xml.matchAll(/<sheet[^>]+name="([^"]+)"/g),
            m => m?.[1] ?? ""
          );
          if (sheets.length) extraKeywords = sheets;
          if (/state="(?:hidden|veryHidden)"/.test(xml)) hasHiddenSheets = true;
        }
      }

      // Use shared strings for preview and rough word count
      const sharedStrings = byName.get("xl/sharedStrings.xml");
      if (sharedStrings) {
        const data = this.readLocalFileData(buffer, sharedStrings);
        if (data) {
          const xml = this.toSafeString(data);
          const textNodes = Array.from(
            xml.matchAll(/<t[^>]*>([^<]+)<\/t>/g),
            m => m[1]
          );
          if (textNodes.length) {
            wordCount = textNodes.join(" ").split(/\s+/).filter(Boolean).length;
            const preview = textNodes.slice(0, 10).join(" ");
            textPreview = this.firstN(preview, 200);
          }
        }
      }

      // Analyze first few worksheets for dimensions and formulas
      let totalRows = 0;
      let hasFormulas = false;
      const worksheetEntries = entries.filter(
        e => e.name.startsWith("xl/worksheets/sheet") && e.name.endsWith(".xml")
      );
      for (const entry of worksheetEntries.slice(0, 3)) {
        const data = this.readLocalFileData(buffer, entry);
        if (!data) continue;
        const xml = this.toSafeString(data);
        const dim = xml.match(/<dimension\s+ref="([A-Z]+\d+):([A-Z]+\d+)"/);
        if (dim?.[2]) {
          const end = dim[2];
          const m = end.match(/^([A-Z]+)(\d+)$/);
          if (m?.[2]) {
            const row = Number.parseInt(m[2], 10);
            if (!Number.isNaN(row)) totalRows = Math.max(totalRows, row);
          }
        }
        if (!hasFormulas && (xml.includes("<f>") || xml.includes("<f ")))
          hasFormulas = true;
      }

      // Detect features from entry names
      const entryNames = new Set(entries.map(e => e.name));
      const hasPivotTables = entries.some(e => e.name.includes("pivotTable"));
      const hasCharts = entries.some(e => e.name.includes("/charts/"));
      const hasMacros = entryNames.has("xl/vbaProject.bin");
      const hasConnections = entryNames.has("xl/connections.xml");
      const hasCustomXml = entries.some(e => e.name.startsWith("customXml/"));

      if (hasHiddenSheets) extraKeywords.push("hidden-sheets");
      if (hasFormulas) extraKeywords.push("formulas");
      if (hasPivotTables) extraKeywords.push("pivot-tables");
      if (hasCharts) extraKeywords.push("charts");
      if (hasMacros) extraKeywords.push("macros");
      if (hasConnections) extraKeywords.push("connections");
      if (hasCustomXml) extraKeywords.push("custom-xml");

      // Use rows as lineCount if available
      if (totalRows > 0) {
        // Thread through via closure variable in return below using local capture
        // We'll set lineCount after keywords merge below
      }
    }

    return {
      type: "DOCUMENT",
      format: kind,
      mimeType: mime,
      pageCount,
      wordCount,
      lineCount: (() => {
        if (kind === "xlsx") {
          // recompute minimal rows using same small scan to avoid storing temp across branches
          const worksheetEntries = entries.filter(
            e =>
              e.name.startsWith("xl/worksheets/sheet") &&
              e.name.endsWith(".xml")
          );
          let totalRows = 0;
          for (const entry of worksheetEntries.slice(0, 3)) {
            const data = this.readLocalFileData(buffer, entry);
            if (!data) continue;
            const xml = this.toSafeString(data);
            const dim = xml.match(/<dimension\s+ref="([A-Z]+\d+):([A-Z]+\d+)"/);
            if (dim?.[2]) {
              const end = dim[2];
              const m = end.match(/^([A-Z]+)(\d+)$/);
              if (m?.[2]) {
                const row = Number.parseInt(m[2], 10);
                if (!Number.isNaN(row)) totalRows = Math.max(totalRows, row);
              }
            }
          }
          return totalRows || null;
        }
        return null;
      })(),
      language: null,
      encoding: null,
      author,
      subject,
      keywords: (() => {
        const base = keywords ?? [];
        return base.concat(extraKeywords).filter(Boolean).length
          ? base.concat(extraKeywords)
          : keywords;
      })(),
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: null,
      isLinearized: null,
      textPreview,
      createdDate,
      modifiedDate
    } satisfies DocSpecs;
  }
  protected async readBytes(stream: Readable) {
    return new Promise((resolve: (value: Buffer) => void, reject) => {
      const chunks = Array.of<Buffer>();
      let totalBytes = 0;

      const cleanup = () => {
        stream.removeAllListeners();
        stream.destroy();
      };

      stream.on("error", err => {
        cleanup();
        reject(err);
      });

      stream.on("data", (chunk: Buffer) => {
        const remaining = chunk.length - totalBytes;
        if (chunk.length <= remaining) {
          chunks.push(chunk);
          totalBytes += chunk.length;
        } else {
          // Take only what we need
          chunks.push(chunk.subarray(0, remaining));
          totalBytes = chunk.length;
        }

        if (totalBytes >= chunk.length) {
          cleanup();
          resolve(Buffer.concat(chunks));
        }
      });

      stream.on("end", () => {
        cleanup();
        resolve(Buffer.concat(chunks));
      });
    });
  }

  public async extractDocViaStream(stream: Readable, mime: string) {
    const header = await this.readBytes(stream);
    return this.getDocumentSpecsWorkup(header, mime);
  }
  public async extractDocViaPath(filePath: string, mime: string) {
    const stream = createReadStream(relative(process.cwd(), filePath));
    return await this.extractDocViaStream(stream, mime);
  }

  // public getDocumentSpecsWorkup(
  //   rawBuffer: Buffer<ArrayBufferLike>,
  //   mime: "application/pdf",
  //   filename?: string
  // ): DocSpecs<PdfImageAnalysisMetadata>;

public  getDocumentSpecsWorkup(buffer: Buffer<ArrayBufferLike>, mime: "application/pdf", fileName?: string): DocSpecs<PdfImageAnalysisMetadata>
public  getDocumentSpecsWorkup(buffer: Buffer<ArrayBufferLike>, mime: string, fileName?: string): DocSpecs<unknown>
  public getDocumentSpecsWorkup(
    rawbuffer: Buffer<ArrayBufferLike>,
    mime: string,
    filename?: string
  ) {
    const buffer = rawbuffer;
    let ext = this.getExtFromFilename(filename);

    // PDF

      if (mime === "application/pdf") {
        ext="pdf";
        return this.parsePdf(buffer, mime);
      } else if (
        buffer?.length >= 5 &&
        buffer.toString("latin1", 0, 5) === "%PDF-"
      ) {
        return this.parsePdf(buffer, "application/pdf");
      }


    // RTF
    if (
      mime === "application/rtf" ||
      (buffer?.length >= 5 && buffer.toString("latin1", 0, 5) === "{\\rtf")
    ) {
      ext="rtf"
      return this.parseRtf(buffer, mime);
    }

    // OpenXML containers (docx, pptx, xlsx) start with PK\x03\x04 and have specific Content_Types
    const isZip = buffer?.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50;
    if (isZip) {
      const kindFromMime: Record<string, "docx" | "pptx" | "xlsx" | undefined> =
        {
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            "docx",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            "pptx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            "xlsx"
        };
      const kind =
        kindFromMime[mime] ??
        (ext === "docx"
          ? "docx"
          : ext === "pptx"
            ? "pptx"
            : ext === "xlsx"
              ? "xlsx"
              : undefined);
      if (kind) {
        ext=kind;
        return this.parseOpenXml(buffer, mime, kind);
      }
    }

    // Plain text-ish and code files
    if (
      mime in mimeToExt) {
        const m = mime as keyof typeof mimeToExt;
         ext =  mimeToExt[m][0];
      return this.parsePlainText(buffer, mime, filename);
    }

    // Legacy Office (doc/xls/ppt) or unknown binary: basic stub
    const fallbackFormat =
      ext === "doc"
        ? "doc"
        : ext === "xls"
          ? "xls"
          : ext === "ppt"
            ? "ppt"
            : "bin";
    return {
      type: "DOCUMENT",
      format: fallbackFormat,
      mimeType: mime,
      pageCount: null,
      wordCount: null,
      lineCount: null,
      language: null,
      encoding: null,
      author: null,
      subject: null,
      keywords: null,
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: null,
      isLinearized: null,
      textPreview: null,
      createdDate: null,
      modifiedDate: null,
      metadata: {}
    } satisfies DocSpecs;
  }
}

export type CommonApplicationMimeTypes =
  | "application/pdf"
  | "application/rtf"
  | "application/json"
  | "application/xml"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/dash+xml"
  | "application/epub+zip"
  | "application/font-sfnt"
  | "application/gzip"
  | "application/java-archive"
  | "application/jsonc"
  | "application/jsonl"
  | "application/json5"
  | "application/ld+json"
  | "application/manifest+json"
  | "application/msword"
  | "application/node"
  | "application/octet-stream"
  | "application/ogg"
  | "application/sql"
  | "application/text"
  | "application/toml"
  | "application/vnd.amazon.ebook"
  | "application/vnd.apple.installer+xml"
  | "application/vnd.apple.mpegurl"
  | "application/vnd.apple.pkpass"
  | "application/vnd.json5"
  | "application/vnd.mozilla.xul+xml"
  | "application/vnd.ms-excel"
  | "application/vnd.ms-fontobject"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.oasis.opendocument.presentation"
  | "application/vnd.oasis.opendocument.spreadsheet"
  | "application/vnd.oasis.opendocument.text"
  | "application/vnd.rar"
  | "application/vnd.visio"
  | "application/wasm"
  | "application/x-7z-compressed"
  | "application/x-abiword"
  | "application/x-bzip"
  | "application/x-bzip2"
  | "application/x-cdf"
  | "application/x-csh"
  | "application/x-freearc"
  | "application/x-gzip"
  | "application/x-httpd-php"
  | "application/x-mdx"
  | "application/x-ndjson"
  | "application/x-python-code"
  | "application/x-sh"
  | "application/x-tar"
  | "application/x-zip-compressed"
  | "application/xhtml+xml"
  | "application/yaml"
  | "application/zip"
  | "text/css"
  | "text/csv"
  | "text/event-stream"
  | "text/html"
  | "text/javascript"
  | "text/markdown"
  | "text/plain"
  | "text/rust"
  | "text/typescript"
  | "text/vtt"
  | "text/x-c"
  | "text/x-c++"
  | "text/x-csharp"
  | "text/x-go"
  | "text/x-java"
  | "text/x-jsonl"
  | "text/x-php"
  | "text/x-python"
  | "text/x-ruby"
  | "text/x-script.python"
  | "text/x-tex"
  | "text/xml";

// type UIO = keyof typeof mimeToExt;

// type Filter<T> = T extends `text/${infer U}` ? `text/${U}` : never;

// type MMMM = Filter<UIO>;

// const OOOOOOOREAILY = (props: MMMM[]) => {
//   return [...props] as const;
// };
