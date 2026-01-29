import { DocImgWorkupService } from "./doc-img-workup.ts";

export interface ObjOfArrsBaseArr {
  id: string;
  obj: string;
}

export interface ObjOfArrsEntity {
  pageObjArr: ObjOfArrsBaseArr[];
  xObjArr: ObjOfArrsBaseArr[];
  aObjArr: ObjOfArrsBaseArr[];
  xmp?: {
    createDate: string;
    modifyDate: string;
    producer: string;
    creatorTool: string;
  };
  examine?: string[];
  countFallback: number;
  pageIdsMap: Map<number, string>;
  annotIdsMap: Map<number, string[]>;
  annotsMap: Map<number, string>;
}

export interface BoundingBox {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

type PDFRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type PDFVersions = `1.${PDFRange}` | "2.0";

export type PdfEncodingUnion =
  | "unknown"
  | "jpeg-dct"
  | "jpeg2000"
  | "ccitt-fax"
  | "jbig2"
  | "deflate"
  | "lzw"
  | "hex"
  | "ascii85"
  | "rle";

export interface ImgCacheBase {
  id: string;
  length: number;
  width: number;
  height: number;
  aspectRatio: number;
  colorSpace: string;
  filter: string;
  encoding: PdfEncodingUnion;
}

export interface ImgsCache extends ImgCacheBase {
  submaskObjId?: string;
  submaskImg?: ImgCacheBase;
}

export interface PageWorkupAggProps {
  id: string;
  structParents: number;
  pageNumber: number;
  pageContentId: string;
  imgCounts: number;
  annotCounts: number;
  imgIds: string[];
  annotIds: Set<string>;
  annots: AnnotsCache[];
  imgs: ImgsCache[];
}

export interface AnnotsCache {
  id: string;
  href: string;
  rect: BoundingBox;
  ext: string;
}

export class ObjectMapServiceAlt extends DocImgWorkupService {
  private looseParse =
    /<<(?:(?=\/Page\s*)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)\>\>\s/g;
  private structParentsMatchRe = /(?:\/StructParents\s*(\d+))/g;
  private contentMatchRe = /(?:\/Contents\s*((\d+\s*\d+)\s[A-Z]))/g;
  private enumerableObjIdsRe = /\/\w+\d+\s((\d+\s*\d+)\s[A-Z])/g;
  private hrefMatchRe = /\/URI\s*\(([\s\S]*?)\)/g;
  private bbMatchRe = /\/(?:Rect\s*?\[([\s\S]*?)\])/g;
  private enumerableAnnotIdsRe = /(:?([\s\S]*?)0\s\w)/g;
  private annotsCheckRe = /(\/Annots)/g;
  private annotsMatchRe = /(?:\/Annots\s*\[([\s\S]*?)\])/g;
  private imgCheckRe = /(\/XObject)/g;
  private imgMatchRe = /\/XObject\s*<<([\s\S]*?)>>/g;
  private imgColorSpaceRe = /(?:\/ColorSpace\/([a-zA-Z]+)*)\//g;
  private imgFilterRe = /(?:\/Filter\/([a-zA-Z]+)*)\//g;
  private imgSmaskIdRe = /(?:\/SMask\s*(\d+\s*\d+\s*\d*)\s[A-Z])\//g;
  private imgSmaskCheckRe = /(\/SMask)/g;
  private imgWidthRe = /(?:\/Width\s*(\d+))/g;
  private imgHeightRe = /(?:\/Height\s*(\d+))/g;
  private countRegex = /(?:\/Count\s*(\d+))/g;
  private imgLengthRe = /(?:\/Length\s*(\d+))/g;
  private linearizedRe = /\/Linearized\s+\d/g;
  private versionRe = /(?:%PDF+-(\d+[\.]+\d)*)/g;
  private xmpRe = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;
  private xmpCreateDateRe =
    /(?:<\s*\S*:CreateDate>\s*([\s\S]*?)\s*<\/\s*\S*:CreateDate>)/g;
  private annotTagRe = /\/A(?![a-zB-Z])/g;
  private probeFullTextRe = /(\/StructParents|\/Page(?!s)|\/Annots)/g;
  private pageOrAnnotsRe = /(\/Page(?!s)|\/Annots)/g;
  private imgObjIdentifierRe = /(\/BitsPerComponent)/g;
  private pdfObject = /(\d+)[ \t\r\n\f\0]+(\d+)[ \t\r\n\f\0]+obj/g;
  private streamCaptureRe = /\s*stream\r*?\n*?([\s\S]*?)\r?\n*?endstream/g;
  private mydualcapture =
    /((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)/g;
  private psObjRegex = /(\d+\s+\d+\s+obj)\s*([\s\S]*?)(?:stream|endobj)/g;
  private markersRegex =
    /%[PF]DF-\d\.\d|(?<=[ \t\r\n\f\0])\d+[ \t\r\n\f\0]+\d+[ \t\r\n\f\0]+obj|(?<=[ \t\r\n\f\0>])stream|(?<=[ \t\r\n\f\0])xref|(?<=[ \t\r\n\f\0])trailer|(?<=[ \t\r\n\f\0])startxref|(?<=[ \t\r\n\f\0])%%EOF/g;
  private linearizedParseRe =
    /(\d+\s+\d+\s+obj\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;

  private linearizedParseAltRe =
    /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj|\s*<<)\r?/g;
  private nonlinearizedParseRe =
    /(?:(\d+\s+\d+\s*?\w*\s+?|[\d\w]*?)?<<([\s\S]*?))\s?(?:(>>\s*?stream|>>\s*?endobj))/g;
  private nonlinearParse =
    /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g;
  private annots =
    /(\d+\s+\d+\s+?)+?<<(?:(?=\/Action)|(?=\/A))*[\s\S]*?([\s\S]*?)(?:\r?\n|\s*>>stream|>>\s*endobj)/g;

  private xmpModifyDateRe =
    /(?:<\s*\S*:ModifyDate>\s*([\s\S]*?)\s*<\/\s*\S*:ModifyDate>)/g;
  private xmpCreatorToolRe =
    /(?:<\s*\S*:CreatorTool>\s*([\s\S]*?)\s*<\/\s*\S*:CreatorTool>)/g;
  private xmpProducerRe =
    /(?:<\s*\S*:Producer>\s*([\s\S]*?)\s*<\/\s*\S*:Producer>)/g;

  private isPdfVersion(s: string) {
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
      s === "1.9" ||
      s === "2.0"
    );
  }

