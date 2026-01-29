export { DocMetadataExtractor } from "@/docs/index.ts";
export {
  extMimeMap,
  mimeToExt,
  MimeWorkupService
} from "@/docs/mime-workup.ts";
export type {
  AllMimeTypes,
  FileExtension,
  FileExtensionToMimeType,
  InferTopLevelPresent,
  MimeTopLevelType,
  MimeType,
  MimeTypeToFileExtension,
  ParsedUrlInfo,
  PresentMimeTopLevelTypes
} from "@/docs/mime-workup.ts";
export { ImgMetadataExtractorWorkup } from "@/images/workup.ts";
export { AvifExtractorWorkup } from "@/images/avif-workup.ts";
export { BmpExtractorWorkup } from "@/images/bmp-workup.ts";
export { GifExtractorWorkup } from "@/images/gif-workup.ts";
export { HeicExtractorWorkup } from "@/images/heic-workup.ts";
export { IcoExtractorWorkup } from "@/images/ico-workup.ts";
export { JpgExtractorWorkup } from "@/images/jpg-workup.ts";
export { PngExtractorWorkup } from "@/images/png-workup.ts";
export { SvgExtractorWorkup } from "@/images/svg-workup.ts";
export { TiffExtractorWorkup } from "@/images/tiff-workup.ts";
export { WebpExtractorWorkup } from "@/images/webp-workup.ts";
export { ImgMetadataExtractor } from "@/images/index.ts";
export { DocMixin, ImgMixin, create, createInstance } from "@/mixins/index.ts";
export type {
  BoxInfo,
  ColorModelUnion,
  ColorSpaceUnion,
  Constructor,
  DocSpecs,
  ExpandedDocSpecs,
  ExpandedImgSpecs,
  ExtractorHardenedOptions,
  ExtractorOptions,
  ImageFormatUnion,
  ImageSpecs,
  PdfDocSpecs,
  PdfImageAnalysisMeta,
  PdfImageEncoding,
  PdfImageEncodingCounts,
  PdfImageEntry,
  PdfScannedIndicators,
  PngDpi,
  PngIccProfileMeta,
  PngMetadata,
  PngXmpFields,
  PresentationDocSpecs,
  SpreadSheetDocSpecs,
  TextChunksEntity,
  XmpParsed,
  ZipEntry
} from "@/types/index.ts";
export type {
  ArrFieldReplacer,
  CommonDiscriminants,
  CTR,
  DiscriminatedUnionToRecord,
  DX,
  DeepPartial,
  DeepPartialFields,
  DeepReplace,
  Equal,
  Expect,
  Extends,
  Include,
  InferGSPRT,
  InferGSPRTWorkup,
  IsExact,
  IsOptional,
  LiteralUnion,
  OnlyOptional,
  OnlyRequired,
  RTC,
  RequireNested,
  Rm,
  TCN,
  Unenumerate,
  UnionToRecord,
  Without,
  XOR
} from "@/types/utils.ts";
export { Extract } from "@/extract/index.ts";
export { ExtractClient } from "@/extract/client.ts";
export { HelperService } from "@/helpers/index.ts";
export type { PropGetters } from "@/helpers/index.ts";

declare global {

  interface JSON {
    parse<T = unknown>(
      text: string,
      reviver?: (this: any, key: string, value: any) => any
    ): T;
  }
  interface Body {
    json<T = unknown>(): Promise<T>;
  }
  interface ObjectConstructor {
    keys<T = object>(
      o: T
    ): (keyof T extends infer K
      ? K extends string
        ? K
        : K extends number
          ? `${K}`
          : never
      : never)[];
    entries<T = object, V extends keyof T = keyof T>(
      o: T
    ): (V extends infer K
      ? K extends string
        ? [K, T[V]]
        : K extends number
          ? [`${K}`, T[V]]
          : never
      : never)[];
  }
}
