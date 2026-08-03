import { Fs } from "@d0paminedriven/fs";
import type { ExpandedImgSpecs, PngMetadata } from "@/types/index.ts";
import { Extract } from "@/extract/index.ts";

type ImgDataBuffToSize = {
  page: number;
  imageIndex: number;
  width: number;
  height: number;
  size: number;
  colorSpace: string;
  bitsPerComponent: number;
  filter: string;
  xobjectName: string;
  objectId: string;
};

export class ExtractImagesPerPageService {
  protected dir = `src/test/__benchmark__`;
  constructor(
    public e: Extract,
    public fs: Fs
  ) {}

  public async all(buffer: Buffer) {
    const { PdfDown } = await import("@d0paminedriven/pdfdown");
    const pdfdown = new PdfDown(buffer);
    return await Promise.all([
      pdfdown.metadataAsync(),
      pdfdown.annotationsPerPageAsync(),
      pdfdown.imagesPerPageAsync(),
      pdfdown.textPerPageAsync()
    ]);
  }

  public async handleImgExt(imgData: Buffer) {
    return (await this.e.extractRemote(imgData, 1024 * 48)) as ExpandedImgSpecs<
      PngMetadata<true>
    >;
  }
  private dirPdfs() {
    return this.fs
      .readDir(this.dir)
      .filter(o => o.lastIndexOf(".") !== -1)
      .map((p, i) => {
        const [withoutExt, ext] = [
          p.slice(0, p.lastIndexOf(".")),
          p.slice(p.lastIndexOf(".") + 1)
        ];
        return {
          index: i,
          path: `${this.dir}/${withoutExt}.${ext}`,
          name: withoutExt
        };
      });
  }

  public get listFiles() {
    return this.dirPdfs();
  }

  public async exe(argv3: string) {
    const index = Number.parseInt(argv3, 10);
    const pdf = this.dirPdfs()[index];

    if (!pdf) throw new Error("no pdf found");
    console.log(`${pdf.name}`);
    const buf = this.fs.fileToBuffer(pdf?.path);
    const [meta, annots, imgs, text] = await this.all(buf);
    const imgSizeArr = Array.of<ImgDataBuffToSize>();
    if (imgs.length > 0) {
      for (const img of imgs) {
        const ext = await this.handleImgExt(img.data);
        const { data, ...rest } = img;
        imgSizeArr.push({ size: data.byteLength / 1024 / 1024, ...rest });
        this.fs.withWs(
          `src/test/img-out/${pdf.name}/imgs/${rest.page}/${rest.imageIndex}.${ext.format}`,
          data
        );
      }
    }
    const templatize = JSON.stringify(
      {
        meta,
        annots,
        imgs: imgSizeArr,
        text
      },
      null,
      2
    );
    const literalT = `export const pdf${pdf.index}=${templatize};`;

    fs.withWs(`src/test/img-out/${pdf.name}/index.ts`, literalT);
  }
}

const e = new Extract();
const fs = new Fs(process.cwd());
const pdfdown = new ExtractImagesPerPageService(e, fs);

if (process.argv[3]) {
  await pdfdown.exe(process.argv[3]);
}
