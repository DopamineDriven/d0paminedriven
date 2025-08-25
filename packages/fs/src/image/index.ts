import { createReadStream } from "node:fs";
import { relative } from "node:path";
import type { Readable } from "node:stream";
import { inflateSync } from "fflate";
import type { BoxInfo, ImageSpecs } from "@/types/index.ts";
import { MimeService } from "@/mime/index.ts";

export class ImageService extends MimeService {
  constructor(public cwd: string) {
    super();
  }
  /**
   * Read exactly N bytes from a stream, returning a Buffer
   * Closes stream after reading or on error
   */
  public async readBytes(stream: Readable, bytes: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
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
        const remaining = bytes - totalBytes;
        if (chunk.length <= remaining) {
          chunks.push(chunk);
          totalBytes += chunk.length;
        } else {
          // Take only what we need
          chunks.push(chunk.subarray(0, remaining));
          totalBytes = bytes;
        }

        if (totalBytes >= bytes) {
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

  /**
   * Extract image metadata from a stream, reading only ~4KB for most formats
   * Automatically handles PNG, JPEG, GIF, BMP, WebP, and AVIF
   */
  public async extractFromStream(
    stream: Readable,
    size = 4096
  ): Promise<ImageSpecs> {
    // Read first 4KB - enough for most image headers
    const headerSize = size;
    const header = await this.readBytes(stream, headerSize);

    // PNG: Complete metadata in first 24-33 bytes
    if (this.isPNG(header)) {
      return this.extractPNGFromBuffer(header);
    }

    // JPEG: Might need to read more for SOF markers
    if (this.isJPEG(header)) {
      return this.extractJPEGFromBuffer(header);
    }

    // GIF: Usually complete in first 4KB
    if (this.isGIF(header)) {
      return this.extractGIFFromBuffer(header);
    }

    // BMP: Complete in first 54 bytes
    if (this.isBMP(header)) {
      return this.extractBMPFromBuffer(header);
    }

    // WebP: Usually complete in first 4KB
    if (this.isWebP(header)) {
      return this.extractWebPFromBuffer(header);
    }

    // AVIF: Usually complete in first 4KB
    if (this.isAVIF(header)) {
      return this.extractAVIFFromBuffer(header);
    }

    throw new Error("Unsupported image format or invalid file");
  }

  /**
   * Extract metadata from file path using streaming (memory efficient)
   */
  public async extractFromPath(
    filePath: string,
    size = 4096
  ): Promise<ImageSpecs> {
    const stream = createReadStream(relative(this.cwd, filePath), {
      highWaterMark: size
    });
    return this.extractFromStream(stream, size);
  }

  // Format detection helpers
  private isPNG(buffer: Buffer): boolean {
    return (
      buffer?.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  private isJPEG(buffer: Buffer): boolean {
    return buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
  }

  private isGIF(buffer: Buffer): boolean {
    const header = buffer.toString("ascii", 0, 6);
    return buffer.length >= 6 && (header === "GIF87a" || header === "GIF89a");
  }

  private isBMP(buffer: Buffer): boolean {
    return buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d;
  }

  private isWebP(buffer: Buffer): boolean {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  private isAVIF(buffer: Buffer): boolean {
    if (buffer.length < 32) return false;
    const ftyp = buffer.toString("ascii", 4, 8);
    if (ftyp !== "ftyp") return false;
    const brands = buffer.toString("ascii", 8, 32);
    return brands.includes("avif") || brands.includes("avis");
  }

  // Extract methods for each format (refactored from getImageSpecsWorkup)
  private extractPNGFromBuffer(buffer: Buffer): ImageSpecs {
    if (!this.isPNG(buffer) || buffer.length < 24) {
      throw new Error("Invalid PNG header");
    }

    // PNG dimensions are always at fixed positions
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    const colorType = buffer[25];

    let colorModel: ImageSpecs["colorModel"];
    let hasAlpha = false;

    switch (colorType) {
      case 0:
        colorModel = "grayscale";
        break;
      case 2:
        colorModel = "rgb";
        break;
      case 3:
        colorModel = "indexed";
        break;
      case 4:
        colorModel = "grayscale-alpha";
        hasAlpha = true;
        break;
      case 6:
        colorModel = "rgba";
        hasAlpha = true;
        break;
      default:
        colorModel = "unknown";
    }

    // For streaming, we skip chunk scanning (would need more bytes)
    return {
      width,
      height,
      format: "png",
      frames: 1,
      animated: false,
      hasAlpha,
      orientation: null,
      aspectRatio: width / height,
      colorSpace: "unknown",
      colorModel,
      iccProfile: null,
      exifDateTimeOriginal: null
    };
  }

  private extractJPEGFromBuffer(buffer: Buffer): ImageSpecs {
    if (!this.isJPEG(buffer)) {
      throw new Error("Invalid JPEG header");
    }

    let pos = 2;
    let width = 0;
    let height = 0;
    let colorModel = "unknown" as ImageSpecs["colorModel"];

    // Scan for SOF marker within available buffer
    while (pos < buffer.length - 10) {
      if (buffer[pos] !== 0xff) break;

      const marker = buffer[pos + 1];
      if (!marker || marker === 0xda) break; // Start of Scan or invalid

      const segmentSize = buffer.readUInt16BE(pos + 2);

      // SOF markers
      if (
        marker &&
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const numComponents = buffer[pos + 4];
        switch (numComponents) {
          case 1:
            colorModel = "grayscale";
            break;
          case 3:
            colorModel = "ycbcr";
            break;
          case 4:
            colorModel = "ycck";
            break;
          default:
            colorModel = "unknown";
        }
        height = buffer.readUInt16BE(pos + 5);
        width = buffer.readUInt16BE(pos + 7);
        break; // Found dimensions, stop scanning
      }

      pos += segmentSize + 2;
      if (pos >= buffer.length) break;
    }

    if (width === 0) {
      throw new Error("Could not find JPEG dimensions in available data");
    }

    return {
      width,
      height,
      format: "jpeg",
      frames: 1,
      animated: false,
      hasAlpha: false,
      orientation: null,
      aspectRatio: width / height,
      colorSpace: "unknown",
      colorModel,
      iccProfile: null,
      exifDateTimeOriginal: null
    };
  }

  private extractGIFFromBuffer(buffer: Buffer): ImageSpecs {
    if (!this.isGIF(buffer) || buffer.length < 10) {
      throw new Error("Invalid GIF header");
    }

    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);

    // For streaming, we can't count frames without reading entire file
    // But we can detect if it's potentially animated
    let potentiallyAnimated = false;
    if (buffer.length > 13) {
      // Check for graphics control extension (animation indicator)
      for (let i = 13; i < Math.min(buffer.length - 2, 100); i++) {
        if (buffer[i] === 0x21 && buffer[i + 1] === 0xf9) {
          potentiallyAnimated = true;
          break;
        }
      }
    }

    return {
      width,
      height,
      colorModel: "unknown",
      format: "gif",
      frames: potentiallyAnimated ? 2 : 1, // Estimate
      animated: potentiallyAnimated,
      hasAlpha: null,
      orientation: null,
      aspectRatio: width / height,
      colorSpace: "unknown",
      iccProfile: null,
      exifDateTimeOriginal: null
    };
  }

  private extractBMPFromBuffer(buffer: Buffer): ImageSpecs {
    if (!this.isBMP(buffer) || buffer.length < 26) {
      throw new Error("Invalid BMP header");
    }

    const width = buffer.readInt32LE(18);
    const height = Math.abs(buffer.readInt32LE(22));
    const bitDepth = buffer.readUInt16LE(28);
    const colorModel = (
      bitDepth <= 8 ? "indexed" : "rgb"
    ) as ImageSpecs["colorModel"];

    return {
      width,
      height,
      format: "bmp",
      frames: 1,
      animated: false,
      hasAlpha: null,
      orientation: buffer.readInt32LE(22) < 0 ? 1 : 6,
      aspectRatio: width / height,
      colorSpace: "unknown",
      colorModel,
      iccProfile: null,
      exifDateTimeOriginal: null
    };
  }

  private extractWebPFromBuffer(buffer: Buffer): ImageSpecs {
    if (!this.isWebP(buffer) || buffer.length < 30) {
      throw new Error("Invalid WebP header");
    }

    const chunkType = buffer.toString("ascii", 12, 16);
    let width = 0;
    let height = 0;
    let hasAlpha = false;
    let animated = false;
    let colorModel = "rgb" as ImageSpecs["colorModel"];

    if (chunkType === "VP8X") {
      const flags = buffer[20];
      if (flags !== undefined) {
        hasAlpha = !!(flags & 0x02);
        animated = !!(flags & 0x01);
        colorModel = hasAlpha ? "rgba" : "rgb";
      }

      const b24 = buffer[24],
        b25 = buffer[25],
        b26 = buffer[26];
      const b27 = buffer[27],
        b28 = buffer[28],
        b29 = buffer[29];
      if (
        b24 !== undefined &&
        b25 !== undefined &&
        b26 !== undefined &&
        b27 !== undefined &&
        b28 !== undefined &&
        b29 !== undefined
      ) {
        const widthMinus1 = b24 | (b25 << 8) | (b26 << 16);
        const heightMinus1 = b27 | (b28 << 8) | (b29 << 16);
        width = widthMinus1 + 1;
        height = heightMinus1 + 1;
      }
    } else if (chunkType === "VP8") {
      // Lossy format
      if (buffer.length < 30) throw new Error("VP8 data too short");
      width = buffer.readUInt16LE(26) & 0x3fff;
      height = buffer.readUInt16LE(28) & 0x3fff;
    } else if (chunkType === "VP8L") {
      // Lossless format
      if (buffer.length < 25) throw new Error("VP8L data too short");
      const bits = buffer.readUInt32LE(21);
      hasAlpha = !!(bits & (1 << 8));
      colorModel = hasAlpha ? "rgba" : "rgb";
      width = 1 + (bits & 0x3fff);
      height = 1 + ((bits >> 14) & 0x3fff);
    }

    return {
      width,
      colorModel,
      height,
      format: "webp",
      frames: animated ? 2 : 1, // Estimate
      animated,
      hasAlpha,
      orientation: null,
      aspectRatio: width / height,
      colorSpace: "unknown",
      iccProfile: null,
      exifDateTimeOriginal: null
    };
  }

  private extractAVIFFromBuffer(buffer: Buffer): ImageSpecs {
    if (!this.isAVIF(buffer)) {
      throw new Error("Invalid AVIF header");
    }

    // For streaming, we do minimal parsing
    // Real AVIF parsing requires more complex box navigation
    // This is a simplified version that may not work for all AVIF files

    // Try to find ispe box for dimensions
    let width = 0;
    let height = 0;

    // Search for "ispe" box signature
    for (let i = 0; i < buffer.length - 16; i++) {
      if (buffer.toString("ascii", i, i + 4) === "ispe") {
        // Found ispe box, dimensions follow
        if (i + 12 < buffer.length) {
          width = buffer.readUInt32BE(i + 8);
          height = buffer.readUInt32BE(i + 12);
          break;
        }
      }
    }

    if (width === 0 || height === 0) {
      throw new Error("Could not find AVIF dimensions in available data");
    }

    return {
      width,
      height,
      format: "avif",
      frames: 1,
      animated: false,
      hasAlpha: null,
      orientation: null,
      aspectRatio: width / height,
      colorModel: "rgb",
      colorSpace: "unknown",
      iccProfile: null,
      exifDateTimeOriginal: null
    };
  }
  private parseExif(
    buffer: Buffer,
    app1Pos: number,
    app1Size: number
  ): { orientation: number | null; dateTimeOriginal: string | null } {
    const exifHeader = buffer.toString("ascii", app1Pos + 2, app1Pos + 8);
    if (exifHeader !== "Exif\0\0")
      return { orientation: null, dateTimeOriginal: null };

    let tiffPos = app1Pos + 8;

    const app1End = app1Pos + app1Size;
    if (tiffPos + 10 > app1End)
      return { orientation: null, dateTimeOriginal: null }; // Minimum for TIFF header
    const byteOrder = buffer.toString("ascii", tiffPos, tiffPos + 2);
    const littleEndian = byteOrder === "II";
    const readUInt16 = littleEndian
      ? buffer.readUInt16LE.bind(buffer)
      : buffer.readUInt16BE.bind(buffer);
    const readUInt32 = littleEndian
      ? buffer.readUInt32LE.bind(buffer)
      : buffer.readUInt32BE.bind(buffer);

    if (readUInt16(tiffPos + 2) !== 0x2a)
      return { orientation: null, dateTimeOriginal: null }; // Not TIFF
    let ifdOffset = readUInt32(tiffPos + 4);
    tiffPos += ifdOffset;

    const numEntries = readUInt16(tiffPos);
    tiffPos += 2;

    let orientation: number | null = null;
    let dateTimeOriginal: string | null = null;

    for (let i = 0; i < numEntries; i++) {
      const tag = readUInt16(tiffPos),
        type = readUInt16(tiffPos + 2),
        count = readUInt32(tiffPos + 4),
        valueOffset = tiffPos + 8;

      if (tag === 0x0112 && type === 3 && count === 1) {
        // Orientation (short)
        orientation = readUInt16(valueOffset);
      } else if (tag === 0x9003 && type === 2 && count === 20) {
        // DateTimeOriginal (ASCII, 19 chars + null)
        const offset = readUInt32(valueOffset);
        if (app1Pos + 2 + offset + 19 > app1End) {
          dateTimeOriginal = null; // Truncated
        } else {
          dateTimeOriginal = buffer
            .toString("ascii", app1Pos + 2 + offset, app1Pos + 2 + offset + 19)
            .trim();
        }
      }

      tiffPos += 12;
    }

    return { orientation, dateTimeOriginal };
  }

  private parseXmpFromAvif(
    buffer: Buffer,
    meta: BoxInfo,
    _ipco: BoxInfo
  ): string | null {
    // Find iinf (Item Info Box)
    const iinf = this.findBox(
      buffer,
      "iinf",
      meta.pos + 4,
      meta.pos + meta.size
    );
    if (!iinf) return null;

    // Parse iinf: version/flags (skip), then item_count (u16 or u32 based on version)
    let pos = iinf.pos;

    const version = buffer[pos++];
    // const flags = (buffer[pos++]  << 16) | (buffer[pos++] << 8) | buffer[pos++]; // Skip flags
    const itemCount =
      version === 0 ? buffer.readUInt16BE(pos) : buffer.readUInt32BE(pos);
    pos += version === 0 ? 2 : 4;

    let xmpItemId: number | undefined;
    for (let i = 0; i < itemCount; i++) {
      // Each infe (Item Info Entry)
      const infeStart = pos;
      const infeSize = buffer.readUInt32BE(pos);
      if (buffer.toString("ascii", pos + 4, pos + 8) !== "infe") break; // Not infe
      pos += 8; // size + type
      const infeVersion = buffer?.[pos++];

      // const infeFlags = (buffer[pos++] << 16) | (buffer[pos++] << 8) | buffer[pos++]; // Skip
      if (!infeVersion) return null;
      const itemId =
        infeVersion < 2 ? buffer.readUInt16BE(pos) : buffer.readUInt32BE(pos);
      pos += infeVersion < 2 ? 2 : 4;
      pos += 2; // item_protection_index (u16, skip)
      const itemType = buffer.toString("ascii", pos, pos + 4);
      pos += 4;
      // item_name (null-terminated string) - skip over it
      let nameEnd = pos;
      while (buffer[nameEnd] !== 0 && nameEnd < infeStart + infeSize) nameEnd++;
      pos = nameEnd + 1;
      if (itemType === "mime") {
        // content_type (null-terminated)
        let ctEnd = pos;
        while (buffer[ctEnd] !== 0 && ctEnd < infeStart + infeSize) ctEnd++;
        const contentType = buffer.toString("ascii", pos, ctEnd);
        if (contentType === "application/rdf+xml") {
          xmpItemId = itemId;
          break; // Found XMP item
        }
        pos = ctEnd + 1; // Skip optional content_encoding if present
      }
      pos = infeStart + infeSize; // Jump to next infe
    }

    if (!xmpItemId) return null;

    // Find iloc (Item Location Box)
    const iloc = this.findBox(
      buffer,
      "iloc",
      meta.pos + 4,
      meta.pos + meta.size
    );
    if (!iloc) return null;

    // Parse iloc: version, flags (skip), offset_size (4bits), length_size (4bits), base_offset_size (4bits), etc.
    pos = iloc.pos;
    const ilocVersion = buffer[pos++];
    // const ilocFlags = (buffer[pos++] << 16) | (buffer[pos++] << 8) | buffer[pos++]; // Skip
    const sizes = buffer?.[pos++];
    if (!sizes) return null;
    const offsetSize = (sizes >> 4) & 0xf;
    const lengthSize = sizes & 0xf;
    let indexSize = 0;
    if (ilocVersion === 1 || ilocVersion === 2) {
      const indexSizes = buffer?.[pos++];
      if (!indexSizes) return null;
      // index_size (4bits), reserved (4bits) - but simplified, assume no construction_method
      indexSize = (indexSizes >> 4) & 0xf;
    }
    if (!ilocVersion) return null;
    let buffpos = buffer?.[pos++];
    if (!buffpos) return null;
    const baseOffsetSize = ilocVersion < 2 ? 0 : (buffpos >> 4) & 0xf; // Simplified
    const itemCountIloc =
      ilocVersion < 2 ? buffer.readUInt16BE(pos) : buffer.readUInt32BE(pos);
    pos += ilocVersion < 2 ? 2 : 4;

    let xmpOffset = 0;
    let xmpLength = 0;
    for (let i = 0; i < itemCountIloc; i++) {
      const curItemId =
        ilocVersion < 2 ? buffer.readUInt16BE(pos) : buffer.readUInt32BE(pos);
      pos += ilocVersion < 2 ? 2 : 4;
      if (curItemId !== xmpItemId) {
        // Skip this item: construction_method (u16 if v1+), data_reference_index (u16), base_offset, extent_count (u16), then per extent: [index] offset length
        if (ilocVersion === 1 || ilocVersion === 2) pos += 2; // construction_method (assume 0: file offset)
        pos += 2; // data_reference_index (u16, assume 0: this file)
        pos += baseOffsetSize; // base_offset
        const extentCount = buffer.readUInt16BE(pos);
        pos += 2;
        for (let e = 0; e < extentCount; e++) {
          if (indexSize > 0) pos += indexSize; // extent_index if present
          pos += offsetSize + lengthSize; // Skip offset + length
        }
        continue;
      }
      // Found XMP item: Assume construction_method=0 (file offset), data_ref=0, extent_count=1 (common for XMP)
      if (ilocVersion === 1 || ilocVersion === 2) {
        const constructionMethod = buffer.readUInt16BE(pos);
        pos += 2;
        if (constructionMethod !== 0) return null; // Unsupported (e.g., idat or item)
      }
      pos += 2; // data_reference_index (assume 0)
      const baseOffset = this.readVarSize(buffer, pos, baseOffsetSize);
      pos += baseOffsetSize;
      const extentCount = buffer.readUInt16BE(pos);
      pos += 2;
      if (extentCount !== 1) return null; // Multi-extent rare, handle single for simplicity
      if (indexSize > 0) pos += indexSize; // Skip index if present
      const extentOffset = this.readVarSize(buffer, pos, offsetSize);
      pos += offsetSize;
      const extentLength = this.readVarSize(buffer, pos, lengthSize);
      xmpOffset = baseOffset + extentOffset;
      xmpLength = extentLength;
      break;
    }

    if (
      xmpOffset === 0 ||
      xmpLength === 0 ||
      xmpOffset + xmpLength > buffer.length
    )
      return null;

    // Extract XMP XML string (UTF-8 assumed)
    return buffer.toString("utf8", xmpOffset, xmpOffset + xmpLength);
  }

  private readVarSize(buffer: Buffer, pos: number, size: number) {
    if (size === 0) return 0;
    if (size === 1 && buffer?.[pos]) return buffer?.[pos];
    if (size === 2) return buffer.readUInt16BE(pos);
    if (size === 3) {
      let pos1 = buffer?.[pos + 1],
        pos2 = buffer?.[pos + 2];
      if (buffer?.[pos] && pos1 && pos2) {
        return (buffer[pos] << 16) | (pos1 << 8) | pos2;
      }
      throw new Error("Invalid var size");
    }
    if (size === 4) return buffer.readUInt32BE(pos);
    if (size === 8) return Number(buffer.readBigUInt64BE(pos));
    throw new Error("Invalid var size");
  }

  private findBox(
    buffer: Buffer,
    type: string,
    start = 0,
    end: number = buffer.length
  ): BoxInfo | null {
    let pos = start;
    while (pos < end) {
      let boxSize = buffer.readUInt32BE(pos);
      let boxType = buffer.toString("ascii", pos + 4, pos + 8);
      let hdrSize = 8;
      if (boxSize === 1) {
        boxSize = Number(buffer.readBigUInt64BE(pos + 8));
        hdrSize = 16;
      } else if (boxSize === 0) {
        boxSize = end - pos;
      }
      if (boxType === type) {
        return { pos: pos + hdrSize, size: boxSize - hdrSize };
      }
      pos += boxSize;
    }
    return null;
  }

  private mapChrmToColorSpace(
    chrm: {
      white_x: number;
      white_y: number;
      red_x: number;
      red_y: number;
      green_x: number;
      green_y: number;
      blue_x: number;
      blue_y: number;
    },
    fallback: ImageSpecs["colorSpace"]
  ) {
    const tol = 100; // Small tolerance for int rounding (out of 100000)
    // sRGB / Rec.709
    if (
      Math.abs(chrm.white_x - 31270) < tol &&
      Math.abs(chrm.white_y - 32900) < tol &&
      Math.abs(chrm.red_x - 64000) < tol &&
      Math.abs(chrm.red_y - 33000) < tol &&
      Math.abs(chrm.green_x - 30000) < tol &&
      Math.abs(chrm.green_y - 60000) < tol &&
      Math.abs(chrm.blue_x - 15000) < tol &&
      Math.abs(chrm.blue_y - 6000) < tol
    )
      return "srgb";
    // Adobe RGB
    if (
      Math.abs(chrm.white_x - 31270) < tol &&
      Math.abs(chrm.white_y - 32900) < tol &&
      Math.abs(chrm.red_x - 64000) < tol &&
      Math.abs(chrm.red_y - 33000) < tol &&
      Math.abs(chrm.green_x - 21000) < tol &&
      Math.abs(chrm.green_y - 71000) < tol &&
      Math.abs(chrm.blue_x - 15000) < tol &&
      Math.abs(chrm.blue_y - 6000) < tol
    )
      return "adobe_rgb";
    // Display P3
    if (
      Math.abs(chrm.white_x - 31270) < tol &&
      Math.abs(chrm.white_y - 32900) < tol &&
      Math.abs(chrm.red_x - 68000) < tol &&
      Math.abs(chrm.red_y - 32000) < tol &&
      Math.abs(chrm.green_x - 26500) < tol &&
      Math.abs(chrm.green_y - 69000) < tol &&
      Math.abs(chrm.blue_x - 15000) < tol &&
      Math.abs(chrm.blue_y - 6000) < tol
    )
      return "display_p3";
    // ProPhoto RGB
    if (
      Math.abs(chrm.white_x - 34590) < tol &&
      Math.abs(chrm.white_y - 35850) < tol && // D50 white point
      Math.abs(chrm.red_x - 73470) < tol &&
      Math.abs(chrm.red_y - 26530) < tol &&
      Math.abs(chrm.green_x - 15960) < tol &&
      Math.abs(chrm.green_y - 85040) < tol &&
      Math.abs(chrm.blue_x - 3600) < tol &&
      Math.abs(chrm.blue_y - 1000) < tol
    )
      return "prophoto_rgb";
    // Rec.2020
    if (
      Math.abs(chrm.white_x - 31270) < tol &&
      Math.abs(chrm.white_y - 32900) < tol &&
      Math.abs(chrm.red_x - 70800) < tol &&
      Math.abs(chrm.red_y - 29200) < tol &&
      Math.abs(chrm.green_x - 17000) < tol &&
      Math.abs(chrm.green_y - 79700) < tol &&
      Math.abs(chrm.blue_x - 13100) < tol &&
      Math.abs(chrm.blue_y - 4600) < tol
    )
      return "rec2020";
    return fallback; // No match, keep default
  }

  private xmpToColorSpaceWorkup<
    const T extends
      | ImageSpecs["colorSpace"]
      | "prophoto rgb"
      | "display p3"
      | "adobe rgb (1998)"
      | "rgb"
      | "grayscale",
    const V extends "iccprofile" | "colormode"
  >(space: T, target: V) {
    return `<photoshop:${target}>${space}</photoshop:${target}>` as const;
  }
  private mapXmpToColorSpace(
    xmpText: string,
    fallback: ImageSpecs["colorSpace"]
  ) {
    const lower = xmpText.toLowerCase();
    // Look for common tags like <photoshop:ICCProfile> or <xmpG:icc-profile-name>
    if (lower.includes(this.xmpToColorSpaceWorkup("srgb", "iccprofile")))
      return "srgb";
    if (
      lower.includes(
        this.xmpToColorSpaceWorkup("adobe rgb (1998)", "iccprofile")
      )
    )
      return "adobe_rgb";
    if (lower.includes(this.xmpToColorSpaceWorkup("display p3", "iccprofile")))
      return "display_p3";
    if (
      lower.includes(this.xmpToColorSpaceWorkup("prophoto rgb", "iccprofile"))
    )
      return "prophoto_rgb";
    // Or color mode hints
    if (
      lower.includes(this.xmpToColorSpaceWorkup("rgb", "colormode")) &&
      lower.includes("adobe rgb")
    )
      return "adobe_rgb";
    if (lower.includes(this.xmpToColorSpaceWorkup("grayscale", "colormode")))
      return "gray";
    return fallback;
  }
  private mapProfileToColorSpace(
    profileName: string | null,
    fallback: ImageSpecs["colorSpace"]
  ) {
    if (
      !profileName ||
      profileName === "embedded" ||
      profileName.toLowerCase().includes("icc profile")
    )
      return fallback; // Generic names preserve default
    const lower = profileName.toLowerCase();
    if (
      lower.includes("srgb") ||
      lower.includes("iec61966") ||
      lower.includes("srgb2014")
    )
      return "srgb";
    if (
      lower.includes("display p3") ||
      lower.includes("display-p3") ||
      lower.includes("dci-p3") ||
      lower.includes("p3")
    )
      return "display_p3";
    if (
      lower.includes("adobe rgb") ||
      lower.includes("adobergb") ||
      lower.includes("adobe rgb (1998)")
    )
      return "adobe_rgb";
    if (
      lower.includes("prophoto rgb") ||
      lower.includes("prophoto") ||
      lower.includes("romm rgb") ||
      lower.includes("romm") ||
      lower.includes("iso 22028")
    )
      return "prophoto_rgb";
    if (
      lower.includes("rec2020") ||
      lower.includes("bt.2020") ||
      lower.includes("bt2020") ||
      lower.includes("bt.2100") ||
      lower.includes("itur_2100")
    )
      return "rec2020";
    if (
      lower.includes("rec709") ||
      lower.includes("bt.709") ||
      lower.includes("bt709")
    )
      return "rec709";
    if (lower.includes("cmyk")) return "cmyk";
    if (lower.includes("lab")) return "lab";
    if (lower.includes("xyz")) return "xyz";
    if (
      lower.includes("gray") ||
      lower.includes("grey") ||
      lower.includes("monochrome") ||
      lower.includes("gamma") ||
      lower.includes("gamma 2.2") ||
      lower.includes("dot gain")
    )
      return "gray";
    return fallback; // Preserve d
  }

  public async extractViaStream(stream: Readable, size = 4096) {
    // Read first 4KB - enough for most image headers
    const headerSize = size;
    const header = await this.readBytes(stream, headerSize);
    return this.getImageSpecsWorkup(header, size);
  }
  public async extractViaPath(filePath: string, size = 4096) {
    const stream = createReadStream(relative(this.cwd, filePath), {
      highWaterMark: size
    });
    return await this.extractViaStream(stream, size);
  }

  // Magic bytes for image format detection
  private readonly signatures = {
    PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    JPEG: [0xff, 0xd8, 0xff],
    GIF87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    GIF89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
    WEBP: [0x52, 0x49, 0x46, 0x46], // RIFF
    BMP: [0x42, 0x4d],
    TIFF_LE: [0x49, 0x49, 0x2a, 0x00],
    TIFF_BE: [0x4d, 0x4d, 0x00, 0x2a],
    AVIF: [
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66
    ],
    HEIC: [0x66, 0x74, 0x79, 0x70] // ftyp at offset 4
  } as const;

  /**
   * Probe image from various sources
   * Handles local Buffer, remote URL, or S3 object
   */
  public async extractRemote(
    source: Buffer | string,
    size = 16384,
    timeout=5000
  ): Promise<ImageSpecs> {
    let buffer: Buffer;

    if (Buffer.isBuffer(source)) {
      buffer = source;
      return this.getImageSpecsWorkup(buffer, size);
    } else {
      // Remote URL - smart fetch with Range
      buffer = await this.fetchMinimalBuffer(source, size, timeout);
      return this.getImageSpecsWorkup(buffer, size);
    }
  }

  /**
   * Fetch minimal bytes from remote URL using Range header
   * This is the KEY optimization - only fetch what we need!
   */
  private knownToBlock(inputUrl: string) {
    if (inputUrl.startsWith("https://github.com")) {
      return "GET" as const;
    } else if (inputUrl.startsWith("https://raw.githubusercontent.com")) {
      return "GET" as const;
    } else {
      return "HEAD" as const;
    }
  }
  private async fetchMinimalBuffer(
    url: string,
    size = 16384,
    timeout = 5000
  ): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 1. Try HEAD request to check if Range is supported
      const headResponse = await fetch(url, {
        method: this.knownToBlock(url),
        signal: controller.signal
      });

      const acceptsRange =
        headResponse.headers.get("accept-ranges") === "bytes";
      const contentLength = parseInt(
        headResponse.headers.get("content-length") ?? "0"
      );

      clearTimeout(timeoutId);

      // 2. Fetch with Range header if supported
      if (acceptsRange) {
        // We only need first 16KB for metadata (even less for most formats)
        const rangeResponse = await fetch(url, {
          headers: {
            Range: `bytes=0-${size}` // First 16KB
          },
          signal: AbortSignal.timeout(timeout)
        });

        if (rangeResponse.status === 206) {
          // Partial Content
          const arrayBuffer = await rangeResponse.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }

      // 3. Fallback: Fetch entire file if small, or first chunk if streaming
      if (contentLength && contentLength < 1024 * 1024) {
        // < 1MB
        const response = await fetch(url, {
          signal: AbortSignal.timeout(timeout)
        });
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      // 4. For large files without Range support, read partial stream
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read only first 16KB from stream
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      const maxBytes = size;

      while (totalBytes < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;

        const bytesToAdd = Math.min(value.length, maxBytes - totalBytes);
        chunks.push(value.slice(0, bytesToAdd));
        totalBytes += bytesToAdd;

        if (totalBytes >= maxBytes) {
          reader.cancel(); // Stop reading
          break;
        }
      }

      return Buffer.concat(chunks);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public getImageSpecsWorkup(rawbuffer: Buffer<ArrayBufferLike>, size = 4096) {
    // 8KB handles most JPEGs with metadata while minimizing memory usage
    // Professional photos with EXIF + Photoshop data typically need 6-7KB
    const MAX_HEADER_SIZE = size;
    const buffer = rawbuffer.subarray(
      0,
      Math.min(rawbuffer.length, MAX_HEADER_SIZE)
    );
    // PNG: Signature is 89 50 4E 47 0D 0A 1A 0A, width/height in IHDR at offsets 16/20 (big-endian)
    if (
      buffer?.length >= 24 &&
      buffer?.[0] === 0x89 &&
      buffer?.[1] === 0x50 &&
      buffer?.[2] === 0x4e &&
      buffer?.[3] === 0x47 &&
      buffer?.[4] === 0x0d &&
      buffer?.[5] === 0x0a &&
      buffer?.[6] === 0x1a &&
      buffer?.[7] === 0x0a
    ) {
      if (
        buffer.readUint32BE(8) !== 13 ||
        buffer?.[12] !== 0x49 ||
        buffer?.[13] !== 0x48 ||
        buffer?.[14] !== 0x44 ||
        buffer?.[15] !== 0x52
      ) {
        throw new Error("IHDR Chunk of png not found or incorrect.");
      }
      const colorType = buffer[25]; // Offset 16 (width) + 4 (height) + 4 (bit depth) + 1 = 25
      let colorModel = "unknown" as ImageSpecs["colorModel"],
        colorSpace = "unknown" as ImageSpecs["colorSpace"],
        hasAlpha = false;

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
      let orientation: number | null = null;
      // Scan chunks for extras
      let pos = 33; // After IHDR (8 sig + 4 len + 4 type + 13 data + 4 crc)
      while (pos < buffer.length - 12) {
        const chunkLen = buffer.readUInt32BE(pos);
        let chunkType = buffer.toString("ascii", pos + 4, pos + 8);
        let chunkData = pos + 8;
        if (chunkType === "acTL") {
          animated = true;
          frames = buffer.readUInt32BE(chunkData); // num_frames
        } else if (chunkType === "iCCP") {
          // ICC profile: name (null-terminated) + compression + data
          const nameEnd = buffer.indexOf(0, chunkData);
          const profileName = buffer.toString("ascii", chunkData, nameEnd);
          iccProfile = profileName || "embedded";
          colorSpace = this.mapProfileToColorSpace(profileName, colorSpace);
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
        } else if (chunkType === "iTXt") {
          // Parse iTXt: keyword\0 compression_flag compression_method language\0 translated_keyword\0 text
          let offset = chunkData;
          const keywordEnd = buffer.indexOf(0, offset);
          const keyword = buffer.toString("ascii", offset, keywordEnd);
          offset = keywordEnd + 1;
          const compressionFlag = buffer[offset];
          const _compressionMethod = buffer[offset + 1]; // Always 0 (zlib) if compressed
          offset += 2;
          const langEnd = buffer.indexOf(0, offset);
          offset = langEnd + 1; // Skip lang and translated keyword
          const transEnd = buffer.indexOf(0, offset);
          offset = transEnd + 1;
          let textBuffer = buffer.subarray(offset, chunkData + chunkLen - 8); // Text starts here
          if (compressionFlag === 1) {
            try {
              textBuffer = Buffer.from(inflateSync(textBuffer));
            } catch (e) {
              console.error("Failed to decompress iTXt:", e);
              // Skip if decompression fails
            }
          }
          const text = textBuffer.toString("utf8");
          if (keyword === "XML:com.adobe.xmp" && !iccProfile) {
            colorSpace = this.mapXmpToColorSpace(text, colorSpace);
          }
        } else if (chunkType === "tIME") {
          let month = buffer?.[chunkData + 2],
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
            let year = buffer.readUInt16BE(chunkData);
            exifDateTimeOriginal = `${year}:${month.toString().padStart(2, "0")}:${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
          }
        } else if (chunkType === "IDAT") {
          break; // Data starts, no need to scan further for basics
        }
        pos += 12 + chunkLen; // len + type + data + crc
      }
      return {
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
        exifDateTimeOriginal
      } satisfies ImageSpecs;
    }

    // JPEG: Starts with FF D8, dimensions in SOF marker (FF C0-FF CF, excluding some)
    if (buffer.length >= 10 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let pos = 2,
        colorSpace = "unknown" as ImageSpecs["colorSpace"],
        colorModel = "unknown" as ImageSpecs["colorModel"],
        hasAlpha = false,
        width = 0,
        height = 0,
        iccProfile: string | null = null,
        orientation: number | null = null,
        exifDateTimeOriginal: string | null = null;

      while (pos < buffer.length - 10) {
        if (buffer[pos] !== 0xff) {
          throw new Error("Invalid JPEG file");
        }
        const marker = buffer[pos + 1];
        if (marker === 0xda) break; // Start of Scan, no more headers
        const segmentSize = buffer.readUInt16BE(pos + 2);
        if (!marker) {
          throw new Error("no marker for jpeg");
        }
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          const numComponents = buffer[pos + 4]; // After length (2 bytes) + precision (1) = pos + 4
          switch (numComponents) {
            case 1:
              colorModel = "grayscale";
              break;
            case 3:
              colorModel = "ycbcr";
              break; // Most common for RGB JPEGs (stored as YCbCr)
            case 4:
              colorModel = "ycck";
              break; // YCCK for CMYK with alpha-like, but no true alpha
            default:
              colorModel = "unknown";
          }
          width = buffer.readUInt16BE(pos + 7);
          height = buffer.readUInt16BE(pos + 5);
        } else if (marker === 0xe1) {
          // APP1 for EXIF
          const { orientation: ori, dateTimeOriginal } = this.parseExif(
            buffer,
            pos,
            segmentSize
          );
          orientation = ori;
          exifDateTimeOriginal = dateTimeOriginal;
        } else if (marker === 0xe2) {
          // APP2 for ICC
          const iccHeader = buffer.toString("ascii", pos + 4, pos + 18);
          if (iccHeader.startsWith("ICC_PROFILE")) {
            iccProfile = "embedded";
          }
        }
        pos += segmentSize + 2;

        // Skip any padding bytes (0x00 or fill bytes) after segments
        while (pos < buffer.length - 1 && buffer[pos] === 0x00) {
          pos++;
        }
      }

      if (width === 0) throw new Error("No dimensions found in JPEG file");
      return {
        width,
        height,
        format: "jpeg",
        frames: 1,
        animated: false, // JPEG not animated
        hasAlpha,
        orientation,
        aspectRatio: width / height,
        colorSpace,
        colorModel,
        iccProfile,
        exifDateTimeOriginal
      } satisfies ImageSpecs;
    }

    // GIF: Signature GIF87a or GIF89a, width/height at offsets 6/8 (little-endian)
    const gifHeader = buffer.toString("ascii", 0, 6);
    if (
      buffer.length >= 10 &&
      (gifHeader === "GIF87a" || gifHeader === "GIF89a")
    ) {
      const width = buffer.readUInt16LE(6),
        height = buffer.readUInt16LE(8);
      let frames = 0;
      let pos = 13; // After header (10) + screen descriptor (3 if no GCT, but skip GCT)
      let bufTen = buffer?.[10];
      if (typeof bufTen === "undefined") {
        pos = 13;
        frames = 0;
      } else if (bufTen & 0x80) pos += 3 << ((bufTen & 0x07) + 1); // Skip global color table if present
      while (pos < buffer.length) {
        if (buffer[pos] === 0x21) {
          // Extension
          pos += 2; // Label + size
          let subSize = buffer?.[pos];

          while (subSize && subSize > 0) {
            pos += subSize + 1;
            subSize = buffer?.[pos];
          }
          pos++; // Next block
        } else if (buffer?.[pos] && buffer?.[pos] === 0x2c) {
          frames++;
          pos += 10; // Image descriptor
          let b = buffer?.[pos - 1];

          if (typeof b !== "undefined" && b & 0x80)
            pos += 3 << ((b & 0x07) + 1); // Local color table
          pos++; // LZW min size
          let dataSize = buffer?.[pos];
          while (dataSize && dataSize > 0) {
            pos += dataSize + 1;
            dataSize = buffer[pos];
          }
          pos++; // Terminator
        } else if (buffer[pos] === 0x3b) {
          break; // Trailer
        } else {
          pos++;
        }
      }
      return {
        width,
        height,
        format: "gif",
        frames,
        animated: frames > 1,
        hasAlpha: null, // GIF transparency is per-pixel binary, not full alpha; set null or true if transparent color exists, but complex
        orientation: null, // No orientation in GIF
        aspectRatio: width / height,
        colorModel: "indexed",
        colorSpace: "unknown",
        iccProfile: null, // No ICC in GIF
        exifDateTimeOriginal: null // No EXIF in GIF
      } satisfies ImageSpecs;
    }

    // BMP: Signature BM, width/height at offsets 18/22 (little-endian, height can be negative for top-down)
    if (buffer.length >= 26 && buffer?.[0] === 0x42 && buffer?.[1] === 0x4d) {
      const width = buffer.readInt32LE(18);
      const height = Math.abs(buffer.readInt32LE(22));
      const bitDepth = buffer.readUInt16LE(28);
      let colorModel = (
        bitDepth <= 8 ? "indexed" : "rgb"
      ) as ImageSpecs["colorModel"];
      return {
        width,
        height,
        format: "bmp",
        frames: 1,
        animated: false,
        hasAlpha: null, // Some BMP have alpha in 32bpp, check if bitDepth===32 && compression===3 (bitfields with alpha)
        orientation: buffer.readInt32LE(22) < 0 ? 1 : 6, // Negative height means top-down (orientation 1), positive bottom-up (like 6, but simplified)
        aspectRatio: width / height,
        colorModel,
        colorSpace: "unknown",
        iccProfile: null, // Rare in BMP
        exifDateTimeOriginal: null
      } satisfies ImageSpecs;
    }

    // WebP: RIFF container with WEBP, then VP8/VP8L/VP8X chunks
    if (
      buffer.length >= 30 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      const chunkType = buffer.toString("ascii", 12, 16);
      let colorSpace = "unknown" as ImageSpecs["colorSpace"],
        colorModel = "unknown" as ImageSpecs["colorModel"],
        hasAlpha = false,
        width = 0,
        height = 0,
        frames = 1,
        animated = false,
        iccProfile: string | null = null;
      if (chunkType === "VP8X") {
        const flags = buffer?.[20]; // Feature flags
        colorModel = flags ? (flags & 0x02 ? "rgba" : "rgb") : "unknown"; // Bit 1 alpha
        hasAlpha = flags ? !!(flags & 0x02) : false;
        animated = flags ? !!(flags & 0x01) : false; // Bit 0 animation
        let widthSubtractOne = 0;
        let heightSubtractOne = 0;
        if (buffer?.[24] && buffer?.[25] && buffer?.[26]) {
          widthSubtractOne =
            buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
        }
        if (buffer?.[27] && buffer?.[28] && buffer?.[29]) {
          heightSubtractOne =
            buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
        }
        width = widthSubtractOne + 1;
        height = heightSubtractOne + 1;
        // Count frames if animated: Scan for ANMF chunks
        if (animated) {
          let pos = 30; // After VP8X
          frames = 0;
          while (pos < buffer.length - 8) {
            const subChunkType = buffer.toString("ascii", pos, pos + 4);
            const subChunkSize = buffer.readUInt32LE(pos + 4);
            if (subChunkType === "ICCP") {
              iccProfile = "embedded";
            } else if (subChunkType === "ANMF") {
              frames++;
            }
            pos += 8 + subChunkSize + (subChunkSize % 2); // Padded to even
          }
        }
      } else if (chunkType === "VP8 ") {
        // Lossy simple: Always RGB (no alpha in simple VP8)
        colorModel = "rgb";
        hasAlpha = false;
        const dataStart = 20;
        if (
          buffer?.[dataStart + 3] !== 0x9d ||
          buffer?.[dataStart + 4] !== 0x01 ||
          buffer?.[dataStart + 5] !== 0x2a
        ) {
          throw new Error("Invalid VP8 keyframe");
        }
        width = buffer.readUInt16LE(dataStart + 6) & 0x3fff;
        height = buffer.readUInt16LE(dataStart + 8) & 0x3fff;
      } else if (chunkType === "VP8L") {
        // Lossless simple
        const dataStart = 20;
        if (buffer?.[dataStart] !== 0x2f) {
          throw new Error("Invalid VP8L signature");
        }
        const bits = buffer.readUInt32LE(dataStart + 1);
        if (bits >>> 29 !== 0) {
          throw new Error("Invalid VP8L version");
        }
        colorModel = bits & (1 << 8) ? "rgba" : "rgb"; // Bit 8 indicates alpha
        hasAlpha = !!(bits & (1 << 8));
        width = 1 + (bits & 0x3fff);
        height = 1 + ((bits >> 14) & 0x3fff);
      } else {
        throw new Error("Unsupported WebP chunk");
      }
      return {
        width,
        height,
        format: "webp",
        frames,
        animated,
        hasAlpha,
        colorModel,
        orientation: null, // No standard orientation in WebP
        aspectRatio: width / height,
        colorSpace,
        iccProfile,
        exifDateTimeOriginal: null // Can have EXIF chunk, but rare; add if needed
      } satisfies ImageSpecs;
    }

    // AVIF: ISOBMFF with ftyp avif/avis, dimensions in meta > iprp > ipco > ispe
    if (buffer.length >= 32 && buffer.toString("ascii", 4, 8) === "ftyp") {
      const ftyp = this.findBox(buffer, "ftyp");
      if (!ftyp) throw new Error("Invalid AVIF: No ftyp");
      const brands = buffer.toString("ascii", ftyp.pos, ftyp.pos + ftyp.size);
      const isAvif = brands.includes("avif");
      const isAvis = brands.includes("avis");
      if (!isAvif && !isAvis) throw new Error("Not an AVIF file");

      const meta = this.findBox(buffer, "meta");
      if (!meta) throw new Error("Invalid AVIF: No meta");
      const metaSubStart = meta.pos + 4; // Skip version + flags
      const metaSubEnd = meta.pos + meta.size;

      const iprp = this.findBox(buffer, "iprp", metaSubStart, metaSubEnd);
      if (!iprp) throw new Error("Invalid AVIF: No iprp");
      const ipco = this.findBox(buffer, "ipco", iprp.pos, iprp.pos + iprp.size);
      if (!ipco) throw new Error("Invalid AVIF: No ipco");
      const ispe = this.findBox(buffer, "ispe", ipco.pos, ipco.pos + ipco.size);
      if (!ispe) throw new Error("Invalid AVIF: No ispe");

      if (buffer[ispe.pos] !== 0) throw new Error("Invalid ispe version");
      const width = buffer.readUInt32BE(ispe.pos + 4);
      const height = buffer.readUInt32BE(ispe.pos + 8);

      // For color space, look for 'colr' box in ipco (simple color info) or assume RGB if no ICC
      let colorSpace = "rgb" as ImageSpecs["colorSpace"],
        colorModel = "rgb" as ImageSpecs["colorModel"],
        hasAlpha = false,
        iccProfile: string | null = null;
      const colr = this.findBox(buffer, "colr", ipco.pos, ipco.pos + ipco.size);
      if (colr) {
        const colrType = buffer.toString("ascii", colr.pos, colr.pos + 4);
        if (colrType === "nclx") {
          // nclx profile: color primaries, transfer, matrix
          // Simplified: We can check matrix coefficient for YUV vs RGB, but for now, flag as ycbcr if not RGB
          const matrix = buffer.readUInt16BE(colr.pos + 6);
          colorModel = matrix === 2 ? "rgb" : "ycbcr"; // 2 is RGB identity
        } else if (colrType === "rICC" || colrType === "prof") {
          colorSpace = "unknown"; // ICC profile present
          iccProfile = "embedded";
        }
      }
      // Check for alpha: Look for 'auxC' box with alpha URI
      const auxC = this.findBox(buffer, "auxC", ipco.pos, ipco.pos + ipco.size);
      if (
        auxC &&
        buffer
          .toString("ascii", auxC.pos, auxC.pos + auxC.size)
          .includes("alpha")
      ) {
        hasAlpha = true;
        if (colorModel === "rgb") {
          colorModel = "rgba";
        } else if (colorModel === "ycbcr") {
          colorModel = "ycck";
        } else if (colorModel === "grayscale" || colorModel === "unknown") {
          colorModel = "grayscale-alpha";
        }
      }
      const xmpXml = this.parseXmpFromAvif(buffer, meta, ipco);
      let exifDateTimeOriginal: string | null = null;
      if (xmpXml) {
        // Simple native parse: Find xmp:CreateDate or photoshop:DateCreated (common for original date)
        // This is regex-free; use string search for robustness
        let dateStart = xmpXml.indexOf('xmp:CreateDate="');
        if (dateStart === -1)
          dateStart = xmpXml.indexOf('photoshop:DateCreated="');
        if (dateStart !== -1) {
          dateStart += 16; // Skip to value
          const dateEnd = xmpXml.indexOf('"', dateStart);
          if (dateEnd !== -1) {
            exifDateTimeOriginal = xmpXml.substring(dateStart, dateEnd);
          }
        }
        // If needed, add more tags like dc:date, but this covers basics
      }
      // Animated/frames: If 'avis', it's sequence; count primary + alpha items or moov tracks, but simplified count iloc items
      let frames = 1;
      let animated = isAvis;
      if (animated) {
        const iloc = this.findBox(buffer, "iloc", metaSubStart, metaSubEnd);
        if (iloc) {
          // Simplified: Count items (full parse complex, assume frames = item count / 2 if alpha)
          const version = buffer?.[iloc.pos] ?? 0;
          const itemCountPos = iloc.pos + (version < 2 ? 4 : 6);
          let itemCount = buffer?.readUInt16BE(itemCountPos) ?? 0;
          if (version >= 2) itemCount = buffer?.readUInt32BE(itemCountPos) ?? 0; // Override for v2+
          frames = Math.max(1, Math.floor(itemCount / (hasAlpha ? 2 : 1))); // Approx: Divide by 2 if alpha layers
        }
      }

      return {
        width,
        height,
        format: "avif",
        frames,
        animated,
        colorModel,
        hasAlpha: hasAlpha ? true : null,
        orientation: null, // Can have 'irot' or 'imir' transforms, but rare
        aspectRatio: width / height,
        colorSpace,
        iccProfile,
        exifDateTimeOriginal // Can have 'XMP' box, but parse XMP for date if needed
      } satisfies ImageSpecs;
    }

    throw new Error("Unsupported image format or invalid file");
  }
}
