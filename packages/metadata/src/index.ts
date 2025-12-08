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
export { ImgMetadataExtractor } from "@/images/index.ts";
export { DocMixin, ImgMixin, create, createInstance } from "@/mixins/index.ts";
export type {
  BoxInfo,
  Constructor,
  DocSpecs,
  ExpandedDocSpecs,
  ExpandedImgSpecs,
  ExtractorHardenedOptions,
  ExtractorOptions,
  ImageSpecs,
  PdfDocSpecs,
  PresentationDocSpecs,
  SpreadSheetDocSpecs,
  ZipEntry
} from "@/types/index.ts";
export type {
  ArrFieldReplacer,
  CTR,
  DX,
  DeepPartial,
  DeepPartialFields,
  DeepReplace,
  Equal,
  Expect,
  Extends,
  InferGSPRT,
  InferGSPRTWorkup,
  IsExact,
  IsOptional,
  OnlyOptional,
  OnlyRequired,
  RTC,
  RequireNested,
  Rm,
  TCN,
  Unenumerate,
  Without,
  XOR
} from "@/types/utils.ts";
export { Extract } from "@/extract/index.ts";
export { ExtractClient } from "@/extract/client.ts";

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
}
