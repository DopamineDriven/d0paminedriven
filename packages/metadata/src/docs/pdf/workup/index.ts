import type { PDFVersions } from "@/docs/pdf/types/index.ts";
import { DocImgWorkupService } from "@/docs/doc-img-workup.ts";

export class PdfWorkItUp extends DocImgWorkupService {
  private linearizedRe = /(?:Linearized)/;
  private versionRe = /(?:%PDF+-(\d+[\.]+\d)*)/g;

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

  public rawPdfText(buff: Buffer | Uint8Array) {
    if (Buffer.isBuffer(buff)) {
      return buff.toString("latin1");
    } else {
      return Buffer.from(buff).toString("latin1");
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

  public isLinearized(buffer: Buffer | Uint8Array | string) {
  if (typeof buffer ==="string") {
    return this.linearizedRe.test(buffer)
  } else {
     const rawText = this.fullText(buffer);
    return this.linearizedRe.test(rawText);
  }}

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

  public linearizedDrivenRe(buff: Buffer | Uint8Array) {
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
}
