import type {
  PdfImageAnalysisMeta,
  PdfImageEncodingCounts,
  PdfImageEntry
} from "@/types/index.ts";
import { DocWorkupService } from "@/docs/workup.ts";

interface PageXObjectMap {
  /** Maps XObject name (e.g., "X8") to page number */
  xObjectToPage: Map<string, number>;
  /** Maps object ID to XObject name for reverse lookup */
  objectIdToXObjectName: Map<string, string>;
}

export interface xObjPdfEntity {
  xObjId: string;
  structParent: number;
  pageNumber: number;
  pageContentObjId: string;
  imageObjId: string;
}
export class DocImgWorkupService extends DocWorkupService {
  private xObjEntryRegex = /\/X(\d+)\s+(\d+)\s+0\s+R/g;
  private xObjInfoCaptureRegex =
    /\/XObject\s*<<([\s\S]*?)>>(?:(?!>>\s*endobj)[\s\S])*?\/StructParents\s+(\d+)(?:(?!>>\s*endobj)[\s\S])*?\/Type\s*\/Page/g;

private pageObjPattern = /(\d+)\s+0\s+obj\s*(<<[\s\S]*?>>)\s*endobj/g;

private extensiveObjMapper = /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>\s*endobj)/g;

public xObjectMapperNew(pdfText: string): xObjPdfEntity[] {
  const results: xObjPdfEntity[] = [];

  // Build object map for indirect resolution
  const objectMap = new Map<number, string>();
  const objPattern = /(\d+)\s+0\s+obj\s*(<<[\s\S]*?)\s*endobj/g;

  for (const match of pdfText.matchAll(objPattern)) {
    const objId = parseInt(match[1] ?? "0", 10);
    const content = match[2];
    if (objId > 0 && content) {
      objectMap.set(objId, content);
    }
  }

  // Find Page objects (not Pages!)
  for (const [_objId, content] of objectMap) {
    // Must be /Type /Page, NOT /Type /Pages
    if (/\/Type\s*\/Pages/.test(content)) continue; // extra safety

    // Extract StructParents
    const structMatch = content.match(/\/StructParents\s+(\d+)/);
    if (!structMatch?.[1]) continue;

    const structParent = parseInt(structMatch[1], 10);
    const pageNumber = structParent + 1;

    // Resolve XObject dict (inline or indirect)
    const xObjectDict = this.resolveXObjectDict(content, objectMap);
    if (!xObjectDict) continue;

    // Parse entries
    const xObjEntryPattern = /\/Im(\d+)\s+(\d+)\s+0\s+R|\/X(\d+)\s+(\d+)\s+0\s+R/g;
    for (const entry of xObjectDict.matchAll(xObjEntryPattern)) {
      const prefix = entry[0];
      const xNum = entry[1];
      const imgObjId = entry[2];

      if (prefix && xNum && imgObjId) {

        results.push({
          imageObjId: `${imgObjId} 0 obj`,
          pageContentObjId: `${xNum} 0 obj`,
          pageNumber,
          structParent,
          xObjId: prefix.startsWith("/Im") ? `/Im${xNum} ${imgObjId} 0 R` : `/X${xNum} ${imgObjId} 0 R`,
        });
      }
    }
  }

  return results;
}

