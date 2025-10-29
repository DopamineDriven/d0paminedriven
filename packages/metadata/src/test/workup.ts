import { Fs } from "@d0paminedriven/fs";
import { cdnUrls } from "@/test/data.ts";

const fs = new Fs(process.cwd());
const x = fs.readDir("src/test/local", { recursive: true });

const ttt = () => {
  return cdnUrls.map(v => {
    const tttt = x.find(o => v.endsWith(o));
    if (typeof tttt === "undefined") return;
    else return [v, `src/test/local/${tttt}`];
  });
};

const toOutput = JSON.stringify(
  ttt().filter(v => typeof v !== "undefined"),
  null,
  2
);

fs.withWs("src/test/tuples.ts", `export const tuplesToTest = ${toOutput}`);
