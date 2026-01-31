import { ObjectMapService } from "@/docs/pdf/obj-map.ts";

const o = new ObjectMapService();



import { Fs } from "@d0paminedriven/fs";

const fs = new Fs(process.cwd());
const dir = "src/test/out/remote/pdfs";
const getDir = fs.readDir(dir).map(p => {
  const [withoutExt, ext] = [
    p.slice(0, p.lastIndexOf(".")),
    p.slice(p.lastIndexOf(".") + 1)
  ];
  return {
    path: `${dir}/${withoutExt}.${ext}`,
    name: withoutExt
  };
});
const argvNumber = Number.parseInt(process.argv[3] ?? "10", 10);

const { name: name, path: path } = getDir[argvNumber] ?? {
  name: "Geminastics-Pt-VIII",
  path: `${dir}/Geminastics-Pt-VIII.pdf`
};
console.log(name);
const _name = "Warlord-of-Whimsy-Pt-XVI";
const readPdf = fs.fileToBuffer(path);

const out= o.pdfMapInit(readPdf);


fs.withWs(`src/test/pdf-data/__out__/${name}.json`, JSON.stringify(out, null, 2))
