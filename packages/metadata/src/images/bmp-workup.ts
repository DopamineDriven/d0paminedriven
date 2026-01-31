import type { ImageSpecs } from "@/types/index.ts";
import { ImgMetadataExtractorWorkup } from "@/images/workup.ts";

export class BmpExtractorWorkup extends ImgMetadataExtractorWorkup {
  protected bmp(buffer: Buffer<ArrayBufferLike>) {
    const width = buffer.readInt32LE(18);
    const height = Math.abs(buffer.readInt32LE(22));
    const bitDepth = buffer.readUInt16LE(28);
    const colorModel = (
      bitDepth <= 8 ? "indexed" : "rgb"
    ) as ImageSpecs["colorModel"];
    return {
      type: "IMAGE",
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
  /**
   * Signature BM, width/height at offsets 18/22 (little-endian, height can be negative for top-down)
   */
  protected isBmpSignature(buffer: Buffer<ArrayBufferLike>) {
    return buffer.length >= 26 && buffer?.[0] === 0x42 && buffer?.[1] === 0x4d;
  }
}
