import type { AnnotsCache, ObjOfArrsBaseArr } from "@/docs/pdf/types/index.ts";
import { PdfXmpWorkup } from "@/docs/pdf/xmp/index.ts";

export class PdfAnnotsWorkup extends PdfXmpWorkup {
  private hrefMatchRe = /\/URI\s*\(([\s\S]*?)\)/g;

  private hrefAltRe = /\/URI\s*\(([\s\S]*?)\)|/g;
  private bbMatchRe = /\/(?:Rect\s*?\[([\s\S]*?)\])/g;
  private rectsPrecisionRe =
    /\/Rect\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/g;

  protected annotsRe(
    t: "string",
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ): string;
  protected annotsRe(
    t: "rect",
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ): AnnotsCache["rect"];
  protected annotsRe<const V extends "rect" | "string">(
    t: V,
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ) {
    if (t === "rect") {
      let target = {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      };
      if (testRe.test(z) && matchAllRe.global) {
        for (const yy of z.matchAll(matchAllRe)) {
          const all = yy?.[0],
            x1 = yy?.[1],
            y1 = yy?.[2],
            x2 = yy?.[3],
            y2 = yy?.[4];
          if (all && x1 && y1 && x2 && y2) {
            const bb = {
              x1: Number.parseFloat(x1),
              y1: Number.parseFloat(y1),
              x2: Number.parseFloat(x2),
              y2: Number.parseFloat(y2)
            } as const;
            target = bb;
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

  protected annotsAgg(id: string, obj: string) {
    let ext: string;
    const [rect, href] = [
      this.annotsRe("rect", obj, /(?:Rect)/g, this.rectsPrecisionRe),
      this.annotsRe("string", obj, /(?:URI)/g, this.hrefMatchRe)
    ];
    const extIndex = href.lastIndexOf(".");
    if (extIndex !== -1) {
      ext = href.slice(extIndex + 1);
    } else {
      ext = "unknown";
    }
    return {
      id,
      href,
      rect,
      ext
    };
  }
  
  public annotsWorkup(aObjArr: ObjOfArrsBaseArr[]) {
    const map = new Map<string, AnnotsCache>();
    for (const { id, obj } of aObjArr) {
      map.set(id, this.annotsAgg(id, obj));
    }
    return map;
  }
}
