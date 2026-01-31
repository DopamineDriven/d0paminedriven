import { Fs } from "@d0paminedriven/fs";
import { ObjectMapService as DocImgWorkupService } from "@/docs/pdf/obj-map.ts";

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

const argvNumber = Number.parseInt(process.argv[3] ?? "10", 10);
type PDFVersions =
  | "1.0"
  | "1.1"
  | "1.2"
  | "1.3"
  | "1.4"
  | "1.5"
  | "1.6"
  | "1.7"
  | "1.8"
  | "1.9"
  | "2.0";
const { name: name, path: path } = getDir[argvNumber] ?? {
  name: "Geminastics-Pt-VIII",
  path: `${dir}/Geminastics-Pt-VIII.pdf`
};
console.log(name);
const _name = "Warlord-of-Whimsy-Pt-XVI";
const readPdf = fs.fileToBuffer(path);

console.log("Buffer length:", readPdf.length);

const docImgWorkup = new DocImgWorkupService();

const rawText = readPdf.toString("latin1");

const isLinearized = /\/Linearized\s+\d/.test(rawText);

console.log("Is linearized:", isLinearized);

const parseVersion = /(?:%PDF+-(\d+[\.]+\d)*)/g;

const isPdfVersion = (s: string) => {
  return (
    s === "1.0" ||
    s === "1.1" ||
    s === "1.2" ||
    s === "1.3" ||
    s === "1.4" ||
    s === "1.5" ||
    s === "1.6" ||
    s === "1.7" ||
    s === "1.8" ||
    s == "1.9" ||
    s === "2.0"
  );
};
let x: PDFVersions = "1.5";

// Combined
const fullText = docImgWorkup.fullText(readPdf);
let idealText = "";

if (isLinearized) {
  idealText = docImgWorkup.decompressFlateStreams(readPdf).join(`\n`);
} else {
  idealText = docImgWorkup.parseObjectStreams(readPdf, rawText).join(`\n`);
  const _o = idealText;
}

const ff = fullText;

for (const f of ff.matchAll(parseVersion)) {
  if (f?.[0] && f?.[1] && isPdfVersion(f?.[1])) {
    x = f?.[1];
    console.log(x);
  }
}

/**
 * const xmpRegex = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;
const creationInfo =
  /<<(?:(?=\/CreationDate)|(?=\/Count))[\s\S]*?([\s\S]*?)>>/g;

const _streamCaptureRegex = /\s*stream\r*?\n*?([\s\S]*?)\r?\n*?endstream/g;
// (?:(([0-9]+\s*\d+\s*[a-z]+\s*)+)\s*([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)(?:endstream|endobj))
// ((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)
const _mydualcapture =
  /((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)\s*endstream|endobj)/g;
const psObjRegex = /(\d+\s+\d+\s+obj)\s*([\s\S]*?)(?:stream|endobj)/g;

const hmmm =
  /(\d+\s+\d+\s+obj\s+?|\d+\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n)/g;

const comprehensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>endobj)/g;

const extensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>\s*endobj)/g;
 */
const xmpRegex = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;

const _createdDateRegex =
  /(?:\s*<[a-zA-Z0-9]+:DateCreated>\s*([\s\S]*?)\s*<\/\s*[a-zA-Z0-9]+:DateCreated>)/g;
const _creationInfo =
  /<<(?:(?=\/CreationDate)|(?=\/Count))[\s\S]*?([\s\S]*?)>>/g;
const _pdfObject = /(\d+)[ \t\r\n\f\0]+(\d+)[ \t\r\n\f\0]+obj/g;
const _streamCaptureRe = /\s*stream\r*?\n*?([\s\S]*?)\r?\n*?endstream/g;
// (?:(([0-9]+\s*\d+\s*[a-z]+\s*)+)\s*([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)(?:endstream|endobj))
// ((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)

// (?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))\s*?<<\/?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)

// (?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)
const _mydualcapture =
  /((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)/g;
const _psObjRegex = /(\d+\s+\d+\s+obj)\s*([\s\S]*?)(?:stream|endobj)/g;
const _markersRegex =
  /%[PF]DF-\d\.\d|(?<=[ \t\r\n\f\0])\d+[ \t\r\n\f\0]+\d+[ \t\r\n\f\0]+obj|(?<=[ \t\r\n\f\0>])stream|(?<=[ \t\r\n\f\0])xref|(?<=[ \t\r\n\f\0])trailer|(?<=[ \t\r\n\f\0])startxref|(?<=[ \t\r\n\f\0])%%EOF/g;

const _gold =
  /(\d+\s+\d+\s+obj\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;
const annots =
  /(\d+\s+\d+\s+?)+?<<(?:(?=\/Action)|(?=\/A))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;

const _nestedXObjects = /\/XObject\s*<<([\s\S]*?)>>/g;
const _comprehensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>endobj)/g;

const _extensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>\s*endobj)/g;
const _newExtended =
  /(?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|>>stream|>>\s*endobj)/g;
