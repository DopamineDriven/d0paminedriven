import { Fs } from "@d0paminedriven/fs";
import type {
  ExpandedDocSpecs,
  PdfImageAnalysisMeta
} from "@/types/index.ts";
import { Extract } from "@/extract/index.ts";
import { testData as cdnUrls } from "./pdf-test-data.ts";

const extract = new Extract({ debug: false });
const fs = new Fs(process.cwd());

(async (mapper: string[]) => {
  const arr = Array.of<ExpandedDocSpecs<PdfImageAnalysisMeta>>();

  for (const target of mapper) {
    // For TIFF files, we need to read the entire file
    // coffee.tif is 184,509 bytes, so let's read it all
    arr.push(
      (await extract.extractRemote(
        target,
        96 * 4096
      )) as ExpandedDocSpecs<PdfImageAnalysisMeta>
    );
  }
  return arr;
})(cdnUrls).then(v => {
  if (!v) {
    throw new Error("no value returned");
  } else {
    console.log(v);
    fs.withWs(`src/test/__out__/pdfs/inspect.json`, JSON.stringify(v, null, 2));
    let i = 0;
    i < v.length;
    for (const vv of v) {
      i++;
      fs.withWs(
        `src/test/output/batch/${vv.type.toLowerCase()}/${vv.format}/${i}.json`,
        JSON.stringify(vv, null, 2)
      );
    }
  }
});
