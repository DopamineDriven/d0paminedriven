export { DocMetadataExtractor } from "@/docs/index.ts";
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
export { Extract } from "@/extract/index.ts";
export { ExtractClient  } from "@/extract/client.ts";

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