  private rawPdfText(buff: Buffer | Uint8Array) {
    if (Buffer.isBuffer(buff)) {
      return buff.toString("latin1");
    } else {
      return this.strFromU8(buff, true);
    }
  }

  public fullText(buff: Buffer | Uint8Array) {
    const rawText = this.rawPdfText(buff);
    let flateStreams = Array.of<string>(),
      objStreams = Array.of<string>();
    if (Buffer.isBuffer(buff)) {
      objStreams = this.parseObjectStreams(buff, rawText);
      flateStreams = this.decompressFlateStreams(buff);
    } else {
      const buf = Buffer.from(buff);
      objStreams = this.parseObjectStreams(buf, rawText);
      flateStreams = this.decompressFlateStreams(buf);
    }

    return this.handlePdfWhitespace(rawText).concat(
      this.handlePdfWhitespace(objStreams.join(`\n`)).concat(
        this.handlePdfWhitespace(flateStreams.join("\n"))
      )
    );
  }

  public objStreamOnlyText(buff: Buffer | Uint8Array) {
    const rawText = this.rawPdfText(buff);
    let objStreams = Array.of<string>();
    if (Buffer.isBuffer(buff)) {
      objStreams = this.parseObjectStreams(buff, rawText);
    } else {
      const buf = Buffer.from(buff);
      objStreams = this.parseObjectStreams(buf, rawText);
    }

    return rawText.split(`\n`).concat(objStreams).join("\n");
  }
  public fflateStreamOnlyText(buff: Buffer | Uint8Array) {
    const rawText = this.rawPdfText(buff);
    let flateStream = Array.of<string>();
    if (Buffer.isBuffer(buff)) {
      flateStream = this.decompressFlateStreams(buff);
    } else {
      flateStream = this.decompressFlateStreams(Buffer.from(buff));
    }
    return rawText.split(`\n`).concat(flateStream).join(`\n`);
  }

