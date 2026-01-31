import { PngExtractorWorkup } from "@/images/png-workup.ts";
import { ImageSpecs, PngMetadata } from "@/types/index.ts";

export class ImgMetadataExtractor extends PngExtractorWorkup {
  public getImageSpecsWorkup<T = unknown>(
    rawbuffer: Buffer<ArrayBufferLike>,
    size = 4096 * 8
  ) {
    // 8KB handles most JPEGs with metadata while minimizing memory usage
    // Professional photos with EXIF + Photoshop data typically need 6-7KB
    // For TIFF, we'll need to use the full buffer since IFDs can be anywhere
    const MAX_HEADER_SIZE = size;
    const buffer = rawbuffer.subarray(
      0,
      Math.min(rawbuffer.length, MAX_HEADER_SIZE)
    );
    if (this.isPngSignature(buffer)) {
      return this.png(buffer) as ImageSpecs<PngMetadata<true>>;
    }
    if (this.isJpegSignature(buffer)) {
      return this.jpeg(buffer) as ImageSpecs<T>;
    }
    if (this.isGifSignature(buffer)) {
      return this.gif(buffer) as ImageSpecs<T>;
    }
    if (this.isBmpSignature(buffer)) {
      return this.bmp(buffer) as ImageSpecs<T>;
    }
    if (this.isWebpSignature(buffer)) {
      return this.webp(buffer) as ImageSpecs<T>;
    }
    if (this.isAvifSignature(buffer)) {
      return this.avif(buffer) as ImageSpecs<T>;
    }
    if (this.isHeicSignature(buffer)) {
      return this.heic(buffer) as ImageSpecs<T>;
    }
    if (this.isSvgSignature(buffer)) {
      return this.svg(buffer) as ImageSpecs<T>;
    }
    if (this.isIcoSignature(buffer)) {
      return this.ico(rawbuffer, buffer) as ImageSpecs<T>;
    }
    if (this.isTiffSignature(buffer)) {
      return this.tiff(rawbuffer, buffer) as ImageSpecs<T>;
    }
    throw new Error("Unsupported image format or invalid file");
  }
}
