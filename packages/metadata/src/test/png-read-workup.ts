import { Fs } from "@d0paminedriven/fs";
import type { ExpandedImgSpecs, Include, PngMetadata } from "@/index.ts";
import { Extract } from "@/index.ts";

const extract = new Extract();

const fs = new Fs(process.cwd());

type ImgFormatUnion = "png" | "jpg" | "webp" | "tiff" | "gif" | "svg" | "all";

type UrlHelperRT = {
  filename: string;
  ext: string;
  url: string;
  bytes: number;
  filenameNoExt: string;
  outpath: string;
};

type StrategyUnion = "bulk" | "individual";

// PNG format injection
type InjectImg<T extends boolean = true | false> = T extends true
  ? ExpandedImgSpecs<PngMetadata<true>>
  : ExpandedImgSpecs;

type GetTargetedImgRT<T extends boolean = true | false> = {
  outpath: string;
  filenameNoExt: string;
  ext: string;
  data: InjectImg<T>;
};

type GetTargetedImgsRT<T extends boolean = true | false> = {
  data: GetTargetedImgRT<T>[];
  size: number;
  tDelta: number;
};

class HandleImages {
  protected dir = "src/test/local-raw";
  constructor(
    public extractor: Extract,
    public fs: Fs
  ) {}

  protected urlSingletonHelper(href: string, strategy: StrategyUnion = "bulk") {
    const url = new URL(href);

    const pathname = url.pathname;

    const lastPath = pathname.slice(pathname.lastIndexOf("/") + 1);
    let filename: string;
    if (/\d+-\s*/.test(lastPath)) {
      filename = lastPath.slice(14);
    } else {
      filename = lastPath;
    }
    const ext = filename.slice(filename.lastIndexOf(".") + 1);
    const filenameNoExt = filename.slice(0, filename.lastIndexOf("."));
    const bytesToProbe =
      ext === "tiff" ? 4096 * 64 : ext === "tif" ? 4096 * 64 : 4096 * 32;

    return {
      filename,
      ext,
      filenameNoExt,
      url: url.href,
      bytes: bytesToProbe,
      outpath: `src/test/img-meta/${strategy}/${ext}/${filenameNoExt}.json`
    };
  }

  protected urlHelper(a: string, strategy: StrategyUnion): UrlHelperRT;
  protected urlHelper(a: string[], strategy: StrategyUnion): UrlHelperRT[];
  protected urlHelper<const A extends string[] | string = string[]>(
    a: A,
    strategy: StrategyUnion = "bulk"
  ) {
    if (Array.isArray(a)) {
      return a.map(q => this.urlSingletonHelper(q, strategy));
    } else {
      return this.urlSingletonHelper(a, strategy);
    }
  }

  public async getAllTargetedImgs(
    target: Include<ImgFormatUnion, "png">,
    output: StrategyUnion
  ): Promise<GetTargetedImgsRT<true>>;
  public async getAllTargetedImgs(
    target: Exclude<ImgFormatUnion, "png">,
    output: StrategyUnion
  ): Promise<GetTargetedImgsRT>;
  public async getAllTargetedImgs(
    target: ImgFormatUnion,
    output: StrategyUnion = "bulk"
  ) {
    let urls: string[];
    if (target === "jpg") {
      urls = (await import("@/test/img-data/all.ts")).jpgArr;
    } else if (target === "webp") {
      urls = (await import("@/test/img-data/all.ts")).webpArr;
    } else if (target === "gif") {
      urls = (await import("@/test/img-data/all.ts")).gifArr;
    } else if (target === "tiff") {
      urls = (await import("@/test/img-data/all.ts")).tiffArr;
    } else if (target === "svg") {
      urls = (await import("@/test/img-data/all.ts")).svgArr;
    } else if (target === "png") {
      urls = (await import("@/test/img-data/all.ts")).pngArr;
    } else {
      urls = (await import("@/test/img-data/all.ts")).all;
    }

    const mapper = this.urlHelper(urls, output);
    const arrWithWritePath = Array.of<GetTargetedImgRT>();
    const tStart = performance.now();
    let size = 0;
    for (const url of mapper) {
      const res = (await this.extractor.extractRemote(
        url.url,
        url.bytes
      )) as GetTargetedImgRT["data"];
      if (res.byteSize) size += res.byteSize;
      arrWithWritePath.push({
        data: res,
        ext: url.ext,
        filenameNoExt: url.filenameNoExt,
        outpath: url.outpath
      });
    }
    const tDelta = performance.now() - tStart;
    if (output === "individual") {
      for (const writeIt of arrWithWritePath) {
        this.fs.withWs(writeIt.outpath, JSON.stringify(writeIt.data, null, 2));
      }
    } else {
      const dataToWrite = arrWithWritePath.map(t => t.data);
      this.fs.withWs(
        `src/test/img-meta/bulk/${target}.json`,
        JSON.stringify(dataToWrite, null, 2)
      );
    }
    return { data: arrWithWritePath, tDelta, size: size / 1024 / 1024 };
  }
  public isValidStrategy(o?: string) {
    return o === "individual" || o === "bulk";
  }
  public isValidTarget(o?: string) {
    return (
      o === "png" ||
      o === "webp" ||
      o === "jpg" ||
      o === "gif" ||
      o === "tiff" ||
      o === "all" ||
      o === "svg"
    );
  }
}

const handleImgs = new HandleImages(extract, fs);
let bulkOrInd: StrategyUnion = "bulk";
let target: ImgFormatUnion = "png";

if (handleImgs.isValidTarget(process.argv[3])) {
  target = process.argv[3];
  if (handleImgs.isValidStrategy(process.argv[5])) bulkOrInd = process.argv[5];
  if (target === "png") {
    (async () => {
      return await handleImgs.getAllTargetedImgs(target, bulkOrInd);
    })().then(o => {
      console.log(
        `extracted ${o.size} MB of metadata from ${o.data.length} ${target} urls in ${o.tDelta / 1000} s`
      );
    });
  } else {
    (async () => {
      return await handleImgs.getAllTargetedImgs(target, bulkOrInd);
    })().then(o => {
      const descriptor = target === "all" ? "mixed" : target;
      console.log(
        `extracted ${o.size} MB of metadata from ${o.data.length} ${descriptor} urls in ${o.tDelta / 1000} s`
      );
    });
  }
}