const _newTwoExtended =
  /(?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))?\s*(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\s*>>stream|>>\s*endobj|\s*?>>\s*?\r\n?)/g;

const rmTrailingNoise = (p: string) => {
  return p.replace(/stream/g, "").replace(/endobj/g, "");
};

const pdfPsObjs = {
  pageObjArr: Array.of<{ obj: string; id: string }>(),
  xObjArr: Array.of<{ obj: string; id: string }>(),
  aObjArr: Array.of<{ obj: string; id: string }>()
};

const _getPages =
  /(?:(\d+\s+\d+\s*?\w*\s+?|[\d\w]*?)+?<<((?=\/\w+)*?[\s\S\[\s\S\]]*?))\s?(?:([\s]*stream|[\s]*endobj))/g;
const _myOtherPromisingRegex =
  /(?:(\d+\s+\d+\s*?\w*\s+?|[\d\w]*?)+?<<([\s\S\[\s\S\]]*?))\s?(?:([\s]*stream|[\s]*endobj))/g;
const _myNonLinearRegex =
  /((\d+\s+\d+\s*?obj\s+?|\d+\s+0\s*[\s\S]*)<<([\s\S]*?))\s*?(stream\s*([\s\S]*?)\s*endstream|endobj)/g;
const extensiveArr = Array.of<string>();

