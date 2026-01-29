import type {
  CalRgbMetadata,
  ImgCacheBase,
  ImgsCache,
  ObjOfArrsBaseArr
} from "@/docs/pdf/types/index.ts";
import { PdfAnnotsWorkup } from "@/docs/pdf/annots/index.ts";

export class PdfImgsWorkup extends PdfAnnotsWorkup {
  private imgColorSpaceRe = /(?:\/ColorSpace\/([a-zA-Z]+)*)\//g;
  private imgFilterRe = /(?:\/Filter\/([a-zA-Z]+)*)\//g;
  private imgSmaskIdRe = /(?:\/SMask\s*(\d+\s*\d+\s*\d*)\s[A-Z])\//g;
  private imgSmaskCheckRe = /(\/SMask)/g;
  private imgWidthRe = /(?:\/Width\s*(\d+))/g;
  private imgHeightRe = /(?:\/Height\s*(\d+))/g;
  private imgLengthRe = /(?:\/Length\s*(\d+))/g;
  /**
   * Capture Group 2 yields this type of output
   *
   * /Gamma[2.2 2.2 2.2]/Matrix[0.41239 0.21264 0.01933 0.35758 0.71517 0.11919 0.18048 0.07219 0.95053]/WhitePoint[0.95046 1 1.08906]
   */
  private calRgbRe = /\[?(\/CalRGB\s*<<\s*([\s\S]*?)>>)\]/g;
  /**
   * /Gamma[2.2 2.2 2.2]/Matrix[0.41239 0.21264 0.01933 0.35758 0.71517 0.11919 0.18048 0.07219 0.95053]/WhitePoint[0.95046 1 1.08906]
   *
   * becomes
   *
   * match 0: /WhitePoint[0.95046 1 1.08906]
   *
   * group 1: 0.95046
   *
   * group 2: 1
   *
   * group 3: 1.08906
   */
  private gammaPreciseRe =
    /\/Gamma\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/g;
  /**
   * /Gamma[2.2 2.2 2.2]/Matrix[0.41239 0.21264 0.01933 0.35758 0.71517 0.11919 0.18048 0.07219 0.95053]/WhitePoint[0.95046 1 1.08906]
   *
   * becomes
   *
   * match 0: /Gamma[2.2 2.2 2.2]
   *
   * group 1: 2.2
   *
   * group 2: 2.2
   *
   * group 3: 2.2
   */
  private whitePointPreciseRe =
    /\/WhitePoint\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/g;
  /**
   * /Gamma[2.2 2.2 2.2]/Matrix[0.41239 0.21264 0.01933 0.35758 0.71517 0.11919 0.18048 0.07219 0.95053]/WhitePoint[0.95046 1 1.08906]
   *
   * becomes
   *
   * match 0: /Matrix[0.41239 0.21264 0.01933 0.35758 0.71517 0.11919 0.18048 0.07219 0.95053]
   *
   * group 1: 0.41239
   *
   * group 2: 0.21264
   *
   * ...etc (through group 9)
   */
  private matrixPreciseRe =
    /\/Matrix\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/g;

