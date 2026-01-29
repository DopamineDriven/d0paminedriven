import type { ImageSpecs } from "@/types/index.ts";
import { BmpExtractorWorkup } from "@/images/bmp-workup.ts";

export class SvgExtractorWorkup extends BmpExtractorWorkup {
  protected headerText(buffer: Buffer<ArrayBufferLike>) {
    return buffer.toString("utf-8", 0, Math.min(1024, buffer.length)).trim();
  }
  protected svg(buffer: Buffer<ArrayBufferLike>) {
    const headerText = this.headerText(buffer);
    const widthMatch = headerText.match(
      /width\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i
    );
    const heightMatch = headerText.match(
      /height\s*=\s*["']?(\d+(?:\.\d+)?)(?:px)?["']?/i
    );
    const viewBoxMatch = headerText.match(
      /viewBox\s*=\s*["']?(\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?)["']?/i
    );
    let width = 0;
    let height = 0;

    if (widthMatch?.[1] && heightMatch?.[1]) {
      width = parseFloat(widthMatch[1]);
      height = parseFloat(heightMatch[1]);
    } else if (viewBoxMatch) {
      const [_x0, _y0, vbWidth, vbHeight] = viewBoxMatch?.[1]
        ?.split(/\s+/)
        .map(t => Number.parseFloat(t)) as [number, number, number, number];
      width = vbWidth;
      height = vbHeight;
    } else {
      // Default to intrinsic size if not specified (e.g., 100% but for metadata, assume 0 or fallback)
      width = 0; // Or throw if no dims
      height = 0;
      throw new Error("SVG has no defined width/height or viewBox");
    }
    const animated =
      headerText.includes("<animate") ||
      headerText.includes("<animation") ||
      headerText.includes("<motion."); // Rough check for SMIL
    const frames = 1;

    return {
      type: "IMAGE",
      width,
      height,
      format: "svg",
      frames,
      animated,
      hasAlpha: true, // SVG supports transparency
      orientation: null,
      aspectRatio: width / height || 1, // Fallback if 0
      colorModel: "vector",
      colorSpace: "srgb", // Typically sRGB for web SVGs
      iccProfile: null, // Rare, but can embed ICC in <color-profile>
      exifDateTimeOriginal: null // No standard EXIF
    } satisfies ImageSpecs;
  }

  protected isSvgSignature(buffer: Buffer<ArrayBufferLike>) {
    const headerText = this.headerText(buffer);
    return (
      headerText.startsWith("<svg") ||
      (headerText.startsWith("<?xml") && headerText.includes("<svg"))
    );
  }
}
