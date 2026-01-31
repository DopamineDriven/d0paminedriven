import { Fs } from "@d0paminedriven/fs";
import { ObjectMapServiceAlt as DocImgWorkupService } from "@/docs/pdf/alt.ts";

const fs = new Fs(process.cwd());
const dir = "src/test/__benchmark__";
const getDir = fs
  .readDir(dir, { recursive: false })
  .filter(t => t.lastIndexOf(".") !== -1)
  .map(p => {
    const [withoutExt, ext] = [
      p.slice(0, p.lastIndexOf(".")),
      p.slice(p.lastIndexOf(".") + 1)
    ];
    return {
      path: `${dir}/${withoutExt}.${ext}`,
      name: withoutExt
    };
  });

// 68 files in the targeted dir, can target --target 0 through 67

const argvNumber = Number.parseInt(process.argv[3] ?? "10", 10);

const { name: name, path: path } = getDir[argvNumber] ?? {
  name: "Geminastics-Pt-VIII",
  path: `${dir}/Geminastics-Pt-VIII.pdf`
};
console.log(name);
const _name = "Warlord-of-Whimsy-Pt-XVI";
const readPdf = fs.fileToBuffer(path);
const docImgWorkup = new DocImgWorkupService();

console.log("Buffer length:", readPdf.length);
const fullText = docImgWorkup.fullText(readPdf);

const version = docImgWorkup.pdfVersion(fullText, false);

const linearized = docImgWorkup.isLinearized(readPdf);

console.log("Is linearized: ", linearized);
console.log("Version: " + version);

const xmpRegex = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;

const annots =
  /(\d+\s+\d+\s+?)+?<<(?:(?=\/Action)|(?=\/A))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;

const rmTrailingNoise = (p: string) => {
  return p.replace(/stream/g, "").replace(/endobj/g, "");
};

const pdfPsObjs = {
  pageObjArr: Array.of<{ obj: string; id: string }>(),
  xObjArr: Array.of<{ obj: string; id: string }>(),
  aObjArr: Array.of<{ obj: string; id: string }>()
};

const extensiveArr = Array.of<string>();

if (linearized === true || docImgWorkup.pdfVersion(fullText, true) >= 1.5) {
  for (const txt of fullText.matchAll(
    /(\d+\s+\d+\s+obj\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\s*stream|\s*endobj)/g
  )) {
    const t0 = txt?.[0],
      t1 = txt?.[1],
      t2 = txt?.[2];
    if (t0 && t1 && t2) {
      const record = `${t1}<<${t2}\n\n`;

      if (/(\/Page(?!s)|\/Annots)/g.test(t2)) {
        const obj = rmTrailingNoise(t2.trim());
        pdfPsObjs.pageObjArr.push({
          id: t1.trim(),
          obj
        });
      }
      extensiveArr.push(rmTrailingNoise(record));
      if (/(\/BitsPerComponent)/g.test(t2)) {
        const obj = rmTrailingNoise(t2.trim());
        pdfPsObjs.xObjArr.push({ id: t1.trim(), obj });
      }
    }
  }
} else {
  for (const txt of fullText.matchAll(
    /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
  )) {
    if (txt?.[0] && txt?.[1] && txt?.[2]) {
      extensiveArr.push(`${txt?.[1]}\n<<${txt?.[2]}>>\n\n`);
    }
  }
}

for (const txt of fullText.matchAll(annots)) {
  const t0 = txt?.[0],
    t1 = txt?.[1],
    t2 = txt?.[2];

  if (t0 && t1 && t2) {
    if (/\/A(?![a-zB-Z])/g.test(t2)) {
      const obj = rmTrailingNoise(t2.trim());

      pdfPsObjs.aObjArr.push({
        id: t1.trim(),
        obj: obj.slice(0, obj.lastIndexOf(">>"))
      });
    }
  }
}

const arrmeta = { pages: Array.of<string>(), creationMeta: Array.of<string>() };
for (const info of extensiveArr) {
  if (info.includes("CreationDate")) {
    arrmeta.creationMeta.push(info);
  }
  if (info.includes("Count")) {
    arrmeta.pages.push(info);
  }
}
const xmpCreateDateRegex =
  /(?:<\s*\S*:CreateDate>\s*([\s\S]*?)\s*<\/\s*\S*:CreateDate>)/g;
for (const info of fullText.matchAll(xmpRegex)) {
  const z = info?.[0];
  const o = info?.[1];
  if (z && o) {
    for (const i of z.matchAll(xmpCreateDateRegex)) {
      if (i?.[0] && i?.[1]) {
        console.log(`raw create date: ${i?.[1]}`);
      }
    }
    arrmeta.creationMeta.push(`${z}\n`);
  }
}

const examineArr = Array.of<string>();
    for (const d of fullText.matchAll( /(\d+\s+\d+\s+obj\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\s*stream|\s*endobj)/g )) {
      const d0 = d?.[0],
        d1 = d?.[1],
        d2 = d?.[2];
      if (d0 && d1 && d2) {
        const s = docImgWorkup.rmTrailingNoise(d2.trim());
        if (d1.length > 0) {
          const tagged = `${d1}<<${s}`;
          examineArr.push(tagged);
        }
      } else if (d0 && !d1 && d2) {
        const s =docImgWorkup.rmTrailingNoise(d2.trim());
        const tagged = `<<${s}`;

        examineArr.push(tagged);
      }
    }
fs.withWs(`src/test/pdf-inspect/${name}/ps.txt`, extensiveArr.join(`\n`));
fs.withWs(`src/test/pdf-inspect/${name}/ps-examine.txt`, examineArr.join(`\n`));
const templatize = JSON.stringify(docImgWorkup.pdfMapInit(readPdf), null, 2);
const literalT = `export const pdfPsObjs${process.argv[3]}=${templatize};`;

// output of src/docs/pdf/alt.ts
fs.withWs(`src/test/pdf-inspect/${name}/index.ts`, literalT);
