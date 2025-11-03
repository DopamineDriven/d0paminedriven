import { DocMetadataExtractor } from "@/docs/index.ts";
import { ImgMetadataExtractor } from "@/images/index.ts";

export interface ImageSpecs {
  type: "IMAGE";
  width: number;
  height: number;
  format:
    | "apng"
    | "png"
    | "jpeg"
    | "gif"
    | "bmp"
    | "webp"
    | "avif"
    | "svg"
    | "ico"
    | "heic"
    | "tiff"
    | "unknown";
  frames: number;
  animated: boolean;
  hasAlpha: boolean | null;
  orientation: number | null; // EXIF orientation (1-8) or null
  aspectRatio: number;
  colorModel:
    | "rgb"
    | "rgba"
    | "grayscale"
    | "grayscale-alpha"
    | "indexed"
    | "cmyk"
    | "ycbcr"
    | "ycck"
    | "vector"
    | "lab"
    | "unknown";
  colorSpace:
    | "unknown"
    | "srgb"
    | "display_p3"
    | "adobe_rgb"
    | "prophoto_rgb"
    | "rec2020"
    | "rec709"
    | "cmyk"
    | "lab"
    | "xyz"
    | "gray";
  iccProfile: string | null; // Profile name/description if available, or 'embedded' if present but unnamed, null otherwise
  exifDateTimeOriginal: string | null; // ISO-like string or null
  metadata?: Record<string, string>;
}

// Helper for AVIF box finding
export interface BoxInfo {
  pos: number;
  size: number;
}

export interface PdfDocSpecs {
  pdfVersion: string | null;
  isEncrypted: boolean | null;
  isSearchable: boolean | null;
  isLinearized: boolean | null;
  hasForm: boolean | null;
  hasSignatures: boolean | null;
  hasAttachments: boolean | null;
  hasJavaScript: boolean | null;
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
  } | null;
}

export interface SpreadSheetDocSpecs {
  sheetCount: number | null;
  sheetNames: string[] | null;
  hasFormulas: boolean | null;
  hasMacros: boolean | null;
  hasPivotTables: boolean | null;
  hasCharts: boolean | null;
  activeSheet: number | null;
}

export interface PresentationDocSpecs {
  slideCount: number | null;
  hasAnimations: boolean | null;
  hasTransitions: boolean | null;
  hasNotes: boolean | null;
  hasMasterSlides: boolean | null;
  presentationFormat: "standard" | "widescreen" | null;
}

export interface DocSpecs {
  type: "DOCUMENT";
  format: string | null;
  mimeType: string | null;
  pageCount: number | null;
  wordCount: number | null;
  lineCount: number | null;
  language: string | null;
  encoding: string | null;
  author: string | null;
  subject: string | null;
  keywords: string[] | null;
  pdfVersion: string | null;
  isEncrypted: boolean | null;
  isSearchable: boolean | null;
  isLinearized: boolean | null;
  textPreview: string | null;
  createdDate: string | null;
  modifiedDate: string | null;
}

export type ZipEntry = {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number; // 0 = store, 8 = deflate
  localHeaderOffset: number;
};

export interface ExpandedImgSpecs extends ImageSpecs {
  source?: string;
  fetchedBytes?: number;
  byteSize?: number;
  contentType?: string;
}

export interface ExpandedDocSpecs extends DocSpecs {
  source?: string;
  fetchedBytes?: number;
  byteSize?: number;
  contentType?: string;

}

export type Constructor<A extends any[] = any[], I = object> = new (
  ...args: A
) => I;


export interface ExtractorOptions {
  img?: ImgMetadataExtractor;
  docs?: DocMetadataExtractor;
}

export interface ExtractorHardenedOptions extends ExtractorOptions {
  headers?: { [key: string]: string };
  /** CORS mode for fetch requests (browser environments). Default: 'cors' */
  corsMode?: RequestMode;
  /** Credentials mode for fetch requests. Default: 'same-origin' */
  credentials?: RequestCredentials;
  /** Given a CF URL, return an origin (S3/R2) URL for the same object. */
  originFallback?: (cfUrl: string) => Promise<string> | string;
  /** Invalidate one CF key (path or full URL OK; implementer can map to key). */
  invalidateCloudFrontKey?: (urlOrKey: string) => Promise<void>;
  /** Quarantine duration for suspect URLs (ms). Default: 6h */
  quarantineTtlMs?: number;
  /** Custom UA string for diagnostics */
  userAgent?: string;
  /** Enable verbose debug logging */
  debug?: boolean;
}

