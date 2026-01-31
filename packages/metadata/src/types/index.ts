import { DocMetadataExtractor } from "@/docs/index.ts";
import { ImgMetadataExtractor } from "@/images/index.ts";

export type ColorSpaceUnion =
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

export type ColorModelUnion =
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

export type ImageFormatUnion =
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

export interface ImageSpecs<T = unknown> {
  type: "IMAGE";
  width: number;
  height: number;
  format: ImageFormatUnion;
  frames: number;
  animated: boolean;
  hasAlpha: boolean | null;
  orientation: number | null; // EXIF orientation (1-8) or null
  aspectRatio: number;
  colorModel: ColorModelUnion;
  colorSpace: ColorSpaceUnion;
  iccProfile: string | null; // Profile name/description if available, or 'embedded' if present but unnamed, null otherwise
  exifDateTimeOriginal: string | null; // ISO-like string or null
  metadata?: T extends null | undefined ? Record<string, string> : T;
}
export type TextChunksEntity<T extends boolean = true | false> = {
  tEXt: T extends true ? string : Record<string, string>;
  zTXt: T extends true ? string : Record<string, string>;
  iTXt: T extends true ? string : Record<string, string>;
};
export interface PngIccProfileMeta {
  /** Profile name from iCCP chunk */
  name: string | null;
  /** ICC version string (e.g., "2.1.0") */
  version: string | null;
  /** Profile class (e.g., "Display Device Profile") */
  profileClass: string | null;
  /** CMM type (e.g., "Linotronic", "Adobe") */
  cmmType: string | null;
  /** Color space data field (e.g., "RGB", "CMYK") */
  colorSpaceData: string | null;
  /** Profile connection space (e.g., "XYZ", "Lab") */
  pcs: string | null;
  /** Device manufacturer */
  deviceManufacturer: string | null;
  /** Profile creation date */
  dateTime: string | null;
}

export interface PngDpi {
  x: number;
  y: number;
  /** Unit: "meter" if pHYs unit=1, "unknown" if unit=0 */
  unit: "meter" | "unknown" | (string & {});
}

export interface PngXmpFields {
  // ---- XMP Core (xmp:*) ----
  /** XMP toolkit identifier from x:xmptk */
  xmpToolkit?: string;
  /** Creator tool (e.g., "Adobe Photoshop 21.2 (Macintosh)") */
  creatorTool?: string;
  /** XMP create date */
  createDate?: string;
  /** XMP modify date */
  modifyDate?: string;
  /** XMP metadata date */
  metadataDate?: string;

  // ---- XMP Media Management (xmpMM:*) ----
  /** XMP document ID */
  documentId?: string;
  /** XMP instance ID */
  instanceId?: string;
  /** Original document ID */
  originalDocumentId?: string;
  /** Rendition class (e.g., "proof:pdf") */
  renditionClass?: string;

  // ---- Derived From (stRef:*) ----
  /** Derived-from document ID */
  derivedFromDocumentId?: string;
  /** Derived-from instance ID */
  derivedFromInstanceId?: string;
  /** Derived-from original document ID */
  derivedFromOriginalDocumentId?: string;

  // ---- Dublin Core (dc:*) ----
  /** Dublin Core creator */
  creator?: string;
  /** Dublin Core title */
  title?: string;
  /** Dublin Core description */
  description?: string;
  /** Dublin Core format (MIME type) */
  format?: string;
  /** Dublin Core rights */
  rights?: string;

  // ---- Photoshop (photoshop:*) ----
  /** Photoshop color mode (e.g., "4" for CMYK, "8" for Lab) */
  colorMode?: string;
  /** Photoshop ICC profile name */
  iccProfile?: string;

  // ---- TIFF (tiff:*) ----
  /** TIFF software field */
  software?: string;
  /** TIFF orientation (1-8) */
  orientation?: string;
  /** TIFF X resolution (e.g., "4000000/10000") */
  xResolution?: string;
  /** TIFF Y resolution */
  yResolution?: string;
  /** TIFF resolution unit (1=None, 2=Inch, 3=Centimeter) */
  resolutionUnit?: string;
  /** TIFF artist field */
  artist?: string;
  /** TIFF copyright field */
  copyright?: string;

  // ---- EXIF (exif:*) ----
  /** EXIF DateTimeOriginal */
  dateTimeOriginal?: string;
  /** EXIF color space (1=sRGB, 65535=Uncalibrated) */
  exifColorSpace?: string;
  /** EXIF pixel X dimension */
  pixelXDimension?: string;
  /** EXIF pixel Y dimension */
  pixelYDimension?: string;

  // ---- PDF (pdf:*) ----
  /** PDF producer (e.g., "Adobe PDF library 15.00") */
  producer?: string;

  // ---- Illustrator (illustrator:*) ----
  /** Illustrator document type */
  illustratorType?: string;
  /** Illustrator creator sub-tool (e.g., "AIRobin") */
  creatorSubTool?: string;

