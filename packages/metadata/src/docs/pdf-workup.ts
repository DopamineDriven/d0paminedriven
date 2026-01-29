import { inflateRawSync, inflateSync } from "node:zlib";
import { MimeWorkupService } from "@/docs/mime-workup.ts";

export class PdfWorkupService extends MimeWorkupService {

    /**
   * Decompress all streams in a PDF - tries to inflate everything
   * Permissive: grabs all stream...endstream blocks and attempts decompression
   * If decompression fails (not compressed or different encoding), silently skips
   */
public decompressFlateStreams(buffer: Buffer) {
  const decompressed: string[] = [];
  const text = buffer.toString("latin1");

  // Capture full object dict, not just immediate <<>> before stream
  const streamPattern = /(\d+)\s+0\s+obj\s*(<<[\s\S]*?>>)\s*stream\r?\n/g;

  let match: RegExpExecArray | null;
  while ((match = streamPattern.exec(text)) !== null) {
    try {
      const dictText = match[2] ?? "";

      // Skip non-FlateDecode streams
      if (!/\/Filter\s*\/FlateDecode|\/Filter\s*\[.*?\/FlateDecode/.test(dictText)) {
        continue;
      }

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

      const trimmed = new Uint8Array(compressedData.subarray(0, dataEnd));
      const inflated = this.grokDecompressStream(trimmed, dictText);

      if (inflated.length > 0) {
        decompressed.push(Buffer.from(inflated).toString("latin1"));
      }
    } catch {
      continue;
    }
  }

  return decompressed;
}

  /**
   * Parse Object Streams (/Type /ObjStm) used by Acrobat-optimized PDFs
   * These bundle multiple objects into compressed containers
   */
  public parseObjectStreams(buffer: Buffer, text: string) {
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

        // Try raw deflate first, then zlib-wrapped
        let decompressed: Buffer;
        try {
          decompressed = inflateRawSync(trimmedData);
        } catch {
          decompressed = inflateSync(trimmedData);
        }
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
  protected decodePdfString(str: string) {
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


  public grokDefilterPNG(
    data: Uint8Array<ArrayBuffer>,
    columns: number,
    predictor: number
  ) {
    if (columns <= 0) return data;

    const bytesPerPixel = 1; // Always 1 for PDF byte streams (XRef/ObjStm)
    const bytesPerRow = columns * bytesPerPixel;

    let rowSize = bytesPerRow;
    let hasFilterByte = false;

    if (predictor === 2) {
      // TIFF Predictor 2: no filter byte, always Sub
      hasFilterByte = false;
    } else if (predictor >= 10 && predictor <= 15) {
      // PNG: filter byte per row
      hasFilterByte = true;
      rowSize += 1;
    } else {
      // No prediction or unknown
      return data;
    }

    // Validate alignment
    if (data.length % rowSize !== 0) {
      return data; // Misaligned → return raw
    }

    const height = data.length / rowSize;
    const out = new Uint8Array(bytesPerRow * height);
    let outPos = 0;
    let prevRow = new Uint8Array(bytesPerRow);

    for (let row = 0; row < height; row++) {
      let filterType = 1; // Default to Sub (1) for Predictor 2
      let rowDataStart = row * rowSize;
      let dataRowStart = data?.[rowDataStart++];
      if (hasFilterByte && dataRowStart) {
        filterType = dataRowStart;
        // Optional validation for fixed predictors 10-14
        // const expected = predictor - 10; // 10→0 None, 11→1 Sub, 12→2 Up, etc.
        // if (predictor < 15 && filterType !== expected) { /* warn? */ }
      }

      for (let x = 0; x < bytesPerRow; x++) {
        const rawByte = data?.[rowDataStart + x] ?? 0;
        const left = out?.[outPos - bytesPerPixel];
        const a = x >= bytesPerPixel && left ? left : 0; // left
        const above = prevRow?.[x];
        const b = above ?? 0; // above
        const aboveLeft = prevRow?.[x - bytesPerPixel];
        const c = x >= bytesPerPixel && aboveLeft ? aboveLeft : 0; // above-left

        let prior = 0;
        switch (filterType) {
          case 0:
            prior = 0;
            break;
          case 1:
            prior = a;
            break; // Sub
          case 2:
            prior = b;
            break; // Up
          case 3:
            prior = Math.floor((a + b) / 2);
            break; // Average
          case 4: // Paeth
            let p = a + b - c;
            const pa = Math.abs(p - a);
            const pb = Math.abs(p - b);
            const pc = Math.abs(p - c);
            prior = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
            break;
          default:
            prior = 0;
        }

        out[outPos++] = (rawByte + prior) & 0xff;
      }

      prevRow = out.subarray(row * bytesPerRow, (row + 1) * bytesPerRow);
    }

    return out as Uint8Array<ArrayBuffer>;
  }
  public grokDecompressStream(
    streamData: Uint8Array<ArrayBuffer>,
    dictText: string
  ) {
    let data = new Uint8Array(streamData);

    // Parse /Filter
    let filters: string[] = [];
    const filterArrayMatch = dictText.match(/\/Filter\s*\[([^\[\]]+)\]/);
    if (filterArrayMatch?.[1]) {
      filters = filterArrayMatch[1]
        .trim()
        .split(/\s+/)
        .map(s => s.replace(/^\//, ""));
    } else {
      const singleMatch = dictText.match(/\/Filter\s*\/(\w+)/);
      if (singleMatch?.[1]) filters = [singleMatch[1]];
    }

    // Parse /DecodeParms (or array of parms if multiple filters)
    let predictor = 1;
    let columns = 1; // safe default for non-image/XRef cases
    const parmsMatch = dictText.match(/\/DecodeParms\s*<<([^>]*)>>/);
    if (parmsMatch?.[1]) {
      const parmsText = parmsMatch[1];
      const predMatch = parmsText.match(/\/Predictor\s+(\d+)/);
      const colMatch = parmsText.match(/\/Columns\s+(\d+)/);
      if (predMatch?.[1]) predictor = parseInt(predMatch[1], 10);
      if (colMatch?.[1]) columns = parseInt(colMatch[1], 10);
    }

    // Apply filters in reverse order (PDF spec: last filter in array applied first)
    for (let i = filters.length - 1; i >= 0; i--) {
      const filter = filters[i];
      if (filter === "FlateDecode" || filter === "Flate") {
        try {
          data = inflateSync(data);
        } catch (e) {
          throw new Error(
            "Flate decompression failed: ".concat(
              typeof e === "string" ? e : JSON.stringify(e, null, 2)
            )
          );
        }
      }
      // Add other filters if needed later (ASCII85Decode, etc.)
    }

    // Undo PNG predictor if present (common "nested layer")
    if (predictor >= 10 && predictor <= 15) {
      data = this.grokDefilterPNG(data, columns, predictor);
    }

    return data;
  }

  protected paeth(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  }

    /**
   * Extract page count from object at specific offset
   */
  protected extractPageCountFromObject(buffer: Buffer, offset: number) {
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

    /**
   * Parse cross-reference table to find object offsets
   */
  protected parseXrefTable(text: string) {
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
  protected parseXrefStream(buffer: Buffer, text: string) {
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

      // Try raw deflate first, then zlib-wrapped
      let decompressed: Buffer;
      try {
        decompressed = inflateRawSync(trimmedData);
      } catch {
        decompressed = inflateSync(trimmedData);
      }

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

    // -------- Multi-strategy Page Counts --------

  /**
   * Strategy 1: Direct /Pages /Count in uncompressed content (fastest, high confidence)
   * Finds the ROOT Pages object by looking for the highest /Count value
   */
  protected strategy1DirectPagesCount(text: string) {
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
  protected strategy2Linearized(text: string) {
    // Linearized PDFs have page count in first ~1KB
    const header = text.slice(0, 2048);

    if (/\/Linearized\s+[\d.]+/.test(header)) {
      // /N is the page count in linearized dict
      const nMatch = header.match(/\/N\s+(\d+)/);
      if (nMatch?.[1]) {
        const count = Number.parseInt(nMatch[1], 10);
        if (count > 0 && count < 100000) return count;
      }
    }

    return null;
  }

  /**
   * Strategy 3: Follow Catalog -> Pages reference chain (high confidence)
   */
  protected strategy3CatalogChain(buffer: Buffer, text: string) {
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
  protected strategy4DecompressedStreams(buffer: Buffer) {
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
  protected strategy5KidsPageRefs(text: string) {
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
  protected strategy6BruteForce(text: string): number | null {
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
  protected strategy7Estimate(buffer: Buffer, text: string): number | null {
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
   * Extract dates from XMP metadata packet
   * Used as fallback when traditional PDF Info dictionary lacks dates
   */
  protected extractXmpDates(text: string): {
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
}
