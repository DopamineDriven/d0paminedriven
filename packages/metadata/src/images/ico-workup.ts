import type { ImageSpecs } from "@/types/index.ts";
import { SvgExtractorWorkup } from "@/images/svg-workup.ts";

export class IcoExtractorWorkup extends SvgExtractorWorkup {
  protected ico(
    rawbuffer: Buffer<ArrayBufferLike>,
    buffer: Buffer<ArrayBufferLike>
  ) {
    const frames = buffer.readUInt16LE(4); // Number of icons
    if (frames === 0) throw new Error("Invalid ICO: No images");

    // Each entry: width (u8, 0=256), height (u8, 0=256), colors (u8), reserved (u8), planes/hotspotX (u16), bpp/hotspotY (u16), size (u32), offset (u32)
    let maxWidth = 0;
    let maxHeight = 0;
    let hasAlpha: boolean | null = null;
    let colorModel = "unknown" as ImageSpecs["colorModel"];

    for (let i = 0; i < frames; i++) {
      const entryPos = 6 + i * 16;
      if (entryPos + 16 > buffer.length) break; // Truncated

      let entryWidth = buffer[entryPos];
      let entryHeight = buffer[entryPos + 1];
      entryWidth = entryWidth === 0 ? 256 : entryWidth;
      entryHeight = entryHeight === 0 ? 256 : entryHeight;

      const bpp = buffer.readUInt16LE(entryPos + 6); // Bits per pixel
      const _size = buffer.readUInt32LE(entryPos + 8);
      const offset = buffer.readUInt32LE(entryPos + 12);

      // Rough color model based on bpp (common: 1,4,8 indexed; 24 rgb; 32 rgba)
      if (bpp <= 8) colorModel = "indexed";
      else if (bpp === 24) colorModel = "rgb";
      else if (bpp === 32) {
        colorModel = "rgba";
        hasAlpha = true;
      }

      // To detect embedded PNG: If data at offset starts with PNG sig
      if (
        offset + 8 <= rawbuffer.length && // Use full buffer for data
        rawbuffer[offset] === 0x89 &&
        rawbuffer[offset + 1] === 0x50 &&
        rawbuffer[offset + 2] === 0x4e &&
        rawbuffer[offset + 3] === 0x47 &&
        rawbuffer[offset + 4] === 0x0d &&
        rawbuffer[offset + 5] === 0x0a &&
        rawbuffer[offset + 6] === 0x1a &&
        rawbuffer[offset + 7] === 0x0a
      ) {
        // Embedded PNG: Could have alpha
        hasAlpha = true;
        colorModel = "rgba"; // Assume possible
      }

      // Track largest size
      if (entryWidth && entryWidth > maxWidth) maxWidth = entryWidth;
      if (entryHeight && entryHeight > maxHeight) maxHeight = entryHeight;
    }

    return {
      type: "IMAGE",
      width: maxWidth,
      height: maxHeight,
      format: "ico",
      frames,
      animated: false, // ICO not animated
      hasAlpha,
      orientation: null,
      aspectRatio: maxWidth / maxHeight,
      colorModel,
      colorSpace: "srgb", // Typically
      iccProfile: null,
      exifDateTimeOriginal: null
    } satisfies ImageSpecs;
  }
  /**
   * Starts with 00 00 01 00 (reserved + type=1), then numImages (u16LE)
   */
  protected isIcoSignature(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer.length >= 6 &&
      buffer?.[0] === 0x00 &&
      buffer?.[1] === 0x00 &&
      buffer?.[2] === 0x01 &&
      buffer?.[3] === 0x00
    );
  }
}
