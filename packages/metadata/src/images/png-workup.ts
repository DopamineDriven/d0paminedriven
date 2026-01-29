import { inflateSync } from "fflate";
import type {
  ImageSpecs,
  PngDpi,
  PngIccProfileMeta,
  PngMetadata,
  PngXmpFields,
  TextChunksEntity,
  XmpParsed
} from "@/types/index.ts";
import { JpgExtractorWorkup } from "@/images/jpg-workup.ts";

export class PngExtractorWorkup extends JpgExtractorWorkup {
  private readonly XMP_BLOCK_REGEX =
    /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;

  /** Extract x:xmptk from root element */
  private static readonly XMP_TOOLKIT_REGEX = /x:xmptk="([^"]+)"/g;

  /** Match attribute-style values: namespace:key="value" */
  private static readonly XMP_ATTR_REGEX = /([a-z]+):([a-zA-Z]+)="([^"]+)"/g;

  /** Match element-style values: <namespace:key>value</namespace:key> */
  private static readonly XMP_ELEMENT_REGEX =
    /<([a-z]+):([a-zA-Z]+)>(?:<[^>]*>)*([^<]+)/g;

  /** Match stRef:* attributes from DerivedFrom blocks */
  private static readonly STREF_ATTR_REGEX = /stRef:([a-zA-Z]+)="([^"]+)"/g;

  /** Match stEvt:* attributes from History events */
  private static readonly STEVT_ATTR_REGEX = /stEvt:([a-zA-Z]+)="([^"]+)"/g;

  /** Match rdf:li elements for History sequence */
  private static readonly RDF_LI_REGEX = /<rdf:li\s+([^>]+)\/>/g;

  protected xmptkRegex = /(?:\s*:xmptk="([\s\S]*?)"\s*?)/g;
  protected tiffOrientation =
    /(?:<\s*\S*:Orientation>\s*([\s\S]*?)\s*<\/\s*\S*:Orientation>)/g;
  protected xmpCreateDateRegex = /(?:\s*:CreateDate="([\s\S]*?)\s*?")/g;
  protected xmpModifyDateRegex = /(?:\s*:ModifyDate="([\s\S]*?)\s*?")/g;
  protected xmpDateCreatedRegex =
    /(?:<\s*\S*:DateCreated>\s*([\s\S]*?)\s*<\/\s*\S*:DateCreated>)/g;

  /**
   * Extract all XMP blocks from raw text using battle-tested regex
   */
  protected extractXmpBlocks(fullText: string) {
    const blocks: string[] = [];
    for (const match of fullText.matchAll(this.XMP_BLOCK_REGEX)) {
      if (match?.[0]) blocks.push(match[0]);
    }
    return blocks;
  }

  /**
   * Parse a single XMP block into structured intermediate form
   * Single pass - extracts attrs, elements, stRef, and history
   */
  protected parseXmpBlock(block: string): XmpParsed {
    const result: XmpParsed = {
      xmptk: null,
      attrs: {},
      elements: {},
      stRef: {},
      history: []
    };

    // Extract x:xmptk from root element
    const toolkitMatch = block.match(PngExtractorWorkup.XMP_TOOLKIT_REGEX);
    if (toolkitMatch?.[1]) {
      result.xmptk = toolkitMatch[1].trim();
    }

    // Extract attribute-style values (namespace:key="value")
    for (const match of block.matchAll(PngExtractorWorkup.XMP_ATTR_REGEX)) {
      const [, namespace, key, value] = match;
      if (namespace && key && value) {
        result.attrs[namespace] ??= {};
        result.attrs[namespace][key] = value;
      }
    }

    // Extract element-style values (<namespace:key>value</namespace:key>)
    for (const match of block.matchAll(PngExtractorWorkup.XMP_ELEMENT_REGEX)) {
      const [, namespace, key, value] = match;
      if (namespace && key && value?.trim()) {
        result.elements[namespace] ??= {};
        result.elements[namespace][key] = value.trim();
      }
    }

    // Extract stRef attributes from DerivedFrom
    for (const match of block.matchAll(PngExtractorWorkup.STREF_ATTR_REGEX)) {
      const [, key, value] = match;
      if (key && value) {
        result.stRef[key] = value;
      }
    }

    // Extract history events (rdf:li with stEvt:* attributes)
    for (const liMatch of block.matchAll(PngExtractorWorkup.RDF_LI_REGEX)) {
      const liContent = liMatch[1];
      if (liContent?.includes("stEvt:")) {
        const event: Record<string, string> = {};
        for (const evtMatch of liContent.matchAll(
          PngExtractorWorkup.STEVT_ATTR_REGEX
        )) {
          const [, key, value] = evtMatch;
          if (key && value) {
            event[key] = value;
          }
        }
        if (Object.keys(event).length > 0) {
          result.history.push(event);
        }
      }
    }

    return result;
  }

  /**
   * Parse XMP raw string and map to structured PngXmpFields
   * Uses parse-once approach for efficiency
   */
  protected parseXmpFields(xmpRaw: string): PngXmpFields | null {
    const blocks = this.extractXmpBlocks(xmpRaw);
    if (!blocks?.[0]) return null;

    // Use first block (primary metadata)
    const parsed = this.parseXmpBlock(blocks[0]);

    // Helper to get value from attrs first, fall back to elements
    const get = (ns: string, key: string): string | undefined =>
      parsed.attrs[ns]?.[key] ?? parsed.elements[ns]?.[key];

    return {
      // XMP Core
      xmpToolkit: parsed.xmptk ?? undefined,
      creatorTool: get("xmp", "CreatorTool"),
      createDate: get("xmp", "CreateDate"),
      modifyDate: get("xmp", "ModifyDate"),
      metadataDate: get("xmp", "MetadataDate"),

      // XMP Media Management
      documentId: get("xmpMM", "DocumentID"),
      instanceId: get("xmpMM", "InstanceID"),
      originalDocumentId: get("xmpMM", "OriginalDocumentID"),
      renditionClass: get("xmpMM", "RenditionClass"),

      // Derived From (stRef)
      derivedFromDocumentId: parsed.stRef["documentID"],
      derivedFromInstanceId: parsed.stRef["instanceID"],
      derivedFromOriginalDocumentId: parsed.stRef["originalDocumentID"],

      // Dublin Core
      creator: get("dc", "creator"),
      title: get("dc", "title"),
      description: get("dc", "description"),
      format: get("dc", "format"),
      rights: get("dc", "rights"),

      // Photoshop
      colorMode: get("photoshop", "ColorMode"),
      iccProfile: get("photoshop", "ICCProfile"),

      // TIFF
      software: get("tiff", "Software"),
      orientation: get("tiff", "Orientation"),
      xResolution: get("tiff", "XResolution"),
      yResolution: get("tiff", "YResolution"),
      resolutionUnit: get("tiff", "ResolutionUnit"),
      artist: get("tiff", "Artist"),
      copyright: get("tiff", "Copyright"),

      // EXIF
      dateTimeOriginal: get("exif", "DateTimeOriginal"),
      exifColorSpace: get("exif", "ColorSpace"),
      pixelXDimension: get("exif", "PixelXDimension"),
      pixelYDimension: get("exif", "PixelYDimension"),

      // PDF
      producer: get("pdf", "Producer"),

      // Illustrator
      illustratorType: get("illustrator", "Type"),
      creatorSubTool: get("illustrator", "CreatorSubTool"),

      // XMP Paged Text
      nPages: get("xmpTPg", "NPages"),
      hasVisibleTransparency: get("xmpTPg", "HasVisibleTransparency"),
      hasVisibleOverprint: get("xmpTPg", "HasVisibleOverprint"),

      // AI Generation (various conventions)
      aiPrompt: get("ai", "prompt") ?? get("parameters", "prompt"),
      aiModel: get("ai", "model") ?? get("parameters", "model"),
      aiSeed: get("ai", "seed") ?? get("parameters", "seed"),
      aiNegativePrompt:
        get("ai", "negative_prompt") ?? get("parameters", "negative_prompt"),
      aiSampler: get("ai", "sampler") ?? get("parameters", "sampler_name"),
      aiCfgScale: get("ai", "cfg_scale") ?? get("parameters", "cfg_scale"),
      aiSteps: get("ai", "steps") ?? get("parameters", "steps")
    };
  }
  public convertTextChunks(e: TextChunksEntity<true>): TextChunksEntity<false>;
  public convertTextChunks(e: TextChunksEntity<false>): TextChunksEntity<true>;
  public convertTextChunks<const V extends boolean = true | false>({
    iTXt,
    tEXt,
    zTXt
  }: TextChunksEntity<V>) {
    if (
      typeof iTXt === "string" &&
      typeof tEXt === "string" &&
      typeof zTXt === "string"
    ) {
      return {
        iTXt: JSON.parse<Record<string, string>>(iTXt),
        tEXt: JSON.parse<Record<string, string>>(tEXt),
        zTXt: JSON.parse<Record<string, string>>(zTXt)
      } as const satisfies TextChunksEntity<false>;
    } else {
      return {
        iTXt: JSON.stringify(iTXt),
        tEXt: JSON.stringify(tEXt),
        zTXt: JSON.stringify(zTXt)
      } as const satisfies TextChunksEntity<true>;
    }
  }
  public png(buffer: Buffer<ArrayBufferLike>) {
    if (
      buffer.readUInt32BE(8) !== 13 ||
      buffer?.[12] !== 0x49 ||
      buffer?.[13] !== 0x48 ||
      buffer?.[14] !== 0x44 ||
      buffer?.[15] !== 0x52
    ) {
      throw new Error("IHDR Chunk of png not found or incorrect.");
    }
    const textChunks = {
      tEXt: {},
      zTXt: {},
      iTXt: {}
    } as TextChunksEntity<false>;

    const colorType = buffer[25]; // Offset 16 (width) + 4 (height) + 4 (bit depth) + 1 = 25
    let colorModel = "unknown" as ImageSpecs["colorModel"],
      colorSpace = "unknown" as ImageSpecs["colorSpace"],
      hasAlpha = false;
    const bitDepth = buffer[24] ?? null;
    switch (colorType) {
      case 0:
        colorModel = "grayscale";
        colorSpace = "gray";
        break;
      case 2:
        colorModel = "rgb";
        colorSpace = "srgb";
        break;
      case 3:
        colorModel = "indexed";
        colorSpace = "srgb";
        break;
      case 4:
        colorModel = "grayscale-alpha";
        colorSpace = "gray";
        hasAlpha = true;
        break;
      case 6:
        colorModel = "rgba";
        colorSpace = "srgb";
        hasAlpha = true;
        break;
      case undefined:
      default:
        colorModel = "unknown";
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    // For PNG, no native animation (APNG extension via acTL chunk)
    let frames = 1;
    let animated = false;
    let iccProfile: string | null = null;
    let exifDateTimeOriginal: string | null = null;
    let myExifDebug: string | null = null;
    let orientation: number | null = null;

    let dpi: PngDpi | null = null;
    let pixelAspectRatio: number | null = null;
    let iccProfileMeta: PngIccProfileMeta | null = null;
    let xmp: PngXmpFields | string | null = null;
    let modificationTime: string | null = null;
    // Scan chunks
    let pos = 33; // After IHDR (8 sig + 4 len + 4 type + 13 data + 4 crc)
    while (pos < buffer.length - 12) {
      const chunkLen = buffer.readUInt32BE(pos);
      const chunkType = buffer.toString("ascii", pos + 4, pos + 8);
      const chunkData = pos + 8;
      const nextPos = pos + 12 + chunkLen;
      if (chunkType === "acTL") {
        animated = true;
        frames = buffer.readUInt32BE(chunkData); // num_frames
      } else if (chunkType === "iCCP") {
        const nameEnd = buffer.indexOf(0, chunkData);
        const profileName = buffer.toString("ascii", chunkData, nameEnd);
        iccProfile = profileName || "embedded";
        colorSpace = this.mapProfileToColorSpace(profileName, colorSpace);

        // Parse ICC header from decompressed profile
        const compressionMethod = buffer[nameEnd + 1];
        if (compressionMethod) {
          if (compressionMethod === 0) {
            try {
              const compressedProfile = buffer.subarray(
                nameEnd + 2,
                chunkData + chunkLen
              );
              const iccData = Buffer.from(inflateSync(compressedProfile));

              if (iccData.length >= 128) {
                iccProfileMeta = this.parseIccHeader(iccData, profileName);
              }
            } catch {
              // Decompression failed, continue with name only
            }
          }
        }
      } else if (chunkType === "sRGB") {
        if (iccProfile === null) {
          iccProfile = "sRGB";
          colorSpace = "srgb";
        }
      } else if (chunkType === "cHRM") {
        if (
          iccProfile === null &&
          colorModel !== "grayscale" &&
          colorModel !== "grayscale-alpha"
        ) {
          const white_x = buffer.readUInt32BE(chunkData),
            white_y = buffer.readUInt32BE(chunkData + 4),
            red_x = buffer.readUInt32BE(chunkData + 8),
            red_y = buffer.readUInt32BE(chunkData + 12),
            green_x = buffer.readUInt32BE(chunkData + 16),
            green_y = buffer.readUInt32BE(chunkData + 20),
            blue_x = buffer.readUInt32BE(chunkData + 24),
            blue_y = buffer.readUInt32BE(chunkData + 28);
          colorSpace = this.mapChrmToColorSpace(
            {
              white_x,
              white_y,
              red_x,
              red_y,
              green_x,
              green_y,
              blue_x,
              blue_y
            },
            colorSpace
          );
        }
      } else if (chunkType === "pHYs") {
        const pixelsPerUnitX = buffer.readUInt32BE(chunkData);
        const pixelsPerUnitY = buffer.readUInt32BE(chunkData + 4);
        const unit = buffer[chunkData + 8];

        if (unit === 1) {
          // Convert pixels/meter to DPI (1 inch = 0.0254 meters)
          dpi = {
            x: Math.round(pixelsPerUnitX * 0.0254),
            y: Math.round(pixelsPerUnitY * 0.0254),
            unit: "meter"
          };
        } else if (unit === 0 && pixelsPerUnitX > 0 && pixelsPerUnitY > 0) {
          pixelAspectRatio = pixelsPerUnitX / pixelsPerUnitY;
          dpi = {
            x: pixelsPerUnitX,
            y: pixelsPerUnitY,
            unit: "unknown"
          };
        }
      } else if (chunkType === "tEXt") {
        // tEXt: keyword\0text (Latin-1, no compression)
        const nullIndex = buffer.indexOf(0, chunkData);
        if (nullIndex !== -1 && nullIndex < chunkData + chunkLen) {
          const keyword = buffer.toString("latin1", chunkData, nullIndex);
          const text = buffer.toString(
            "latin1",
            nullIndex + 1,
            chunkData + chunkLen
          );
          textChunks.tEXt[keyword] = text;

          if (keyword === "Creation Time" && exifDateTimeOriginal === null) {
            exifDateTimeOriginal = text.trim();
          }
        }
      } else if (chunkType === "iTXt") {
        let offset = chunkData;
        const keywordEnd = buffer.indexOf(0, offset);
        if (keywordEnd === -1) {
          pos = nextPos;
          continue;
        }
        const keyword = buffer.toString("ascii", offset, keywordEnd);
        offset = keywordEnd + 1;
        const compressionFlag = buffer[offset];
        offset += 2; // Skip compression flag + method
        const langEnd = buffer.indexOf(0, offset);
        if (langEnd === -1) {
          pos = nextPos;
          continue;
        }
        offset = langEnd + 1;
        const transEnd = buffer.indexOf(0, offset);
        if (transEnd === -1) {
          pos = nextPos;
          continue;
        }
        offset = transEnd + 1;
        let textBuffer = buffer.subarray(offset, chunkData + chunkLen);
        if (compressionFlag === 1) {
          try {
            textBuffer = Buffer.from(inflateSync(textBuffer));
          } catch {
            pos = nextPos;
            continue;
          }
        }
        const text = textBuffer.toString("utf8");
        let xmpParsed: string | null = null;
        for (const s of text.matchAll(this.XMP_BLOCK_REGEX)) {
          if (s?.[0]) {
            xmpParsed = s[0];
          }
        }
        if (xmp === null && xmpParsed) {
          xmp = xmpParsed;
        }

        if (orientation === null && xmpParsed) {
          for (const ori of xmpParsed.matchAll(this.tiffOrientation)) {
            if (ori?.[0] && ori?.[1]) {
              orientation = Number.parseInt(ori[1]);
            }
          }
        }
        if (myExifDebug === null && xmpParsed) {
          for (const rawDate of xmpParsed.matchAll(this.xmpDateCreatedRegex)) {
            if (rawDate?.[0] && rawDate?.[1]) {
              myExifDebug = rawDate[1];
            }
          }
        }
        if (myExifDebug === null && xmpParsed) {
          for (const rawDate of xmpParsed.matchAll(this.xmpCreateDateRegex)) {
            if (rawDate?.[0] && rawDate?.[1]) {
              myExifDebug = rawDate[1];
            }
          }
        }
        textChunks.iTXt[keyword] = text;

        // Parse XMP if this is the XMP chunk
        if (keyword === "XML:com.adobe.xmp") {
          if (!iccProfile) {
            colorSpace = this.mapXmpToColorSpace(text, colorSpace);
          }
          if (xmp === null) {
            xmp = this.parseXmpFields(text);
          }
        }
        if (keyword === "Creation Time" && !exifDateTimeOriginal) {
          exifDateTimeOriginal = text.trim();
        }
      } else if (chunkType === "zTXt") {
        const chunkStart = chunkData;
        const chunkEnd = chunkData + chunkLen;
        let offset = chunkStart;

        const keywordEnd = buffer.indexOf(0, offset);
        if (keywordEnd === -1 || keywordEnd >= chunkEnd) {
          pos = nextPos;
          continue;
        }

        const keyword = buffer.toString("latin1", offset, keywordEnd);
        offset = keywordEnd + 1;

        if (offset >= chunkEnd) {
          pos = nextPos;
          continue;
        }

        const compressionMethod = buffer[offset];
        offset += 1;

        if (offset >= chunkEnd) {
          pos = nextPos;
          continue;
        }

        const compressedDataLength = chunkEnd - offset;
        if (compressedDataLength <= 0) {
          pos = nextPos;
          continue;
        }

        let textBuffer = buffer.subarray(offset, chunkEnd);

        if (compressionMethod === 0) {
          try {
            if (textBuffer.length < 2) {
              pos = nextPos;
              continue;
            }

            const cmf = textBuffer[0] ?? 0;
            const flg = textBuffer[1] ?? 0;

            if ((cmf * 256 + flg) % 31 !== 0) {
              pos = nextPos;
              continue;
            }

            textBuffer = Buffer.from(inflateSync(textBuffer));
          } catch {
            pos = nextPos;
            continue;
          }
        } else {
          pos = nextPos;
          continue;
        }

        const text = textBuffer.toString("latin1");

        textChunks.zTXt[keyword] = text;

        if (keyword === "Creation Time" && exifDateTimeOriginal === null) {
          exifDateTimeOriginal = text.trim();
        }
      } else if (chunkType === "tIME") {
        const month = buffer?.[chunkData + 2],
          day = buffer?.[chunkData + 3],
          hour = buffer?.[chunkData + 4],
          minute = buffer?.[chunkData + 5],
          second = buffer?.[chunkData + 6];

        // Last modification time, but not DateTimeOriginal; approximate if no EXIF
        if (
          typeof month !== "undefined" &&
          typeof day !== "undefined" &&
          typeof hour !== "undefined" &&
          typeof minute !== "undefined" &&
          typeof second !== "undefined"
        ) {
          const year = buffer.readUInt16BE(chunkData);
          modificationTime = `${year}:${month.toString().padStart(2, "0")}:${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
          if (exifDateTimeOriginal === null) {
            exifDateTimeOriginal = modificationTime;
          }
        }
      } else if (chunkType === "eXIf") {
        // Parse eXIf chunk (EXIF data similar to JPEG APP1)
        const { orientation: ori, dateTimeOriginal } = this.parseExif(
          buffer,
          chunkData - 4, // Adjust to mimic JPEG pos (assuming parseExif expects marker-like offset; tweak if needed)
          chunkLen
        );
        orientation = ori;
        if (exifDateTimeOriginal === null && dateTimeOriginal) {
          exifDateTimeOriginal = dateTimeOriginal;
        }
      } else if (chunkType === "IDAT") {
        break; // Data starts, no need to scan further for basics
      }
      pos = nextPos; // len + type + data + crc
    }
    return {
      type: "IMAGE",
      width,
      height,
      format: animated === true ? "apng" : "png",
      frames,
      animated,
      hasAlpha,
      colorModel,
      orientation,
      aspectRatio: width / height,
      colorSpace,
      iccProfile,
      exifDateTimeOriginal: myExifDebug ?? exifDateTimeOriginal,
      metadata: {
        bitDepth,
        dpi,
        pixelAspectRatio,
        iccProfileMeta,
        xmp,
        textChunks: this.convertTextChunks(textChunks),
        modificationTime
      }
    } as ImageSpecs<PngMetadata<true>>;
  }
  /**
   * Signature is 89 50 4E 47 0D 0A 1A 0A, width/height in IHDR at offsets 16/20 (big-endian)
   */
  protected isPngSignature(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer.length >= 24 &&
      buffer?.[0] === 0x89 &&
      buffer?.[1] === 0x50 &&
      buffer?.[2] === 0x4e &&
      buffer?.[3] === 0x47 &&
      buffer?.[4] === 0x0d &&
      buffer?.[5] === 0x0a &&
      buffer?.[6] === 0x1a &&
      buffer?.[7] === 0x0a
    );
  }
}