  public isLinearized(buffer: Buffer | Uint8Array) {
    const rawText = this.rawPdfText(buffer);
    return this.linearizedRe.test(rawText);
  }
  public pdfVersion(fullText: string, toFloat: false): PDFVersions;
  public pdfVersion(
    fullText: string,
    toFloat: true
  ): 1.0 | 1.1 | 1.2 | 1.3 | 1.4 | 1.5 | 1.6 | 1.7 | 1.8 | 1.9 | 2.0;
  public pdfVersion(fullText: string, toFloat = false) {
    let x: PDFVersions = "1.5";
    for (const f of fullText.matchAll(this.versionRe)) {
      if (f?.[0] && f?.[1] && this.isPdfVersion(f?.[1])) {
        x = f?.[1];
      }
    }
    if (toFloat) return Number.parseFloat(x);
    else return x;
  }
  public rmTrailingNoise(p: string) {
    return p.replace(/stream/g, "").replace(/endobj/g, "");
  }

  /**
   *
   * if the xmp block exists *the following four fields must always also exist*
   *
   * **section 6.4.4 XMP Metadata**
   *
   * If an XMP metadata stream is present, each of the entries in
   * the document information dictionary, shall be represented by
   * the corresponding XMP property value.
   *
   * `xmp:CreatorTool`
   * `xmp:ModifyDate`
   * `xmp:CreateDate`
   * `pdf:Producer`
   *
   * https://cdn.standards.iteh.ai/samples/75804/35483ce9dfd84c91bf0a73ee984d399e/ISO-23504-1-2020.pdf
   */
  protected xmpWorkup(z: string, testRe: RegExp, matchAllRe: RegExp) {
    let target = "";
    if (testRe.test(z) && matchAllRe.global) {
      for (const i of z.matchAll(matchAllRe)) {
        const d0 = i?.[0],
          d1 = i?.[1];
        if (d0 && d1 && d1.length > 1) {
          target = d1;
        }
      }
    }
    return target;
  }

  protected getXmpMeta(fullText: string) {
    let xmp: ObjOfArrsEntity["xmp"] = undefined;
    for (const info of fullText.matchAll(this.xmpRe)) {
      const z = info?.[0];
      const o = info?.[1];
      if (z && o) {
        this.xmpWorkup(z, /(?:CreateDate)/g, this.xmpCreateDateRe);
        xmp = {
          createDate: this.xmpWorkup(
            z,
            /(?:CreateDate)/g,
            this.xmpCreateDateRe
          ),
          modifyDate: this.xmpWorkup(
            z,
            /(?:ModifyDate)/g,
            this.xmpModifyDateRe
          ),
          producer: this.xmpWorkup(z, /(?:Producer)/g, this.xmpProducerRe),
          creatorTool: this.xmpWorkup(
            z,
            /(?:CreatorTool)/g,
            this.xmpCreatorToolRe
          )
        };
      }
    }
    return xmp;
  }
  protected linearizedDrivenRe(buff: Buffer | Uint8Array) {
    if (this.isLinearized(buff)) {
      return /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g;
    } else {
      return /(\d+\s+\d+\s+obj\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\s*stream|\s*endobj)/g;
    }
  }

