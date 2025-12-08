/**
 * Client-side synchronous metadata extractor
 * Works only with buffers - no network operations
 * Provides the same rich metadata extraction as Extract class
 * Ideal for browser environments where you handle fetching separately
 */

import type { ExtractorOptions } from "@/types/index.ts";
import type { ExpandedDocSpecs, ExpandedImgSpecs } from "@/types/index.ts";
import { DocMixin, ImgMixin } from "@/mixins/index.ts";

class Base {
  constructor(_opts?: ExtractorOptions) {}
}

const Unified = ImgMixin(DocMixin(Base));

export class ExtractClient extends Unified {
  constructor(opts?: ExtractorOptions) {
    super(opts);
  }

  /**
   * Comprehensive MIME type detection from buffer magic bytes
   * Supports all image and document formats the package can process
   */
  private detectMimeType(buf: Buffer): string | undefined {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    ) {
      return "image/png";
    }

    // JPEG: FF D8 FF
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return "image/jpeg";
    }

    // WebP: RIFF....WEBP
    if (
      buf.length >= 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }

    // GIF: GIF87a or GIF89a
    if (
      buf.length >= 6 &&
      buf.toString("ascii", 0, 3) === "GIF" &&
      (buf.toString("ascii", 3, 6) === "87a" || buf.toString("ascii", 3, 6) === "89a")
    ) {
      return "image/gif";
    }

    // TIFF: II*\0 (little-endian) or MM\0* (big-endian) or BigTIFF variants
    if (
      buf.length >= 4 &&
      ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2a && buf[3] === 0x00) || // II*\0
        (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2a) || // MM\0*
        (buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2b && buf[3] === 0x00) || // II+\0 (BigTIFF)
        (buf[0] === 0x4d && buf[1] === 0x4d && buf[2] === 0x00 && buf[3] === 0x2b))   // MM\0+ (BigTIFF)
    ) {
      return "image/tiff";
    }

    // HEIC/HEIF: Check for ftyp box with HEIC brands
    if (buf.length >= 12 && buf.toString("ascii", 4, 8) === "ftyp") {
      const brand = buf.toString("ascii", 8, 12);
      if (
        brand === "heic" ||
        brand === "heix" ||
        brand === "hevc" ||
        brand === "hevx" ||
        brand === "heim" ||
        brand === "heis" ||
        brand === "hevm" ||
        brand === "hevs" ||
        brand === "mif1"
      ) {
        return "image/heic";
      }
      // AVIF: Check for avif brand
      if (brand === "avif" || brand === "avis") {
        return "image/avif";
      }
    }

    // BMP: BM
    if (buf.length >= 2 && buf[0] === 0x42 && buf[1] === 0x4d) {
      return "image/bmp";
    }

    // ICO: 00 00 01 00
    if (
      buf.length >= 4 &&
      buf[0] === 0x00 &&
      buf[1] === 0x00 &&
      buf[2] === 0x01 &&
      buf[3] === 0x00
    ) {
      return "image/x-icon";
    }

    // SVG: Check for <?xml or <svg
    if (buf.length >= 5) {
      const start = buf.toString("utf8", 0, Math.min(1000, buf.length));
      if (start.includes("<svg") || start.includes("<?xml")) {
        // Additional check to ensure it's actually SVG
        if (start.includes("svg") || start.includes("SVG")) {
          return "image/svg+xml";
        }
      }
    }

    // PDF: %PDF-
    if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") {
      return "application/pdf";
    }

    // ZIP (for DOCX, XLSX, PPTX detection)
    if (
      buf.length >= 4 &&
      buf[0] === 0x50 &&
      buf[1] === 0x4b &&
      (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07) &&
      (buf[3] === 0x04 || buf[3] === 0x06 || buf[3] === 0x08)
    ) {
      // Need to check for Office Open XML signatures by looking for specific directory names
      const bufStr = buf.toString("utf8", 0, Math.min(4096, buf.length));
      if (bufStr.includes("word/") || bufStr.includes("[Content_Types].xml")) {
        // Additional check for Word documents
        if (bufStr.includes("word/document.xml")) {
          return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
      }
      if (bufStr.includes("xl/") || bufStr.includes("worksheets")) {
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      }
      if (bufStr.includes("ppt/") || bufStr.includes("slides")) {
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      }
      return "application/zip";
    }

    return undefined;
  }

  /**
   * Extract metadata from a buffer
   * Automatically detects content type and returns rich metadata
   *
   * @param buffer - The file buffer to analyze
   * @returns Full metadata specs including dimensions, format, color info, EXIF, ICC profiles, etc.
   * @throws Error if content type cannot be detected or extraction fails
   */
  public extractFromBuffer(buffer: Buffer): ExpandedDocSpecs | ExpandedImgSpecs {
    // Detect content type from buffer
    const contentType = this.detectMimeType(buffer);

    if (!contentType) {
      throw new Error(
        "Unable to detect content type from buffer. Supported formats: " +
        "PNG, JPEG, WebP, GIF, TIFF, HEIC, AVIF, BMP, ICO, SVG, PDF, DOCX, XLSX, PPTX"
      );
    }

    // Use the full extraction pipeline based on content type
    try {
      if (contentType.startsWith("image/")) {
        // Use the full image workup method from ImgMixin
        // This provides complete metadata: dimensions, color info, EXIF, ICC profiles, etc.
        const imgSpecs = this.img.getImageSpecsWorkup(buffer, buffer.length);

        return {
          source: "buffer",
          byteSize: buffer.length,
          contentType,
          fetchedBytes: buffer.length,
          ...imgSpecs
        } satisfies ExpandedImgSpecs;
      } else {
        // Use the full document workup method from DocMixin
        // This provides page count, dimensions, title, author, creation date, etc.
        const docSpecs = this.docs.getDocumentSpecsWorkup(buffer, contentType);

        return {
          source: "buffer",
          byteSize: buffer.length,
          contentType,
          fetchedBytes: buffer.length,
          ...docSpecs
        } satisfies ExpandedDocSpecs;
      }
    } catch (error) {
      throw new Error(
        `Failed to extract metadata from ${contentType}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Alternative method that accepts an optional MIME type hint
   * Use this if you already know the MIME type and want to skip detection
   *
   * @param buffer - The file buffer to analyze
   * @param mimeType - The MIME type of the content
   * @returns Full metadata specs
   */
  public extractFromBufferWithType(
    buffer: Buffer,
    mimeType: string
  ): ExpandedDocSpecs | ExpandedImgSpecs {
    try {
      if (mimeType.startsWith("image/")) {
        const imgSpecs = this.img.getImageSpecsWorkup(buffer, buffer.length);

        return {
          source: "buffer",
          byteSize: buffer.length,
          contentType: mimeType,
          fetchedBytes: buffer.length,
          ...imgSpecs
        } satisfies ExpandedImgSpecs;
      } else {
        const docSpecs = this.docs.getDocumentSpecsWorkup(buffer, mimeType);

        return {
          source: "buffer",
          byteSize: buffer.length,
          contentType: mimeType,
          fetchedBytes: buffer.length,
          ...docSpecs
        } satisfies ExpandedDocSpecs;
      }
    } catch (error) {
      throw new Error(
        `Failed to extract metadata from ${mimeType}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