if (isLinearized === true || Number.parseFloat(x) >= 1.5) {
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
  // /(?:(\d+\s+\d+\s*?\w*\s+?|\d+\s+0\s*([\s\S]*?))?<<([\s\S]*?))\s?(?:(>>\s*?stream|>>\s*?endobj))/g
  for (const txt of fullText.matchAll(
    // /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
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
//   /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)/g

for (const d of docImgWorkup
  .fullText(readPdf)
  .matchAll(
    /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n?\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
  )) {
  const d0 = d?.[0],
    d1 = d?.[1],
    d2 = d?.[2];
  if (d0 && d1 && d2) {
    const s = rmTrailingNoise(d2.trim());
    if (d1.length > 0) {
      const tagged = `${d1}<<${s}\n`;
      examineArr.push(tagged);
    }
  } else if (d0 && !d1 && d2) {
    const s = rmTrailingNoise(d2.trim());
    const tagged = `<<${s}`;
    examineArr.push(tagged);
  }
}
fs.withWs(`src/test/pdf-inspect/out/${name}/ps.txt`, extensiveArr.join(`\n`));
fs.withWs(
  `src/test/pdf-data/out/${name}/metadata.txt`,
  arrmeta.creationMeta.join(`\n`)
);

fs.withWs(
  `src/test/pdf-data/out/${name}/extensive.txt`,
  examineArr.join(`\n\n`)
);

const templatize = JSON.stringify(docImgWorkup.pdfMapInit(readPdf), null, 2);
const literalT = `export const pdfPsObjs${process.argv[3]}=${templatize};`;

fs.withWs(`src/test/pdf-data/out/${name}/index.ts`, literalT);
// fs.withWs(
//   `src/test/out/pdfs/${name}/img-data.json`,
//   JSON.stringify(qArr.length > 0 ? qArr : [], null, 2)
// );
fs.withWs(`src/test/pdf-data/out/${name}/debug.txt`, fullText);
// if (info?.[0] && info?.[1]) {
//   if (info?.[1].startsWith("/Count")) {
//     arrmeta.pages.push(`${info?.[0]}\n`);
//   } if (info?.[1]?.includes("CreationDate")) {
//     arrmeta.creationMeta.push(`${info?.[0]}\n`);
//   }
// }
// const comprehensiveArr = Array.of<string>();
// for (const txt of fullText.matchAll(comprehensive)) {
//   if (txt?.[0] && txt?.[1] && txt?.[2]) {
//     const record = `${txt?.[0]}\n`;
//     comprehensiveArr.push(record);
//   }
// }
// for (const txt of fullText.matchAll(hmmm)) {
//   if (txt?.[1] && txt?.[2]) {
//     const record = `${txt?.[1]}\n${txt?.[2]}\n\n`;
//     arr.push(record);
//   }
// }
/**
 * console.log("Mapped entries:", o.length);
console.log(o);
const pageWithXObjectPattern =
  /(\d+)\s+0\s+obj([\s\S]*?\/Type\s*\/Page\b[\s\S]*?\/XObject\s*<<[\s\S]*?>>[\s\S]*?)endobj/g;

console.log("\n=== Pages with XObject ===\n");

for (const match of rawText.matchAll(pageWithXObjectPattern)) {
  const pageObjId = match[1];
  const content = match[2]?.split("stream")?.[0]?.trim();

  console.log(`--- ${pageObjId} 0 obj ---`);
  console.log(content);
  console.log("");
}
// Debug: count what we find in raw text
const rawPageCount = rawText.match(/\/Type\s*\/Page\b/g) ?? [];
const rawStructParents = rawText.match(/\/StructParents\s+\d+/g) ?? [];
const contents = rawText.match(/\/Contents\s+([0-9]+)+\s+0\s+R/g) ?? [];
const rawXObjectDicts = rawText.match(/\/XObject\s*<<([\s\S]*?)>>/g) ?? [];
const matcherrrrr = rawText.matchAll(
  /\/Im(\d+)\s+(\d+)\s+0\s+R|\/X(\d+)\s+(\d+)\s+0\s+R/g
);
const rawResources =
  rawText.match(/\/Contents\s*([\s\S]*?)\/Type*\s*\/Page>>/gm) ?? [];
rawStructParents?.[0] && rawStructParents[0]?.length >= 26
  ? console.log(contents)
  : null;
const parseFull = new RegExp(`([0-9])+\\s+0\\s+obj([\\s\\S]*?)endobj`, "g");
console.log(
  "Raw text - Pages:",
  rawPageCount,
  "StructParents:",
  rawStructParents,
  "XObject dicts:",
  rawXObjectDicts,
  "rawResources:",
  rawResources,
  "contents",
  contents
);
for (const s of matcherrrrr) {
  if (s?.[0] && s?.[1] && s?.[2]) {
    const match = rawText.match(parseFull);
    const matcher = match?.[1];
    const splitStream = matcher?.split("stream")?.[0];

    console.log("fullPage: ", splitStream);
    console.log("contents: ", contents);
    console.log(`Im Plucking ` + JSON.stringify(s, null, 2));
  }
}

 */
/**
 *  else {
  for (const txt of fullText
    .replace(streamCaptureRe, "")
    .matchAll(
      /(?:(\d+\s+\d+\s*?\w*\s+?|[\d\w]*?)?<<([\s\S]*?))\s?(?:(>>\s*?stream|>>\s*?endobj))/g
    )) {
    if (txt?.[1] && txt?.[2]) {
      console.log({ 1: txt?.[1], 2: txt?.[2] });
      extensiveArr.push(`${txt?.[1]}\n<<${txt?.[2]}>>\n\n`);
    }
  }
}
 */
// const o = docImgWorkup.xObjectMapperNew(fullText);
// const qArr = Array.of<{
//   BitsPerComponent: number;
//   ColorTransform: number;
//   Height: number;
//   Length: number;
//   Width: number;
//   ColorSpace: string;
//   Filter: string | null;
//   imgRecord: string;
//   imgMatch: {
//     imageObjId: string;
//     pageContentObjId: string;
//     pageNumber: number;
//     structParent: number;
//     xObjId: string;
//   };
// }>();
// console.log(
//   extensiveArr
//     .map(v => rmTrailingNoise(v.trim()))
//     .filter(t => /(\/StructParents|\/Page(?!s)|\/Annots)/g.test(t))
//     .join("\n")
// );
// if (isLinearized === true || Number.parseFloat(x) >= 1.4) {
//   for (const oo of o) {
//     if (o.length > 0) {
//       const mapper = extensiveArr.findIndex(t => t.startsWith(oo.imageObjId));
//       const imgRecord = extensiveArr[mapper];
//       if (imgRecord) {
//         const clean = imgRecord
//           .replace(`${oo.imageObjId}\r<<`, "")
//           .replace(">>\n", "");
//         const toArr = clean.split(/\//g).filter(o => o.length > 1);
//         const csi = toArr.findIndex(o => o === "ColorSpace");
//         const filt = toArr.findIndex(o => o === "Filter");
//         const v = filt === -1 ? null : toArr.slice(filt + 1, filt + 2).join("");
//         const cs = toArr.slice(csi + 1, csi + 2).join("");
//         const arrVals = Array.of<readonly [string, number]>();
//         const filtered = toArr.filter(ss => /\s+/g.test(ss.trim()));
//         for (const x of filtered) {
//           const v = x.indexOf(` `);
//           const tupled = [
//             x.slice(0, v),
//             Number.parseInt(x.slice(v + 1))
//           ] as const;
//           arrVals.push(tupled);
//         }
//         const dataMap = Object.fromEntries(Array.from(arrVals));
//         const out = {
//           ColorSpace: cs,
//           Filter: v,
//           imgRecord: clean,
//           imgMatch: oo,
//           ...(dataMap as {
//             BitsPerComponent: number;
//             ColorTransform: number;
//             Height: number;
//             Length: number;
//             Width: number;
//           })
//         };
//         qArr.push(out);
//       }
//     }
//   }
// }