  protected imgColorSpace(obj: string) {
    let cspace = "";
    let calRgb: ImgCacheBase["calRgb"] = undefined;
    let wpObj: CalRgbMetadata["whitePoint"] | undefined = undefined;
    let gammaObj: CalRgbMetadata["gamma"] | undefined = undefined;
    let matrixObj: CalRgbMetadata["matrix"] | undefined = undefined;
    if (/(?:CalRGB)/g.test(obj)) {
      for (const cs of obj.matchAll(this.calRgbRe)) {
        const cs0 = cs?.[0],
          cs1 = cs?.[1],
          cs2 = cs?.[2];

        if (cs0 && cs1 && cs2) {
          for (const wp of cs2.matchAll(this.whitePointPreciseRe)) {
            const wp0 = wp?.[0],
              wp1 = wp?.[1],
              wp2 = wp?.[2],
              wp3 = wp?.[3];
            if (wp0 && wp1 && wp2 && wp3) {
              wpObj = {
                x: parseFloat(wp1),
                y: parseFloat(wp2),
                z: parseFloat(wp3)
              };
            }
          }
          for (const g of cs2.matchAll(this.gammaPreciseRe)) {
            const g0 = g?.[0],
              g1 = g?.[1],
              g2 = g?.[2],
              g3 = g?.[3];
            if (g0 && g1 && g2 && g3) {
              gammaObj = {
                gr: parseFloat(g1),
                gg: parseFloat(g2),
                gb: parseFloat(g3)
              };
            }
          }
          for (const m of cs2.matchAll(this.matrixPreciseRe)) {
            const m0 = m?.[0],
              m1 = m?.[1],
              m2 = m?.[2],
              m3 = m?.[3],
              m4 = m?.[4],
              m5 = m?.[5],
              m6 = m?.[6],
              m7 = m?.[7],
              m8 = m?.[8],
              m9 = m?.[9];
            if (m0 && m1 && m2 && m3 && m4 && m5 && m6 && m7 && m8 && m9) {
              matrixObj = {
                xa: parseFloat(m1),
                ya: parseFloat(m2),
                za: parseFloat(m3),
                xb: parseFloat(m4),
                yb: parseFloat(m5),
                zb: parseFloat(m6),
                xc: parseFloat(m7),
                yc: parseFloat(m8),
                zc: parseFloat(m9)
              };
            }
          }
          if (wpObj && gammaObj && matrixObj) {
            calRgb = {
              whitePoint: wpObj,
              gamma: gammaObj,
              matrix: matrixObj
            };
          }
          cspace = "CalRGB";
        }
      }
    } else {
      for (const cs of obj.matchAll(this.imgColorSpaceRe)) {
        const cs0 = cs?.[0],
          cs1 = cs?.[1];
        if (cs0 && cs1) {
          cspace = cs1.trim();
        }
      }
    }
    return { colorSpace: cspace, calRgb };
  }

  protected imgReScaffold(
    t: "string",
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ): string;
  protected imgReScaffold(
    t: "number",
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ): number;
  protected imgReScaffold<const V extends "string" | "number">(
    t: V,
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ) {
    if (t === "number") {
      let target = 0;
      if (testRe.test(z) && matchAllRe.global) {
        for (const i of z.matchAll(matchAllRe)) {
          const d0 = i?.[0],
            d1 = i?.[1];
          if (d0 && d1) {
            target = Number.parseInt(d1.trim(), 10);
          }
        }
      }
      return target;
    } else {
      let str = "";
      if (testRe.test(z) && matchAllRe.global) {
        for (const i of z.matchAll(matchAllRe)) {
          const d0 = i?.[0],
            d1 = i?.[1];
          if (d0 && d1) {
            str = d1.trim();
          }
        }
      }
      return str;
    }
  }

  protected imgEncoding(filter?: string | null) {
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

  protected imgScaffold(id: string, obj: string) {
    let aspectRatio: number;
    const [length, width, height, filter] = [
      this.imgReScaffold("number", obj, /(?:Length)/g, this.imgLengthRe),
      this.imgReScaffold("number", obj, /(?:Width)/g, this.imgWidthRe),
      this.imgReScaffold("number", obj, /(?:Height)/g, this.imgHeightRe),
      this.imgReScaffold("string", obj, /(?:Filter)/g, this.imgFilterRe)
    ];
    const encoding = this.imgEncoding(filter);
    const { calRgb, colorSpace } = this.imgColorSpace(obj);
    if (width > 0 && height > 0) {
      aspectRatio = width / height;
    } else {
      aspectRatio = 1;
    }
    return {
      id,
      aspectRatio,
      height,
      length,
      width,
      filter,
      encoding,
      colorSpace,
      calRgb
    } as const;
  }

  /**
   * handle nested SMask imgs by following obj ref
   */
  public imgWorkup(imgsObjArr: ObjOfArrsBaseArr[]) {
    const map = new Map<string, ImgsCache>();
    for (const { id, obj } of imgsObjArr) {
      let agg = this.imgScaffold(id, obj);
      if (this.imgSmaskCheckRe.test(obj)) {
        for (const sm of obj.matchAll(this.imgSmaskIdRe)) {
          const sm0 = sm?.[0],
            sm1 = sm?.[1];
          if (sm0 && sm1) {
            const smId = `${sm1.trim()} obj`;
            const submaskImg = imgsObjArr.find(id => id.id === smId);
            if (submaskImg?.obj) {
              const { obj: smaskObj, id: smaskId } = submaskImg;
              const smaskAgg = this.imgScaffold(smaskId, smaskObj);
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
}
