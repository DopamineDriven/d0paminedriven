import { PdfImgsWorkup } from "@/docs/pdf/imgs/index.ts";

/**
 * Page objects can also have Contents Arrays
 *
 * ```ts
 * // handle it by parsing capture group at index 1 with matchAll, then split after each R
 * const contentsEnumerableRe=/(?:Contents\s*\[([\s\S]*?)\])/g;
 * ```
 */
export class PdfPagesWorkup extends PdfImgsWorkup {
  private structParentsMatchRe = /(?:StructParents\s*(\d+))/g;
  private contentMatchRe = /(?:Contents\s*((\d+\s*\d+)\s[A-Z]))/g;

  protected pagesRe(
    t: "string",
    index: number,
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ): string;
  protected pagesRe(
    t: "number",
    index: number,
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ): { structParent: number; pageNumber: number };
  protected pagesRe<const V extends "string" | "number">(
    t: V,
    index: number,
    z: string,
    testRe: RegExp,
    matchAllRe: RegExp
  ) {
    if (t === "number") {
      let pageNumber = 0;
      let target = 0;
      if (testRe.test(z) && matchAllRe.global) {
        for (const i of z.matchAll(matchAllRe)) {
          const d0 = i?.[0],
            d1 = i?.[1];
          if (d0 && d1) {
            target = Number.parseInt(d1.trim(), 10);
            pageNumber = target + 1;
          }
        }
      } else {
        target = index;
        pageNumber = index + 1;
      }
      return { structParent: target, pageNumber };
    } else {
      let str = "";
      if (testRe.test(z) && matchAllRe.global) {
        for (const i of z.matchAll(matchAllRe)) {
          const d0 = i?.[0],
            d1 = i?.[1],
            d2 = i?.[2];
          if (d0 && d1 && d2) {
            str = `${d2} obj`;
          }
        }
      }
      return str;
    }
  }
  /**
   * Fallback to relying on index counts when iterating over page objects in
   * the abence of a StructParents Key.
   *
   * pageNumber = structParentsVal+1
   */
  protected pageAgg(i: number, id: string, obj: string) {
    const [pageContentId, structParents] = [
      this.pagesRe("string", i, obj, /(?:Content)/g, this.contentMatchRe),
      this.pagesRe(
        "number",
        i,
        obj,
        /(?:StructParents)/g,
        this.structParentsMatchRe
      )
    ];
    return {
      ...structParents,
      id,
      pageContentId
    };
  }
}
