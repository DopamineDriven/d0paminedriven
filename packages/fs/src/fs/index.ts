import { resolve } from "node:path";
import sharp from "sharp";
import { FsFetch } from "@/fs-fetch/index.ts";

export default class Fs extends FsFetch {
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
    cwd ??= process.cwd();
  }

  public async getImageSpecs(filePath: string, size = 4096 * 6) {
    if (filePath.startsWith("https")) {
      return await this.extractRemote(filePath, size);
    }
    return await this.extractViaPath(filePath, size);
  }

  public async getImageSpecsFlexi(target: Buffer | string, size = 4096 * 6) {
    if (Buffer.isBuffer(target)) {
      return this.getImageSpecsWorkup(target, size);
    } else {
      return await this.getImageSpecs(target, size);
    }
  }

  public async getImageSpecsTmp(filepath: string, size = 4096 * 6) {
    return this.extractViaPath(resolve(this.tmpDir, filepath), size);
  }

  /**
   * Extract image metadata using streaming (only reads ~4KB)
   * Much more memory efficient for large images
   */
  public async getImageSpecsStream(filePath: string, size = 4096) {
    return this.extractFromPath(filePath, size);
  }

  public async getImageSpecsStreamTmp(filePath: string) {
    return this.extractFromPath(resolve(this.tmpDir, filePath));
  }

  /**
   *
   * @access package-private
   *
   * work in progress, for internal package maintainer use only
   */
  // USE fluent-ffmpeg for video/animated image transforms (apng, etc)
  // https://www.npmjs.com/package/fluent-ffmpeg
  // https://www.npmjs.com/package/@types/fluent-ffmpeg
  public async imageTransform<
    const F extends
      | "webp"
      | "avif"
      | "jpg"
      | "gif"
      | "svg"
      | "png"
      | "tif"
      | "tiff"
      | "jp2"
      | "jpeg"
  >({
    format,
    target,
    quality = 80,
    tint,
    resize
  }: {
    format: F;
    target: Buffer<ArrayBuffer>;
    quality?: number;
    tint?:
      | string
      | {
          r?: number | undefined;
          g?: number | undefined;
          b?: number | undefined;
          alpha?: number | undefined;
        };
    resize?: {
      widthOrOptions?: number | sharp.ResizeOptions | null;
      height?: number | null;
      options?: sharp.ResizeOptions;
    };
  }) {
    if (tint && !resize) {
      return await sharp(target)
        .toFormat(format, { quality })
        .tint(tint)
        .toBuffer();
    } else if (!tint && resize) {
      return await sharp(target)
        .toFormat(format, { quality })
        .resize(resize.widthOrOptions, resize.height, resize.options)
        .toBuffer();
    } else if (tint && resize) {
      return await sharp(target)
        .toFormat(format, { quality })
        .tint(tint)
        .resize(resize.widthOrOptions, resize.height, resize.options)
        .toBuffer();
    } else {
      return await sharp(target).toFormat(format, { quality }).toBuffer();
    }
  }
}
