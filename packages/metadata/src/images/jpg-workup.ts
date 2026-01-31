import type { ImageSpecs } from "@/types/index.ts";
import { WebpExtractorWorkup } from "@/images/webp-workup.ts";

export class JpgExtractorWorkup extends WebpExtractorWorkup {
  protected jpeg(buffer: Buffer<ArrayBufferLike>) {
    let colorSpace = "srgb" as ImageSpecs["colorSpace"],
      hasAlpha = false;
    let pos = 2,
      colorModel = "unknown" as ImageSpecs["colorModel"],
      width = 0,
      height = 0,
      iccProfile: string | null = null,
      orientation: number | null = null,
      exifDateTimeOriginal: string | null = null;

    while (pos < buffer.length - 10) {
      if (buffer[pos] !== 0xff) {
        // try to resync to next 0xFF
        const nextFF = buffer.indexOf(0xff, pos + 1);
        if (nextFF === -1 || nextFF >= buffer.length - 4) break;
        pos = nextFF;
        continue;
      }
      const marker = buffer[pos + 1];
      if (marker === 0xda) break; // Start of Scan, no more headers
      if (pos + 4 > buffer.length) break;
      const segmentSize = buffer.readUInt16BE(pos + 2);

      if (segmentSize < 2) {
        pos += 2; // Skip invalid segment
        continue;
      }
      const segmentEnd = pos + 2 + segmentSize;
      if (segmentEnd > buffer.length) {
        // Truncated segment - salvage what can be salvaged
        if (
          marker &&
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          // Try to extract dimensions if we have enough data
          if (pos + 9 <= buffer.length) {
            const numComponents = buffer[pos + 9];
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
            if (pos + 7 <= buffer.length - 2) {
              width = buffer.readUInt16BE(pos + 7);
            }
            if (pos + 5 <= buffer.length - 2) {
              height = buffer.readUInt16BE(pos + 5);
            }
          }
        }
        break; // Can't continue past truncated segment
      }
      if (
        marker &&
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const numComponents = buffer[pos + 9]; // After length (2 bytes) + precision (1) = pos + 4
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
        if (pos + 18 <= buffer.length) {
          const iccHeader = buffer.toString("ascii", pos + 4, pos + 18);
          if (iccHeader.startsWith("ICC_PROFILE")) {
            iccProfile = "embedded";
            colorSpace = "unknown"; // Override default since ICC is present (parse ICC for exact space if needed)
          }
        }
      } else if (marker === 0xff) {
        pos++;
        continue;
      }
      pos = segmentEnd;

      while (pos < buffer.length && buffer[pos] === 0x00) {
        pos++;
      }

      while (
        pos < buffer.length - 1 &&
        buffer[pos] === 0xff &&
        buffer[pos + 1] === 0xff
      ) {
        pos++;
      }
    }

    if (width === 0) throw new Error("No dimensions found in JPEG file");
    return {
      type: "IMAGE",
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
  /**
   * Starts with FF D8, dimensions in SOF marker (FF C0-FF CF, excluding some)
   */
  protected isJpegSignature(buffer: Buffer<ArrayBufferLike>) {
    return buffer.length >= 10 && buffer[0] === 0xff && buffer[1] === 0xd8;
  }
}
