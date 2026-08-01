export interface ObjOfArrsBaseArr {
  id: string;
  obj: string;
}

export interface ObjOfArrsEntity {
  rawBuff: Buffer | Uint8Array;
  pageObjArr: ObjOfArrsBaseArr[];
  xObjArr: ObjOfArrsBaseArr[];
  aObjArr: ObjOfArrsBaseArr[];
  xmp?: {
    createDate: string;
    modifyDate: string;
    producer: string;
    creatorTool: string;
  };
  examine?: string[];
  countFallback: number;
  pageIdsMap: Map<number, string>;
  annotIdsMap: Map<number, string[]>;
  annotsMap: Map<number, string>;
  examineUnmodified?: string[];
  version: string;
  linearized: boolean;
}

export interface BoundingBox {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

type PDFRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type PDFVersions = `1.${PDFRange}` | "2.0";

export type PdfEncodingUnion =
  | "unknown"
  | "jpeg-dct"
  | "jpeg2000"
  | "ccitt-fax"
  | "jbig2"
  | "deflate"
  | "lzw"
  | "hex"
  | "ascii85"
  | "rle";

export type PdfColorSpace =
  | "DeviceRGB"
  | "DeviceGray"
  | "CalRGB"
  | "Lab"
  | "ICCBased"
  | "Indexed"
  | "DeviceCMYK"
  | (string & {});
/**
 * Nested data present with CalRGB ColorSpace
 */
export interface CalRgbMetadata {
  whitePoint: { x: number; y: number; z: number };
  blackPoint?: { x: number; y: number; z: number };
  gamma: {
    gr: number;
    gg: number;
    gb: number;
  };
  matrix: {
    // red primary
    xa: number;
    ya: number;
    za: number;
    // green primary
    xb: number;
    yb: number;
    zb: number;
    // blue primary
    xc: number;
    yc: number;
    zc: number;
  };
}

export interface ImgCacheBase {
  id: string;
  length: number;
  width: number;
  height: number;
  aspectRatio: number;
  colorSpace: PdfColorSpace;
  calRgb?: CalRgbMetadata;
  filter: string;
  encoding: PdfEncodingUnion;
}

export interface ImgsCache extends ImgCacheBase {
  submaskObjId?: string;
  submaskImg?: ImgCacheBase;
}

export interface PageWorkupAggProps {
  id: string;
  structParents: number;
  pageNumber: number;
  pageContentId: string;
  imgCounts: number;
  annotCounts: number;
  imgIds: string[];
  annotIds: Set<string>;
  annots: AnnotsCache[];
  imgs: ImgsCache[];
}

export interface AnnotsCache {
  id: string;
  href: string;
  rect: BoundingBox;
  ext: string;
}