private resolveXObjectDict(
  pageDict: string,
  objectMap: Map<number, string>
): string | null {
  // Try inline /Resources << /XObject << >> >>
  // Use greedy match for nested brackets
  const inlineXObj = pageDict.match(/\/XObject\s*<<([^>]*(?:>[^>]*)*)>>/g);
  if (inlineXObj?.[1]) {
    return inlineXObj[1];
  }

  // Try indirect /Resources N 0 R
  const resourcesRef = pageDict.match(/\/Resources\s+(\d+)\s+0\s+R/g);
  if (resourcesRef?.[1]) {
    const resourcesObj = objectMap.get(parseInt(resourcesRef[1], 10));
    if (resourcesObj) {
      // Check for inline XObject in Resources
      const xObjMatch = resourcesObj.match(/\/XObject\s*<<([^>]+)>>/g);
      if (xObjMatch?.[1]) return xObjMatch[1];

      // Check for indirect XObject
      const xObjRef = resourcesObj.match(/\/XObject\s+(\d+)\s+0\s+R/g);
      if (xObjRef?.[1]) {
        const xObjObj = objectMap.get(parseInt(xObjRef[1], 10));
        const dictMatch = xObjObj?.match(/<<([^>]+)>>/);
        return dictMatch?.[1] ?? null;
      }
    }
  }

  return null;
}
  // public xObjectMapper(pdfText: string) {
  //   const expandedArray = Array.of<xObjPdfEntity>();
  //   for (const m of pdfText.matchAll(this.xObjInfoCaptureRegex)) {
  //     if (m?.[1]) {
  //       const xDict = m[1].trim();
  //       const structParent = Number.parseInt(m?.[2] ?? "0", 10);
  //       const pageNumber = structParent + 1;
  //       for (const e of xDict.matchAll(this.xObjEntryRegex)) {
  //         const pageObj = e?.[1];
  //         const imgObj = e?.[2];
  //         if (pageObj && imgObj) {
  //           expandedArray.push({
  //             imageObjId: this.toObjId(imgObj),
  //             pageContentObjId: this.toObjId(pageObj),
  //             pageNumber,
  //             structParent,
  //             xObjId: this.toXObjId(pageObj, imgObj)
  //           });
  //         }
  //       }
  //     }
  //   }
  //   return expandedArray;
  // }

  /**
   * Extract a numeric field from a PDF object block
   */
  private extractNumericField(block: string, field: string) {
    const pattern = new RegExp(`\\/${field}\\s+(\\d+)`);
    const match = block.match(pattern);
    return match?.[1] ? parseInt(match[1], 10) : null;
  }

  /**
   * Extract a string/name field from a PDF object block
   * Handles both simple names (/ColorSpace /DeviceRGB) and references (/ColorSpace 10 0 R)
   */
  private extractNameField(block: string, field: string) {
    // Try simple name first: /Field /Value
    const namePattern = new RegExp(`\\/${field}\\s+\\/([A-Za-z0-9]+)`);
    const nameMatch = block.match(namePattern);
    if (nameMatch?.[1]) return nameMatch[1];

    // Try object reference: /Field 10 0 R
    const refPattern = new RegExp(`\\/${field}\\s+(\\d+\\s+\\d+\\s+R)`);
    const refMatch = block.match(refPattern);
    if (refMatch?.[1]) return `ref:${refMatch[1].replace(/\s+/g, " ")}`;

    // Try array format: /Field [/Value ...] (common for Filter)
    const arrayPattern = new RegExp(`\\/${field}\\s+\\[([^\\]]+)\\]`);
    const arrayMatch = block.match(arrayPattern);
    if (arrayMatch?.[1]) {
      const names = arrayMatch[1].match(/\/([A-Za-z0-9]+)/g);
      return names ? names.map(n => n.slice(1)).join(",") : null;
    }

    return null;
  }
  /**
   * Determine encoding type from filter value
   */
  private filterToEncoding(filter: string | null) {
    if (!filter) return "unknown";

    const f = filter.toLowerCase();
    if (f.includes("dctdecode")) return "jpeg";
    if (f.includes("jpxdecode")) return "jpeg2000";
    if (f.includes("ccittfaxdecode")) return "ccitt-fax";
    if (f.includes("jbig2decode")) return "jbig2";
    if (f.includes("flatedecode")) return "png-like";

    return "unknown";
  }
  private parseImageBlock(block: string, objectId: string | null) {
    const filter = this.extractNameField(block, "Filter");

    return {
      objectId,
      width: this.extractNumericField(block, "Width"),
      height: this.extractNumericField(block, "Height"),
      colorSpace: this.extractNameField(block, "ColorSpace"),
      bitsPerComponent: this.extractNumericField(block, "BitsPerComponent"),
      encoding: this.filterToEncoding(filter),
      filter,
      sMask: this.extractNameField(block, "SMask"),
      colorTransform: this.extractNumericField(block, "ColorTransform"),
      pageNumber: 0, // Populated later if page mapping succeeds
      isInline: false
    } satisfies PdfImageEntry;
  }
  /**
   * Build a mapping of XObject names to page numbers by parsing page resource dictionaries
   */
  private buildPageXObjectMap(text: string) {
    const xObjectToPage = new Map<string, number>();
    const objectIdToXObjectName = new Map<string, string>();

    // Find page objects with their XObject resources
    // Pattern matches: /Type /Page ... /XObject << /X8 66 0 R ... >>
    const pagePattern =
      /(\d+)\s+\d+\s+obj[^]*?\/Type\s*\/Page[^]*?\/XObject\s*<<([^>]+)>>/g;

    let pageMatch: RegExpExecArray | null;
    let pageNumber = 0;

    // Also need to find StructParents to determine actual page number
    const structParentsPattern =
      /(\d+)\s+\d+\s+obj[^]*?\/Type\s*\/Page[^]*?\/StructParents\s+(\d+)/g;
    const structParentsMap = new Map<string, number>();

    let spMatch: RegExpExecArray | null;
    while ((spMatch = structParentsPattern.exec(text)) !== null) {
      if (spMatch[1] && spMatch[2]) {
        // StructParents is 0-indexed, page numbers are 1-indexed
        structParentsMap.set(spMatch[1], parseInt(spMatch[2], 10) + 1);
      }
    }

    while ((pageMatch = pagePattern.exec(text)) !== null) {
      const pageObjId = pageMatch[1];
      const xObjectDict = pageMatch[2];

      // Determine page number from StructParents if available, otherwise increment
      pageNumber = structParentsMap.get(pageObjId ?? "") ?? ++pageNumber;

      // Parse XObject dictionary: /X8 66 0 R /X16 72 0 R
      const xObjRefPattern = /\/([A-Za-z0-9]+)\s+(\d+)\s+\d+\s+R/g;
      let xObjMatch: RegExpExecArray | null;

      while ((xObjMatch = xObjRefPattern.exec(xObjectDict ?? "")) !== null) {
        const xObjName = xObjMatch[1];
        const targetObjId = xObjMatch[2];

        if (xObjName && targetObjId) {
          xObjectToPage.set(xObjName, pageNumber);
          objectIdToXObjectName.set(targetObjId, xObjName);
        }
      }
    }

    return { xObjectToPage, objectIdToXObjectName } satisfies PageXObjectMap;
  }
  /**
   * Detect and parse XObject images with full metadata extraction
   */
  private detectXObjectImagesNuevo(text: string, pageMap: PageXObjectMap) {
    const images = Array.of<PdfImageEntry>();

    // Find all XObject Image declarations
    const imageObjPattern = /(\d+)\s+\d+\s+obj\s*(<<[\s\S]*?>>)[\s\S]*?endobj/g;

    let match: RegExpExecArray | null;
    const seenIds = new Set<string>();

    while ((match = imageObjPattern.exec(text)) !== null) {
      const objectId = match[1];
      const dictBlock = match[2];

      // Skip if not an image or already processed
      if (!objectId || !dictBlock) continue;
      if (seenIds.has(objectId)) continue;
      if (!/\/Subtype\s*\/Image/.test(dictBlock)) continue;

      seenIds.add(objectId);

      const entry = this.parseImageBlock(dictBlock, objectId);

      // Try to map to page number
      const xObjName = pageMap.objectIdToXObjectName.get(objectId);
      if (xObjName) {
        const xObjPage = pageMap.xObjectToPage.get(xObjName);
        if (xObjPage) {
          entry.pageNumber = xObjPage;
        }
      }

      images.push(entry);
    }

    return images;
  }
  /**
   * Detect inline images (BI ... ID ... EI blocks)
   * These have limited metadata available
   */
  private detectInlineImagesNuevo(text: string) {
    const images = Array.of<PdfImageEntry>();

    // Inline image format: BI <params> ID <data> EI
    // Params use abbreviated names: /W for Width, /H for Height, etc.
    const inlinePattern = /\sBI\s([\s\S]*?)\sID[\s\S]*?\sEI\s/g;

    let match: RegExpExecArray | null;
    let inlineIndex = 0;

    while ((match = inlinePattern.exec(text)) !== null) {
      const params = match[1] ?? "";

      // Parse abbreviated inline image parameters
      const widthMatch = params.match(/\/W(?:idth)?\s+(\d+)/);
      const heightMatch = params.match(/\/H(?:eight)?\s+(\d+)/);
      const bpcMatch = params.match(/\/BPC|\/BitsPerComponent\s+(\d+)/);
      const csMatch = params.match(/\/CS|\/ColorSpace\s+\/(\w+)/);
      const filterMatch = params.match(/\/F(?:ilter)?\s+\/(\w+)/);

      const filter = filterMatch?.[1] ?? null;

      images.push({
        objectId: `inline-${inlineIndex++}`,
        width: widthMatch?.[1] ? parseInt(widthMatch[1], 10) : null,
        height: heightMatch?.[1] ? parseInt(heightMatch[1], 10) : null,
        colorSpace: csMatch?.[1] ?? null,
        bitsPerComponent: bpcMatch?.[1] ? parseInt(bpcMatch[1], 10) : null,
        encoding: filter ? this.filterToEncoding(filter) : "inline",
        filter,
        sMask: null, // Inline images don't support SMask
        colorTransform: null,
        pageNumber: null, // Would need content stream parsing to determine
        isInline: true
      });
    }

    return images;
  }

  /**
   * Detect images in compressed object streams
   */
  private detectImagesInCompressedStreamsNuevo(buffer: Buffer) {
    const images = Array.of<PdfImageEntry>();

    try {
      const text = buffer.toString("latin1");
      const objStreams = this.parseObjectStreams(buffer, text);
      const flateStreams = this.decompressFlateStreams(buffer);

      let compressedIndex = 0;

      for (const content of [...objStreams, ...flateStreams]) {
        // Find image dictionaries in decompressed content
        const dictPattern = /(<<[\s\S]*?\/Subtype\s*\/Image[\s\S]*?>>)/g;
        let dictMatch: RegExpExecArray | null;

        while ((dictMatch = dictPattern.exec(content)) !== null) {
          const dictBlock = dictMatch[1];
          if (!dictBlock) continue;

          const entry = this.parseImageBlock(
            dictBlock,
            `compressed-${compressedIndex++}`
          );
          images.push(entry);
        }
      }
    } catch {
      // Decompression failed - return empty
    }

    return images;
  }
  /**
   * Check for vector graphics (Form XObjects, paths, etc.)
   */
  private detectVectorGraphicsNuevo(text: string) {
    const hasFormXObjects = /\/Subtype\s*\/Form/.test(text);
    const hasComplexPaths =
      /\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+c/.test(
        text
      );
    const hasShading =
      /\/ShadingType\s+\d/.test(text) || /\/Pattern/.test(text);

    return hasFormXObjects || hasComplexPaths || hasShading;
  }

  private buildEncodingCounts(images: PdfImageEntry[]) {
    const counts: PdfImageEncodingCounts = {};

    for (const img of images) {
      counts[img.encoding] = (counts[img.encoding] ?? 0) + 1;
    }

    return counts;
  }

  /**
   * Check for fax-style encodings in encoding counts
   */
  private hasFaxEncodingNuevo(counts: PdfImageEncodingCounts) {
    return (counts["ccitt-fax"] ?? 0) > 0 || (counts["jbig2"] ?? 0) > 0;
  }

  /**
   * Assess structural indicators of a scanned PDF
   */
  private assessScannedIndicators(
    text: string,
    encodingCounts: PdfImageEncodingCounts
  ) {
    const textBlocks = text.match(/BT[\s\S]*?ET/g) ?? [];
    const hasToUnicode = /\/ToUnicode/.test(text);

    return {
      hasFaxEncoding: this.hasFaxEncodingNuevo(encodingCounts),
      textBlockCount: textBlocks.length,
      hasToUnicode
    };
  }
  private analyzePdfImagesNuevo(buffer: Buffer, pageCount: number | null) {
    const text = buffer.toString("latin1");
    const pages = pageCount ?? 1;

    // Build page-to-XObject mapping for image location tracking
    const pageMap = this.buildPageXObjectMap(text);

    // Collect images from all sources
    const xObjectImages = this.detectXObjectImagesNuevo(text, pageMap);
    const inlineImages = this.detectInlineImagesNuevo(text);
    const compressedImages = this.detectImagesInCompressedStreamsNuevo(buffer);

    // Combine all images
    const allImages = [...xObjectImages, ...inlineImages, ...compressedImages];

    // Build aggregated metrics
    const encodingCounts = this.buildEncodingCounts(allImages);
    const totalImages = allImages.length;

    return {
      hasImages: totalImages > 0,
      imageCount: totalImages,
      imagesPerPage: totalImages / pages,
      xObjectImageCount: xObjectImages.length,
      inlineImageCount: inlineImages.length,
      images: allImages,
      encodingCounts,
      hasVectorGraphics: this.detectVectorGraphicsNuevo(text),
      scannedIndicators: this.assessScannedIndicators(text, encodingCounts)
    } satisfies PdfImageAnalysisMeta;
  }

  protected cleanPdfImgAnalysisNuevo(
    buffer: Buffer,
    pageCount: number | null
  ): PdfImageAnalysisMeta {
    return this.analyzePdfImagesNuevo(buffer, pageCount);
  }
}