  public handlePdfWhitespace(raw: string) {
    return raw
      .replace(/\r\n/g, " \n") // CRLF → space + LF (preserve offsets like they do)
      .replace(/\r/g, "\n") // CR → LF
      .replace(/[ \t\f\0]+/g, " ") // Collapse horizontal PDF whitespace only
      .replace(/<<[ \t\f\0]+/g, "<<") // Normalize dict open
      .replace(/[ \t\f\0]+>>/g, ">>") // Normalize dict close
      .trim();
  }
  private mapIt(buff: Buffer | Uint8Array) {
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
    for (const txt of fullText.matchAll(
      this.linearizedParseRe
    )) {
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
    //  /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
    for (const d of fullText.matchAll(
      /(\d+\s+\d+\s+obj\s+?|[\d\s]*)?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Page)|(?=\/Contents))*[\s\S]*?([\s\S\t?\r?\n?\f?]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)\r?/g
    )) {
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
            // start at page 1 for the key or index 0??

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

  private annotsWorkup(aObjArr: ObjOfArrsBaseArr[]) {
    const map = new Map<string, AnnotsCache>();
    for (const { id, obj } of aObjArr) {
      let agg = {
        id,
        href: "",
        rect: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        },
        ext: ""
      };
      if (obj.startsWith("<<")) {
        for (const xx of obj.matchAll(
          /\/Rect\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/g
        )) {
          const all = xx?.[0],
            x1 = xx?.[1],
            y1 = xx?.[2],
            x2 = xx?.[3],
            y2 = xx?.[4];
          if (all && x1 && y1 && x2 && y2) {
            const bb = {
              x1: Number.parseFloat(x1),
              y1: Number.parseFloat(y1),
              x2: Number.parseFloat(x2),
              y2: Number.parseFloat(y2)
            } as const;
            agg.rect = bb;
          }
        }
        for (const xx of obj.matchAll(/\/URI\s*\(([\s\S]*?)\)|/g)) {
          const l0 = xx?.[0],
            l1 = xx?.[1];
          if (l0 && l1) {
            agg.href;
            const getExt = l1.lastIndexOf(".");
            if (getExt !== -1) {
              agg.ext = l1.slice(getExt + 1);
            } else {
              agg.ext = "unknown";
            }
          }
        }
      } else {
        for (const xx of obj.matchAll(this.hrefMatchRe)) {
          const l0 = xx?.[0],
            l1 = xx?.[1];
          if (l0 && l1) {
            agg.href = l1;
            const getExt = l1.lastIndexOf(".");
            if (getExt !== -1) {
              agg.ext = l1.slice(getExt + 1);
            } else {
              agg.ext = "unknown";
            }
          }
        }
        for (const yy of obj.matchAll(this.bbMatchRe)) {
          const r0 = yy?.[0],
            r1 = yy?.[1];
          if (r0 && r1) {
            const o = r1.trim().split(/\s+/);
            if (o.length === 4) {
              const [x1, y1, x2, y2] = o as [string, string, string, string];
              const bb = {
                x1: Number.parseFloat(x1),
                y1: Number.parseFloat(y1),
                x2: Number.parseFloat(x2),
                y2: Number.parseFloat(y2)
              } as const;
              agg.rect = bb;
            }
          }
        }
      }
      map.set(id, agg);
    }
    return map;
  }

  private imgLength(obj: string) {
    let length = 0;
    for (const xx of obj.matchAll(this.imgLengthRe)) {
      const l0 = xx?.[0],
        l1 = xx?.[1];
      if (l0 && l1) {
        length = Number.parseInt(l1.trim(), 10);
      }
    }
    return length;
  }

  private imgWidth(obj: string) {
    let width = 0;
    for (const ww of obj.matchAll(this.imgWidthRe)) {
      const w0 = ww?.[0],
        w1 = ww?.[1];
      if (w0 && w1) {
        width = Number.parseInt(w1.trim(), 10);
      }
    }
    return width;
  }

  private imgHeight(obj: string) {
    let height = 0;
    for (const hh of obj.matchAll(this.imgHeightRe)) {
      const h0 = hh?.[0],
        h1 = hh?.[1];
      if (h0 && h1) {
        height = Number.parseInt(h1.trim(), 10);
      }
    }
    return height;
  }

  private imgColorSpace(obj: string) {
    let cspace = "";
    for (const cs of obj.matchAll(this.imgColorSpaceRe)) {
      const cs0 = cs?.[0],
        cs1 = cs?.[1];
      if (cs0 && cs1) {
        cspace = cs1.trim();
      }
    }
    return cspace;
  }

