import type { ImageSpecs } from "@/types/index.ts";
import { AvifExtractorWorkup } from "@/images/avif-workup.ts";

export class WebpExtractorWorkup extends AvifExtractorWorkup {
  protected webp(buffer: Buffer<ArrayBufferLike>) {
    const chunkType = buffer.toString("ascii", 12, 16);
    let colorSpace = "srgb" as ImageSpecs["colorSpace"]; // Default to sRGB for WebP
    let colorModel = "unknown" as ImageSpecs["colorModel"],
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
        widthSubtractOne = buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
      }
      if (buffer?.[27] && buffer?.[28] && buffer?.[29]) {
        heightSubtractOne = buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
      }
      width = widthSubtractOne + 1;
      height = heightSubtractOne + 1;
      // Scan for additional chunks (ICCP for color profile, ANMF for animation frames)
      let pos = 30; // After VP8X
      if (animated) {
        frames = 0;
      }
      while (pos < buffer.length - 8) {
        const subChunkType = buffer.toString("ascii", pos, pos + 4);
        const subChunkSize = buffer.readUInt32LE(pos + 4);
        if (subChunkType === "ICCP") {
          iccProfile = "embedded";
          // When ICC profile is present, we can't assume the color space without parsing it
          colorSpace = "unknown";
        } else if (subChunkType === "ANMF" && animated) {
          frames++;
        }
        pos += 8 + subChunkSize + (subChunkSize % 2); // Padded to even
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
      type: "IMAGE",
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
  /**
   * RIFF container with WEBP, then VP8/VP8L/VP8X chunks
   */
  protected isWebpSignature(buffer: Buffer<ArrayBufferLike>) {
    return (
      buffer.length >= 30 &&
      this.toAscii(buffer, 0, 4) === "RIFF" &&
      this.toAscii(buffer, 8, 12) === "WEBP"
    );
  }
}
