import { Fs } from "@d0paminedriven/fs";
import { DocImgWorkupService } from "@/docs/doc-img-workup.ts";

const fs = new Fs(process.cwd());
const name = "Geminastics-Pt-I-qpdf";

const readPdf = fs.fileToBuffer(`src/test/out/remote/pdfs/${name}.pdf`);

console.log(readPdf.length);

const docImgWorkup = new DocImgWorkupService();

function getUncompressedPdfText(buffer: Buffer) {
  const rawText = buffer.toString("latin1");

  // Decompress Object Streams (ObjStm) - used by Acrobat-optimized PDFs
  const objStreams = docImgWorkup.parseObjectStreams(buffer, rawText);

  // Decompress FlateDecode streams - regular compressed streams
  const flateStreams = docImgWorkup.decompressFlateStreams(buffer);

  // Combine: raw text + all decompressed content
  // This gives us the equivalent of qpdf --stream-data=uncompress
  const allContent = [rawText, ...objStreams, ...flateStreams].join("\n");

  return allContent;
}

const uncompressedText = getUncompressedPdfText(readPdf);
// Use normalizePageObjects to recursively sort all PDF dictionaries
// This reorders keys alphabetically to match qpdf's output format

const o = docImgWorkup.xObjectMapperNew(uncompressedText);

console.log(o);

fs.withWs(`src/test/out/remote/inspect/${name}.json`, JSON.stringify(o, null, 2));
