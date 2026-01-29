import { PdfPagesWorkup } from "../pages/index.ts";
import { ObjOfArrsEntity } from "../types/index.ts";

export class PdfMapperWorkup extends PdfPagesWorkup {
  private countRegex = /(?:\/Count\s*(\d+))/g;
  private psObjRegex = /(\d+\s+\d+\s+obj)\s*([\s\S]*?)(?:stream|endobj)/g;
  private linearizedParseRe =
    /(\d+\s+\d+\s+obj\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;

  private annots =
    /(\d+\s+\d+\s+?)+?<<(?:(?=\/Action)|(?=\/A))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;
  public mapIt(buff: Buffer | Uint8Array) {
    const fullText = this.fullText(buff);
    const _objStrTxt = this.objStreamOnlyText(buff);
    const pdfPsObjs = {
      pageObjArr: Array.of<{ obj: string; id: string }>(),
      xObjArr: Array.of<{ obj: string; id: string }>(),
      aObjArr: Array.of<{ obj: string; id: string }>(),
      countFallback: 0,
      pageIdsMap: new Map<number, string>(),
      annotIdsMap: new Map<number, string[]>(),
      annotsMap: new Map<number, string>()
    } satisfies ObjOfArrsEntity;
    const annotIdSet = new Set<string>();
    let annotObjNo = 0;
    let pgNo = 0;
    let annotNo = 0;
    for (const s of fullText.matchAll(this.countRegex)) {
      const c0 = s?.[0],
        c1 = s?.[1];
      if (c0 && c1 && c1.length > 0) {
        const raw = Number.parseInt(c1);
        if (raw > pdfPsObjs.countFallback) {
          pdfPsObjs.countFallback = raw;
        }
      }
    }

    // DO NOT DELETE
    // /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj|\s*<<)\r?/g
    for (const txt of fullText.matchAll(this.linearizedParseRe)) {
      const t0 = txt?.[0],
        t1 = txt?.[1],
        t2 = txt?.[2];
      if (t0 && t1 && t2) {
        if (/(\/Page(?!s)|\/Annots)/g.test(t2)) {
          const obj = this.rmTrailingNoise(t2.trim());
          pdfPsObjs.pageObjArr.push({
            id: t1.trim(),
            obj
          });
        }
        if (/(\/BitsPerComponent)/g.test(t2)) {
          const obj = this.rmTrailingNoise(t2.trim());
          pdfPsObjs.xObjArr.push({ id: t1.trim(), obj });
        }
      } else if (t0 && !t1 && t2) {
        if (/(Page(?!s)|Annots)/g.test(t2)) {
          const obj = this.rmTrailingNoise(t2.trim());
          pdfPsObjs.pageObjArr.push({
            id: "",
            obj
          });
        }
        if (/(\/BitsPerComponent)/g.test(t2)) {
          const obj = this.rmTrailingNoise(t2.trim());
          pdfPsObjs.xObjArr.push({ id: "", obj });
        }
      }
    }
    const examineArr = Array.of<string>();
    // DO NOT DELETE
    //  /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
    // DO NOT DELETE
    //  /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
    for (const d of fullText.matchAll(this.psObjRegex)) {
      const d0 = d?.[0],
        d1 = d?.[1],
        d2 = d?.[2];
      if (d0 && d1 && d2) {
        const s = this.rmTrailingNoise(d2.trim());
        if (d1.length > 0) {
          const tagged = `${d1}<<${s}`;
          examineArr.push(tagged);
        }
      } else if (d0 && !d1 && d2) {
        const s = this.rmTrailingNoise(d2.trim());
        const tagged = `<<${s}`;

        examineArr.push(tagged);
      }
    }

    const examineToParse = examineArr.join(`\n`);
    for (const k of examineToParse.matchAll(/(?:\/Kids\s*\[([\s\S]*?)\])/g)) {
      const k0 = k?.[0],
        k1 = k?.[1];
      if (k0 && k1) {
        const pageIds = k1.trim();
        for (const p of pageIds.matchAll(/(\d+\s[0])\s[R]/g)) {
          const p0 = p?.[0],
            p1 = p?.[1];
          if (p0 && p1) {
            const pageId = `${p1.trim()} obj`;
            pdfPsObjs.pageIdsMap.set(pgNo, pageId);
            pgNo += 1;
          }
        }
      }
    }

    for (const k of examineToParse.matchAll(/(?:\/Annots\s*\[([\s\S]*?)\])/g)) {
      const k0 = k?.[0],
        k1 = k?.[1];
      if (k0 && k1) {
        const annotIds = k1.trim();
        const annotIdArr = Array.of<string>();
        for (const p of annotIds.matchAll(/(\d+\s[0])\s[R]/g)) {
          const p0 = p?.[0],
            p1 = p?.[1];
          if (p0 && p1) {
            annotIdSet.add(`${p1.trim()}`);
            // start at page 1 for the key or index 0??
            const annotId = `${p1.trim()}`;

            annotIdArr.push(annotId);
          }
        }

        pdfPsObjs.annotIdsMap.set(annotNo, annotIdArr);
        annotNo += 1;
      }
    }

    for (const txt of fullText.matchAll(this.annots)) {
      const t0 = txt?.[0],
        t1 = txt?.[1],
        t2 = txt?.[2];

      if (t0 && t1 && t2) {
        if (/\/A(?![a-zB-Z])/g.test(t2)) {
          const obj = this.rmTrailingNoise(t2.trim());

          pdfPsObjs.aObjArr.push({
            id: t1.trim(),
            obj: obj.slice(0, obj.lastIndexOf(">>"))
          });
        }
      }
    }

    const xmp = this.getXmpMeta(fullText);

    if (pdfPsObjs.pageObjArr.length === 0) {
      console.log("HITTING THE FALLBACK FOR PAGE OBJECTS");
      let i = 0;
      const pageFilter = examineArr.filter(o =>
        /(\/Page(?!s)|\/Annots)/g.test(o)
      );
      for (const page of pageFilter) {
        const getId = pdfPsObjs.pageIdsMap.get(i);
        if (getId) {
          pdfPsObjs.pageObjArr.push({
            id: getId,
            obj: this.rmTrailingNoise(page).trim()
          });
          i += 1;
        }
      }
      console.log(
        `PAGE OBJECTS LENGTH POST_FALLBACK ${pdfPsObjs.pageObjArr.length}`
      );
    }

    if (pdfPsObjs.aObjArr.length === 0) {
      // const s = Array.from(pdfPsObjs.annotIdsMap);
      console.log("HITTING THE FALLBACK FOR ANNOT OBJECTS");
      const filterAnnotObj = examineArr.filter(o => /(\/Annot(?!s))/g.test(o));
      for (const obj of filterAnnotObj) {
        pdfPsObjs.annotsMap.set(annotObjNo, this.rmTrailingNoise(obj).trim());
        annotObjNo += 1;
      }
      console.log(
        `ANNOT OBJECTS LENGTH POST_FALLBACK ${pdfPsObjs.annotsMap.size}`
      );
    }
    let idCo = 0;
    for (const [_key, val] of Array.from(pdfPsObjs.annotIdsMap)) {
      for (const t1 of val) {
        const match = pdfPsObjs.annotsMap.get(idCo);
        if (match) {
          const obj = match;
          pdfPsObjs.aObjArr.push({
            id: t1.trim(),
            obj: obj.slice(0, obj.lastIndexOf(">>"))
          });
          idCo += 1;
        }
      }
    }

    if (xmp) {
      pdfPsObjs.pageIdsMap;
      const s = { ...pdfPsObjs, xmp, examine: examineArr };
      return s;
    } else return { ...pdfPsObjs, examine: examineArr };
  }
}

/**
 * DO NOT DELETE
 *   private imgLengthRe = /(?:\/Length\s*(\d+))/g;
  private linearizedRe = /\/Linearized\s+\d/g;
  private versionRe = /(?:%PDF+-(\d+[\.]+\d)*)/g;
  private xmpRe = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;
  private xmpCreateDateRe =
    /(?:<\s*\S*:CreateDate>\s*([\s\S]*?)\s*<\/\s*\S*:CreateDate>)/g;
  private rectsPrecisionRe =
    /\/Rect\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/g;
  private annotTagRe = /\/A(?![a-zB-Z])/g;
  private probeFullTextRe = /(\/StructParents|\/Page(?!s)|\/Annots)/g;
  private pageOrAnnotsRe = /(\/Page(?!s)|\/Annots)/g;
  private imgObjIdentifierRe = /(\/BitsPerComponent)/g;
  private pdfObject = /(\d+)[ \t\r\n\f\0]+(\d+)[ \t\r\n\f\0]+obj/g;
  private streamCaptureRe = /\s*stream\r*?\n*?([\s\S]*?)\r?\n*?endstream/g;
  private mydualcapture =
    /((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)/g;

  private linearizedParseAltRe =
    /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj|\s*<<)\r?/g;
  private nonlinearizedParseRe =
    /(?:(\d+\s+\d+\s*?\w*\s+?|[\d\w]*?)?<<([\s\S]*?))\s?(?:(>>\s*?stream|>>\s*?endobj))/g;
  private nonlinearParse =
    /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g;
      private markersRegex =
    /%[PF]DF-\d\.\d|(?<=[ \t\r\n\f\0])\d+[ \t\r\n\f\0]+\d+[ \t\r\n\f\0]+obj|(?<=[ \t\r\n\f\0>])stream|(?<=[ \t\r\n\f\0])xref|(?<=[ \t\r\n\f\0])trailer|(?<=[ \t\r\n\f\0])startxref|(?<=[ \t\r\n\f\0])%%EOF/g;
 */
