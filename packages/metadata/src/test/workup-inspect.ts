import { Fs } from "@d0paminedriven/fs";
import type { ExpandedDocSpecs, ExpandedImgSpecs } from "@/types/index.ts";
import { Extract } from "@/extract/index.ts";
import { cdnUrls } from "@/test/data.ts";

const extract = new Extract({ debug: false });
const fs = new Fs(process.cwd());

(async (mapper: string[]) => {
  const arr = Array.of<ExpandedDocSpecs | ExpandedImgSpecs>();

  for (const target of mapper) {
    arr.push(await extract.extractRemote(target, 48 * 4096));
  }
  return arr;
})([...cdnUrls]).then(v => {
  if (!v) {
    throw new Error("no value returned");
  } else {
    console.log(v);
    let i = 0;
    i < v.length;
    fs.withWs(
      "src/test/output/batch/aggregate.json",
      JSON.stringify(v, null, 2)
    );
    for (const vv of v) {
      i++;
      fs.withWs(
        `src/test/output/batch/${vv.type.toLowerCase()}/${vv.format}/${i}.json`,
        JSON.stringify(vv, null, 2)
      );
    }
  }
});
