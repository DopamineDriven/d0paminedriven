import type { ImageSpecs } from "@/types/index.ts";
import { IcoExtractorWorkup } from "@/images/ico-workup.ts";

export class GifExtractorWorkup extends IcoExtractorWorkup {
  protected gif(buffer: Buffer<ArrayBufferLike>) {
    const width = buffer.readUInt16LE(6),
      height = buffer.readUInt16LE(8);
    let frames = 0;
    let pos = 13; // After header (10) + screen descriptor (3 if no GCT, but skip GCT)
    const bufTen = buffer?.[10];
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
        const b = buffer?.[pos - 1];

        if (typeof b !== "undefined" && b & 0x80) pos += 3 << ((b & 0x07) + 1); // Local color table
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
      type: "IMAGE",
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

  /**
   * Signature GIF87a or GIF89a, width/height at offsets 6/8 (little-endian)
   */
  protected isGifSignature(buffer: Buffer<ArrayBufferLike>) {
    const gifHeader = this.toAscii(buffer, 0, 6);
    return (
      buffer.length >= 10 && (gifHeader === "GIF87a" || gifHeader === "GIF89a")
    );
  }
}