  private imgFilter(obj: string) {
    let filter = "";
    for (const f of obj.matchAll(this.imgFilterRe)) {
      const f0 = f?.[0],
        f1 = f?.[1];
      if (f0 && f1) {
        filter = f1.trim();
      }
    }
    return filter;
  }

  private imgAspectRatio(width: number, height: number) {
    let ar = 1;
    if (width > 0 && height > 0) {
      ar = width / height;
    }
    return ar;
  }

  private imgEncoding(filter?: string | null) {
    if (!filter) return "unknown";

    const f = filter.toLowerCase();
    if (f.includes("dctdecode")) return "jpeg-dct"; // lossy
    if (f.includes("jpxdecode")) return "jpeg2000"; // lossy (usually)
    if (f.includes("ccittfaxdecode")) return "ccitt-fax"; // lossless, 1-bit
    if (f.includes("jbig2decode")) return "jbig2"; // lossless, 1-bit
    if (f.includes("flatedecode")) return "deflate"; // lossless (zlib)
    if (f.includes("lzwdecode")) return "lzw"; // lossless
    if (f.includes("asciihexdecode")) return "hex"; // encoding, not compression
    if (f.includes("ascii85decode")) return "ascii85"; // encoding, not compression
    if (f.includes("runlengthdecode")) return "rle"; // lossless

    return "unknown";
  }
  private imgAgg(id: string, obj: string) {
    const length = this.imgLength(obj);
    const width = this.imgWidth(obj);
    const height = this.imgHeight(obj);
    const colorSpace = this.imgColorSpace(obj);
    const filter = this.imgFilter(obj);
    const aspectRatio = this.imgAspectRatio(width, height);
    const encoding = this.imgEncoding(filter);
    return {
      id,
      length,
      width,
      height,
      colorSpace,
      aspectRatio,
      encoding,
      filter
    } satisfies ImgsCache;
  }

  private imgWorkup(imgsObjArr: ObjOfArrsBaseArr[]) {
    const map = new Map<string, ImgsCache>();
    for (const { id, obj } of imgsObjArr) {
      let agg = this.imgAgg(id, obj);
      if (this.imgSmaskCheckRe.test(obj)) {
        for (const sm of obj.matchAll(this.imgSmaskIdRe)) {
          const sm0 = sm?.[0],
            sm1 = sm?.[1];
          if (sm0 && sm1) {
            const smId = `${sm1.trim()} obj`;
            const submaskImg = imgsObjArr.find(id => id.id === smId);
            if (submaskImg?.obj) {
              const { obj: smaskObj, id: smaskId } = submaskImg;
              const smaskAgg = this.imgAgg(smaskId, smaskObj);
              const newAgg = {
                ...agg,
                submaskObjId: smId,
                submaskImg: smaskAgg
              } satisfies ImgsCache;
              map.set(id, newAgg);
            }
          }
        }
      } else {
        map.set(id, agg);
      }
    }
    return map;
  }

  private pageContentIdWorkup(obj: string) {
    let pageContentId = "";

    for (const o of obj.matchAll(this.contentMatchRe)) {
      const c0 = o?.[0],
        c1 = o?.[1],
        c2 = o?.[2];
      if (c0 && c1 && c2) {
        pageContentId = `${c2} obj`;
      }
    }
    return pageContentId;
  }

  private pageStructParentsWorkup(obj: string, i: number) {
    let structParents = 0;
    let pageNumber = 0;
    if (/\/StructParents/g.test(obj)) {
      for (const o of obj.matchAll(this.structParentsMatchRe)) {
        const o0 = o?.[0],
          o1 = o?.[1];
        if (o0 && o1) {
          const structParentsParsed = Number.parseInt(o1, 10);
          structParents = structParentsParsed;
          pageNumber = structParentsParsed + 1;
        } else {
          structParents = i;
          pageNumber = i + 1;
        }
      }
      structParents = i;
      pageNumber = i + 1;
    }
    return { structParents, pageNumber };
  }