  // ---- XMP Paged Text (xmpTPg:*) ----
  /** Number of pages */
  nPages?: string;
  /** Has visible transparency */
  hasVisibleTransparency?: string;
  /** Has visible overprint */
  hasVisibleOverprint?: string;

  // ---- AI Generation (ai:* or common conventions) ----
  /** AI generation prompt (Stable Diffusion, ComfyUI, DALL-E, etc.) */
  aiPrompt?: string;
  /** AI model identifier */
  aiModel?: string;
  /** AI generation seed */
  aiSeed?: string;
  /** AI negative prompt */
  aiNegativePrompt?: string;
  /** AI sampler name */
  aiSampler?: string;
  /** AI CFG scale */
  aiCfgScale?: string;
  /** AI steps */
  aiSteps?: string;
}

export interface XmpParsed {
  /** x:xmptk attribute from root element */
  xmptk: string | null;
  /** Attribute-style values keyed by namespace then field */
  attrs: Record<string, Record<string, string>>;
  /** Element-style values keyed by namespace then field */
  elements: Record<string, Record<string, string>>;
  /** stRef:* attributes from DerivedFrom block */
  stRef: Record<string, string>;
  /** stEvt:* attributes from History events */
  history: Record<string, string>[];
}

export interface PngMetadata<T extends boolean = true | false> {
  /** Bit depth from IHDR (1, 2, 4, 8, or 16) */
  bitDepth: number | null;
  /** Physical pixel dimensions / DPI info from pHYs chunk */
  dpi: PngDpi | null;
  /** Pixel aspect ratio if pHYs present but unit unknown */
  pixelAspectRatio: number | null;
  /** Parsed ICC profile header data */
  iccProfileMeta: PngIccProfileMeta | null;
  /** Extracted XMP fields (parsed once, mapped to structured fields) */
  xmp: PngXmpFields | string | null;
  /** Text chunks stored as stringified JSON (use convertTextChunks to expand or collapse) */
  textChunks: TextChunksEntity<T>;
  /** Modification time from tIME chunk */
  modificationTime: string | null;
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
export type PdfImageEncoding =
  | "jpeg"
  | "jpeg2000"
  | "png-like"
  | "ccitt-fax"
  | "jbig2"
  | "inline"
  | "unknown";

export type PdfScannedIndicators = {
  /** CCITT-Fax or JBIG2 encoding detected (common in scanned docs) */
  hasFaxEncoding: boolean;
  /** Count of BT...ET text blocks in the document */
  textBlockCount: number;
  /** ToUnicode CMap present (indicates real text layer, not OCR) */
  hasToUnicode: boolean;
};

export interface PdfImageAnalysisMeta {
  hasImages: boolean;
  imageCount: number;
  imagesPerPage: number;
  /** XObject image count (standard embedded images) */
  xObjectImageCount: number;
  /** Inline image count (BI...ID...EI blocks) */
  inlineImageCount: number;
  /** Detailed metadata for each detected image */
  images: PdfImageEntry[];
  /** Aggregated count by encoding type for quick access */
  encodingCounts: PdfImageEncodingCounts;
  /** Form XObjects, complex paths, or shading patterns detected */
  hasVectorGraphics: boolean;
  /** Structural indicators for scanned document detection */
  scannedIndicators: PdfScannedIndicators;
}

export interface PdfImageEntry {
  /** Object number in the PDF (e.g., "66" from "66 0 obj") */
  objectId: string | null;
  /** Image width in pixels */
  width: number | null;
  /** Image height in pixels */
  height: number | null;
  /** Color space (DeviceRGB, DeviceCMYK, DeviceGray, Indexed, ICCBased, etc.) */
  colorSpace: string | null;
  /** Bits per color component (typically 8, sometimes 1 for bilevel) */
  bitsPerComponent: number | null;
  /** Detected encoding type */
  encoding: PdfImageEncoding;
  /** Raw filter value(s) from PDF */
  filter: string | null;
  /** Soft mask reference (for transparency) */
  sMask: string | null;
  /** Color transform flag (JPEG-specific, 0 = no transform) */
  colorTransform: number | null;
  /** Page number where image appears (if determinable) */
  pageNumber: number | null;
  /** Whether image is inline (BI...ID...EI) vs XObject */
  isInline: boolean;
}
export type PdfImageEncodingCounts = {
  [K in PdfImageEncoding]?: number;
};

export interface DocSpecs<T = unknown> {
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
  metadata?: T;
}

export type ZipEntry = {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number; // 0 = store, 8 = deflate
  localHeaderOffset: number;
};

export interface ExpandedImgSpecs<T = unknown> extends ImageSpecs<T> {
  source?: string;
  fetchedBytes?: number;
  byteSize?: number;
  contentType?: string;
}

export interface ExpandedDocSpecs<T = unknown> extends DocSpecs<T> {
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
