import type { ObjOfArrsEntity } from "@/docs/pdf/types/index.ts";
import { PdfWorkItUp } from "@/docs/pdf/workup/index.ts";

/**
 *
 * if the xmp block exists *the following four fields must always also exist*
 *
 * **section 6.4.4 XMP Metadata**
 *
 * If an XMP metadata stream is present, each of the entries in
 * the document information dictionary shall be represented by
 * the corresponding XMP property value.
 *
 * `xmp:CreatorTool`
 * `xmp:ModifyDate`
 * `xmp:CreateDate`
 * `pdf:Producer`
 *
 * https://cdn.standards.iteh.ai/samples/75804/35483ce9dfd84c91bf0a73ee984d399e/ISO-23504-1-2020.pdf
 */
export class PdfXmpWorkup extends PdfWorkItUp {
  private xmpRe = /(<x:xmpmeta\s*(?:<*?([\s\S]*?))<\/x:xmpmeta>)/g;
  private xmpCreateDateRe =
    /(?:<\s*\S*:CreateDate>\s*([\s\S]*?)\s*<\/\s*\S*:CreateDate>)/g;
  private xmpModifyDateRe =
    /(?:<\s*\S*:ModifyDate>\s*([\s\S]*?)\s*<\/\s*\S*:ModifyDate>)/g;
  private xmpCreatorToolRe =
    /(?:<\s*\S*:CreatorTool>\s*([\s\S]*?)\s*<\/\s*\S*:CreatorTool>)/g;
  private xmpProducerRe =
    /(?:<\s*\S*:Producer>\s*([\s\S]*?)\s*<\/\s*\S*:Producer>)/g;

  /**
   * capturing groups 2 through 8 return -> (2) YYYY (3) MM (4) DD (5) HH (6) MM (7) SS (8) TZ offset (eg, +00, -05)
   */
  private createDateDictExtensiveRe =
    /(?:\/CreationDate\s*\(D:((\d\d\d\d){1}(\d\d){1}(\d\d){1}(\d\d){1}(\d\d){1}(\d\d){1}(\+\d\d){1}[\s\S]*?)\)\s*)/g;
  private createDateDictRe = /(?:\/CreationDate\s*\(D:([\s\S]*?)\)\s*)/g;
  private modifyDateDictRe = /(?:\/ModDate\s*\(D:([\s\S]*?)\)\s*)/g;
  private producerDictRe = /(?:\/Producer\s*\(([\s\S]*?)\)\s*)/g;
  private creatorDictRe = /(?:\/Creator\s*\(([\s\S]*?)\)\s*)/g;

  protected regexIt(z: string, testRe: RegExp, matchAllRe: RegExp) {
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

  public getXmpMeta(fullText: string) {
    let xmp: ObjOfArrsEntity["xmp"] = undefined;
    for (const info of fullText.matchAll(this.xmpRe)) {
      const z = info?.[0];
      const o = info?.[1];
      if (z && o) {
        xmp = {
          createDate: this.regexIt(z, /(?:CreateDate)/g, this.xmpCreateDateRe),
          modifyDate: this.regexIt(z, /(?:ModifyDate)/g, this.xmpModifyDateRe),
          producer: this.regexIt(z, /(?:Producer)/g, this.xmpProducerRe),
          creatorTool: this.regexIt(
            z,
            /(?:CreatorTool)/g,
            this.xmpCreatorToolRe
          )
        };
      }
    }
    if (typeof xmp === "undefined") {
      const createDateFallback = this.regexIt(
        fullText,
        /(?:CreationDate)/g,
        this.createDateDictRe
      );
      const modDateFallbackRe = this.regexIt(
        fullText,
        /(?:ModDate)/g,
        this.modifyDateDictRe
      );
      const creatorFallback = this.regexIt(
        fullText,
        /(?:Creator)/g,
        this.creatorDictRe
      );
      const producerFallback = this.regexIt(
        fullText,
        /(?:Producer)/g,
        this.producerDictRe
      );
      if (
        createDateFallback.length > 0 &&
        modDateFallbackRe.length > 0 &&
        creatorFallback.length > 0 &&
        producerFallback.length > 0
      ) {
        xmp = {
          createDate: createDateFallback,
          creatorTool: creatorFallback,
          modifyDate: modDateFallbackRe,
          producer: producerFallback
        };
      }
    }
    return xmp;
  }
}