  private pageAgg(id: string, obj: string, i: number) {
    const { pageNumber, structParents } = this.pageStructParentsWorkup(obj, i);
    const pageContentId = this.pageContentIdWorkup(obj);
    return {
      id,
      pageContentId,
      pageNumber,
      structParents
    };
  }

  public getPageMap(props: ObjOfArrsEntity) {
    const m = new Map<string, PageWorkupAggProps>();
    const annotMap = this.annotsWorkup(props.aObjArr);
    const imgMap = this.imgWorkup(props.xObjArr);
    const annotIdSetTrack = new Set<string>();
    let o = 0;

    for (const { obj, id } of props.pageObjArr) {
      o++;

      const { pageContentId, pageNumber, structParents } = this.pageAgg(
        id,
        obj,
        o
      );

      let rec = {
        id,
        structParents,
        pageNumber,
        imgCounts: 0,
        annotCounts: 0,
        pageContentId,
        annotIds: new Set<string>(),
        annots: Array.of<AnnotsCache>(),
        imgIds: Array.of<string>(),
        imgs: Array.of<ImgsCache>()
      } satisfies PageWorkupAggProps;

      if (this.imgCheckRe.test(obj)) {
        for (const s of obj.matchAll(this.imgMatchRe)) {
          const im0 = s?.[0],
            im1 = s?.[1];
          if (im0 && im1) {
            // multiple img Ids cam be contained within a single dict
            // handle all situations exhastively -> <</Im0 57 0 R/Im0 58 0 R>>
            for (const imId of im1.matchAll(this.enumerableObjIdsRe)) {
              const in0 = imId?.[0],
                in1 = imId?.[1],
                in2 = imId?.[2];
              if (in0 && in1 && in2) {
                const id = `${in2} obj`;
                const imgRec = imgMap.get(id);
                if (imgRec?.id) {
                  rec.imgs.push(imgRec);
                  rec.imgIds.push(id);
                  rec.imgCounts += 1;
                }
              }
            }
          }
        }
      }

      if (this.annotsCheckRe.test(obj) && !obj.startsWith("<<")) {
        for (const aa of obj.matchAll(this.annotsMatchRe)) {
          const aa0 = aa?.[0],
            aa1 = aa?.[1];
          if (aa0 && aa1) {
            // one annot is simple to parse, multiple stack in the same arr
            // handle all situations exhaustively -> [194 196 197 0 R]
            for (const aId of aa1.matchAll(this.enumerableAnnotIdsRe)) {
              const an0 = aId?.[0],
                an1 = aId?.[1],
                an2 = aId?.[2];
              if (an0 && an1 && an2) {
                for (const anId of an2.matchAll(/(\d+\s[0])\s[R]/g)) {
                  const anId0 = anId?.[0],
                    anId1 = anId?.[1];
                  if (anId0 && anId1) {
                    const annotId = anId1.trim();
                    const annotRec = annotMap.get(annotId);
                    if (annotRec?.href && !rec.annotIds.has(annotRec.id)) {
                      rec.annotIds.add(annotId);
                      rec.annotCounts += 1;
                      rec.annots.push(annotRec);
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (props.aObjArr.length < 1 || annotMap.size > 0) {
        for (const [id, annot] of Array.from(annotMap)) {
          annotIdSetTrack.add(id);
          if (!annotIdSetTrack.has(id)) {
            rec.annotIds.add(id);
            rec.annots.push(annot);
          }

          //   if (v && v.length > 0) {
          //   for (const annot of v) {
          //     const a = annotMap.get(annot);
          //     if (a?.href) {
          //       rec.annotIds.add(a.id);
          //       rec.annotCounts += 1;
          //       rec.annots.push(a);
          //     }
          //   }
          // }
        }
      }
      rec.annotCounts = annotIdSetTrack.size;
      m.set(id, rec);
    }
    const topLevelAgg = {
      totalImgs: 0,
      totalAnnots: annotIdSetTrack.size,
      annotPages: new Set<number>(),
      imgPages: new Set<number>(),
      totalPages: 0,
      imgs: Array.of<
        ImgsCache & { page: number; pageId: string; pageContentId: string }
      >(),
      annots: Array.of<
        AnnotsCache & { page: number; pageId: string; pageContentId: string }
      >()
    };
    let v = 0;
    for (const [_pageId, pageVals] of Array.from(m.entries())) {
      topLevelAgg.totalPages += 1;
      const page = topLevelAgg.totalPages;
      if (pageVals.imgCounts > 0) {
        for (const img of pageVals.imgs) {
          topLevelAgg.imgs.push({
            page,
            pageId: pageVals.id,
            pageContentId: pageVals.pageContentId,
            ...img
          });
        }

        topLevelAgg.totalImgs += pageVals.imgCounts;
        topLevelAgg.imgPages.add(v + 1);
      }
      if (pageVals.annotCounts > 0) {
        for (const annot of pageVals.annots) {
          topLevelAgg.annots.push({
            page,
            pageId: pageVals.id,
            pageContentId: pageVals.pageContentId,
            ...annot
          });
        }
        topLevelAgg.totalAnnots += pageVals.annotCounts;
        topLevelAgg.annotPages.add(v + 1);
      }
      v += 1;
    }
    const { annotPages, imgPages, ...rest } = topLevelAgg;
    const annotPagesFromSet = Array.from(annotPages);
    const imgPagesFromSet = Array.from(imgPages);
    const annotIds = Array.from(annotMap);
    // const annotIdsFromSet = Array.from(annotIds);
    // const pageIdsTuple = Array.from(props.pageIdsMap);
    // const annotIdsTuple = Array.from(props.annotIdsMap);
    const annotsArr = Array.from(props.annotsMap.values());
    return {
      xmp: props.xmp ?? undefined,
      annotPages: annotPagesFromSet,
      imgPages: imgPagesFromSet,
      ...rest,
      annotObjs: props.aObjArr,
      annotId: annotIds,
      s: Array.from(props.annotsMap),
      totalPages: props.countFallback,
      annotsArr,
      // pageIdsTuple,
      // annotsTuple,
      // annotIdsTuple,
      examine: props.examine
    };
  }

  public pdfMapInit(buffer: Buffer | Uint8Array) {
    const arrOfObjs = this.mapIt(buffer) as ObjOfArrsEntity;
    return this.getPageMap(arrOfObjs);
  }
}
// (?:(([0-9]+\s*\d+\s*[a-z]+\s*)+)\s*([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)(?:endstream|endobj))
// ((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)

// (?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))\s*?<<\/?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)

// (?:(\d+\s+\d+\s+obj\s+?|[\d\s]*))?\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\t?\r?\n\f?\n?|\n?\s?>>stream|>>\s*endobj)
/**
 * private xmpRegex = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;
private creationInfo =
  /<<(?:(?=\/CreationDate)|(?=\/Count))[\s\S]*?([\s\S]*?)>>/g;

private _streamCaptureRegex = /\s*stream\r*?\n*?([\s\S]*?)\r?\n*?endstream/g;
// (?:(([0-9]+\s*\d+\s*[a-z]+\s*)+)\s*([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)(?:endstream|endobj))
// ((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(stream\s*([\s\S]*?)\s*endstream|endobj)
private _mydualcapture =
  /((\d+\s+\d*?\s*?obj?\s*)+?([\s\S]*?))*\s*(?:stream\s*([\s\S]*?)\s*endstream|endobj)/g;
private psObjRegex = /(\d+\s+\d+\s+obj)\s*([\s\S]*?)(?:stream|endobj)/g;

private hmmm =
  /(\d+\s+\d+\s+obj\s+?|\d+\s+?)+?<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n)/g;

private comprehensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>endobj)/g;

private extensive =
  /(?:(\d+\s+\d+\s+obj\s+?|\d+\s+)*?)\s*<<(?:(?=\/CreationDate)|(?=\/BitsPerComponent)|(?=\/Count)|(?=\/Contents))*[\s\S]*?([\s\S]*?)(?:\r?\n|>>stream|>>\s*endobj)/g;
 */
