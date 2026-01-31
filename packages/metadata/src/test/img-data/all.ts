import { Fs } from "@d0paminedriven/fs";
import { gifArr } from "@/test/img-data/gif.ts";
import { jfifArr } from "@/test/img-data/jfif.ts";
import { jpegArr } from "@/test/img-data/jpeg.ts";
import { jpgArr as jpgExtArr } from "@/test/img-data/jpg.ts";
import { pngArr } from "@/test/img-data/png.ts";
import { svgArr } from "@/test/img-data/svg.ts";
import { tifArr } from "@/test/img-data/tif.ts";
import { tiffArr as tiffExtArr } from "@/test/img-data/tiff.ts";
import { webpArr } from "@/test/img-data/webp.ts";

const jpgArr = jpegArr.concat(jpgExtArr).concat(jfifArr);
const tiffArr = tifArr.concat(tiffExtArr);
const all = jpgArr
  .concat(svgArr)
  .concat(tiffArr)
  .concat(webpArr)
  .concat(pngArr)
  .concat(gifArr);

export { all, jpgArr, tiffArr, webpArr, pngArr, svgArr, gifArr };

if (process.argv[3] === "gen") {
  const fs = new Fs(process.cwd());

  (async () => {
    return await fs
      .arrToArrOfArrs({
        arrToFragment: all,
        arrOfArrsAggregator: Array.of<string[]>(),
        interval: 20
      })
      .then(t => {
        return t.map((tt, i) => {
          return tt.map((ttt, ii) => {
            const pathname = ttt.slice(ttt.lastIndexOf("/") + 1);
            const dbFile = pathname.startsWith("att")
              ? pathname
              : pathname.slice(14);
            fs.withWs(
              `src/test/img-data/segmented/${i}/${ii}.json`,
              JSON.stringify(
                [
                  ttt,
                  `src/test/__benchmark__/${dbFile.slice(dbFile.lastIndexOf(".") + 1)}/${dbFile}`
                ],
                null,
                2
              )
            );
          });
        });
      });
  })();
}
