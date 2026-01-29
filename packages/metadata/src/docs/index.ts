import { createReadStream } from "node:fs";
import { relative } from "node:path";
import { Readable } from "node:stream";
import { inflateSync } from "fflate";
import type {
  DocSpecs,
  PdfImageAnalysisMeta,
  ZipEntry
} from "@/types/index.ts";
import { ObjectMapService } from "./pdf/obj-map.ts";

export class DocMetadataExtractor extends ObjectMapService {
  private getExtFromFilename(filename?: string): string | null {
    if (!filename) return null;
    const i = filename.lastIndexOf(".");
    if (i === -1) return null;
    return filename.slice(i + 1).toLowerCase();
  }

  private extToLanguage(ext: string | null): string | null {
    if (!ext) return null;
    const map: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      rs: "rust",
      go: "go",
      java: "java",
      c: "c",
      h: "c",
      cpp: "cpp",
      hpp: "cpp",
      cs: "csharp",
      php: "php",
      swift: "swift",
      kotlin: "kotlin",
      kt: "kotlin",
      m: "objective-c",
      mm: "objective-c++",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      json: "json",
      yml: "yaml",
      yaml: "yaml",
      md: "markdown",
      markdown: "markdown",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      sql: "sql",
      csv: "csv",
      txt: "text",
      tex: "tex"
    };
    return map[ext] ?? null;
  }

  public parsePdf(buffer: Buffer, mime: "application/pdf") {
    const text = buffer.toString("latin1");
    const headerMatch = text.match(/^%PDF-([0-9.]+)/);
    const pdfVersion = headerMatch?.[1] ?? null;
    const isLinearized = /Linearized/i.test(text);
    const isEncrypted = /\/Encrypt\b/.test(text);

    const pageCount = this.countPDFPages(buffer);

    const textPreview = this.extractPDFText(buffer, 500);
    const isSearchable =
      !!textPreview || /\bToUnicode\b/.test(text) || /\/Font\b/.test(text);

    const author = this.getPdfInfoString(text, "Author");
    const subject = this.getPdfInfoString(text, "Subject");
    const title = this.getPdfInfoString(text, "Title");
    const creator = this.getPdfInfoString(text, "Creator");
    const producer = this.getPdfInfoString(text, "Producer");
    const keywordsRaw = this.getPdfInfoString(text, "Keywords");
    let keywords = keywordsRaw
      ? keywordsRaw
          .split(/[,;]/)
          .map(s => s.trim())
          .filter(Boolean)
      : null;

    if (creator || producer) {
      const extra = [creator, producer].filter(Boolean) as string[];
      keywords = (keywords ?? []).concat(extra);
    }

    let createdDate = this.extractPdfDate(text, "CreationDate");
    let modifiedDate = this.extractPdfDate(text, "ModDate");

    if (!createdDate && !modifiedDate) {
      const xmpDates = this.extractXmpDates(text);
      createdDate = xmpDates.createdDate;
      modifiedDate = xmpDates.modifiedDate;
    }

    return {
      type: "DOCUMENT",
      format: "pdf",
      mimeType: mime ?? "application/pdf",
      pageCount,
      wordCount: textPreview ? this.countWords(textPreview) : null,
      lineCount: null,
      language: null,
      encoding: null,
      author: author ?? creator ?? producer ?? null,
      subject: subject ?? title ?? null,
      keywords,
      pdfVersion,
      isEncrypted,
      isSearchable,
      isLinearized,
      textPreview,
      createdDate,
      modifiedDate,
      metadata: this.cleanPdfImgAnalysisNuevo(buffer, pageCount)
    } as DocSpecs<PdfImageAnalysisMeta>;
  }
  public parseRtf(buffer: Buffer, mime: string): DocSpecs {
    const latin = buffer.toString("latin1");
    // Extremely naive RTF to text: remove control words and groups
    const text = latin
      .replace(/\\'[0-9a-fA-F]{2}/g, " ")
      .replace(/\\[a-zA-Z]+-?\d* ?/g, " ")
      .replace(/[{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const words = this.countWords(text);
    const lines = this.countLines(text);
    return {
      type: "DOCUMENT",
      format: "rtf",
      mimeType: mime,
      pageCount: null,
      wordCount: words,
      lineCount: lines,
      language: null,
      encoding: "rtf",
      author: null,
      subject: null,
      keywords: null,
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: true,
      isLinearized: null,
      textPreview: this.firstN(text),
      createdDate: null,
      modifiedDate: null
    } satisfies DocSpecs;
  }

  public parsePlainText(
    buffer: Buffer,
    mime: string,
    filename?: string
  ): DocSpecs {
    const u8 = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    const { encoding } = this.detectTextEncodingPrefix(u8);
    const text = this.detectAndDecodeText(u8);
    const ext = this.getExtFromFilename(filename);
    const language = this.extToLanguage(ext);
    const words = this.countWords(text);
    const lines = this.countLines(text);
    return {
      type: "DOCUMENT",
      format:
        ext === "md"
          ? "md"
          : ext === "csv"
            ? "csv"
            : ext === "json"
              ? "json"
              : ext === "html"
                ? "html"
                : "txt",
      mimeType: mime,
      pageCount: null,
      wordCount: words,
      lineCount: lines,
      language,
      encoding,
      author: null,
      subject: null,
      keywords: null,
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: true,
      isLinearized: null,
      textPreview: this.firstN(text),
      createdDate: null,
      modifiedDate: null
    } satisfies DocSpecs;
  }
  /** ---- Minimal ZIP reader utilities (central directory based) ---- */
  private findEOCD(buffer: Buffer): number {
    // EOCD signature: 0x06054b50
    const sig = 0x06054b50;
    const maxSearch = Math.min(buffer.length, 0xffff + 22); // comment <= 65535
    for (let i = buffer.length - 22; i >= buffer.length - maxSearch; i--) {
      if (i < 0) break;
      if (buffer.readUInt32LE(i) === sig) return i;
    }
    return -1;
  }
  public readCentralDirectory(buffer: Buffer): ZipEntry[] {
    try {
      const eocd = this.findEOCD(buffer);
      if (eocd < 0 || eocd + 22 > buffer.length) return [];
      const sig = buffer.readUInt32LE(eocd);
      if (sig !== 0x06054b50) return [];

      const diskNumber = buffer.readUInt16LE(eocd + 4);
      const diskWithCD = buffer.readUInt16LE(eocd + 6);
      if (diskNumber !== 0 || diskWithCD !== 0) return [];

      const totalEntries = buffer.readUInt16LE(eocd + 10);
      const cdirSize = buffer.readUInt32LE(eocd + 12);
      const cdirOffset = buffer.readUInt32LE(eocd + 16);

      if (cdirOffset + cdirSize > buffer.length) {
        return this.recoverCentralDirectory(buffer, cdirOffset, totalEntries);
      }
      return this.parseCentralDirectory(buffer, cdirOffset, totalEntries);
    } catch {
      return [];
    }
  }

  private parseCentralDirectory(
    buffer: Buffer,
    offset: number,
    totalEntries: number
  ): ZipEntry[] {
    const entries: ZipEntry[] = [];
    let p = offset;
    const CEN_SIG = 0x02014b50;
    for (let i = 0; i < totalEntries; i++) {
      if (p + 46 > buffer.length) break;
      if (buffer.readUInt32LE(p) !== CEN_SIG) break;
      const compression = buffer.readUInt16LE(p + 10);
      const compSize = buffer.readUInt32LE(p + 20);
      const uncompSize = buffer.readUInt32LE(p + 24);
      const nameLen = buffer.readUInt16LE(p + 28);
      const extraLen = buffer.readUInt16LE(p + 30);
      const commentLen = buffer.readUInt16LE(p + 32);
      const localHeaderOffset = buffer.readUInt32LE(p + 42);
      const nameStart = p + 46;
      const nameEnd = nameStart + nameLen;
      if (nameEnd > buffer.length) break;
      const name = buffer.subarray(nameStart, nameEnd).toString("utf-8");
      entries.push({
        name,
        compressedSize: compSize,
        uncompressedSize: uncompSize,
        compressionMethod: compression,
        localHeaderOffset
      });
      p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  private recoverCentralDirectory(
    buffer: Buffer,
    startOffset: number,
    maxEntries: number
  ): ZipEntry[] {
    const entries: ZipEntry[] = [];
    const CEN_SIG = 0x02014b50;
    let p = Math.max(0, startOffset);
    while (p + 46 <= buffer.length && entries.length < maxEntries) {
      if (buffer.readUInt32LE(p) === CEN_SIG) {
        const compression = buffer.readUInt16LE(p + 10);
        const compSize = buffer.readUInt32LE(p + 20);
        const uncompSize = buffer.readUInt32LE(p + 24);
        const nameLen = buffer.readUInt16LE(p + 28);
        const extraLen = buffer.readUInt16LE(p + 30);
        const commentLen = buffer.readUInt16LE(p + 32);
        const localHeaderOffset = buffer.readUInt32LE(p + 42);
        const nameStart = p + 46;
        const nameEnd = nameStart + nameLen;
        if (nameEnd > buffer.length) break;
        const name = buffer.subarray(nameStart, nameEnd).toString("utf-8");
        entries.push({
          name,
          compressedSize: compSize,
          uncompressedSize: uncompSize,
          compressionMethod: compression,
          localHeaderOffset
        });
        p += 46 + nameLen + extraLen + commentLen;
        continue;
      }
      p += 1;
    }
    return entries;
  }
  public readLocalFileData(buffer: Buffer, entry: ZipEntry): Uint8Array | null {
    // Local file header signature 0x04034b50
    const LH_SIG = 0x04034b50;
    const p = entry.localHeaderOffset;
    if (buffer.readUInt32LE(p) !== LH_SIG) return null;
    const _generalFlag = buffer.readUInt16LE(p + 6);
    const method = buffer.readUInt16LE(p + 8);
    const nameLen = buffer.readUInt16LE(p + 26);
    const extraLen = buffer.readUInt16LE(p + 28);
    const dataStart = p + 30 + nameLen + extraLen;

    // If bit 3 set, sizes are in data descriptor after data; but central dir gave us sizes
    const compSize = entry.compressedSize;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buffer.length) return null;
    const comp = buffer.subarray(dataStart, dataEnd);
    if (method === 0) {
      return new Uint8Array(comp);
    }
    if (method === 8) {
      try {
        return inflateSync(new Uint8Array(comp));
      } catch {
        return null;
      }
    }
    // Unsupported method
    return null;
  }
  public parseOpenXml(
    buffer: Buffer,
    mime: string,
    kind: "docx" | "pptx" | "xlsx"
  ): DocSpecs {
    const entries = this.readCentralDirectory(buffer);
    const byName = new Map(entries.map(e => [e.name, e] as const));
    const core = byName.get("docProps/core.xml");
    const app = byName.get("docProps/app.xml");
    const coreXml = core ? this.readLocalFileData(buffer, core) : null;
    const appXml = app ? this.readLocalFileData(buffer, app) : null;

    let author: string | null = null;
    let subject: string | null = null;
    let keywords: string[] | null = null;
    let createdDate: string | null = null;
    let modifiedDate: string | null = null;

    if (coreXml) {
      const s = this.toSafeString(coreXml);
      const get = (tag: string) =>
        s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      author = get("dc:creator")?.[1]?.trim() ?? null;
      subject = get("dc:subject")?.[1]?.trim() ?? null;
      const kw = get("cp:keywords")?.[1]?.trim() ?? null;
      keywords = kw
        ? kw
            .split(/[,;]/)
            .map(x => x.trim())
            .filter(Boolean)
        : null;
      createdDate = get("dcterms:created")?.[1]?.trim() ?? null;
      modifiedDate = get("dcterms:modified")?.[1]?.trim() ?? null;
    }

    let pageCount: number | null = null;
    let wordCount: number | null = null;
    if (appXml) {
      const s = this.toSafeString(appXml);
      const getNum = (tag: string) => {
        const m = s.match(new RegExp(`<${tag}[^>]*>([0-9]+)<\\/${tag}>`));
        return m?.[1] ? Number.parseInt(m[1], 10) : null;
      };
      if (kind === "docx") {
        pageCount = getNum("Pages");
        wordCount = getNum("Words");
      } else if (kind === "pptx") {
        const slides = getNum("Slides");
        pageCount = slides ?? null;
      } else if (kind === "xlsx") {
        const sheets = getNum("Worksheets");
        pageCount = sheets ?? null;
      }
    }

    // Optional: quick text preview from primary document part (best effort)
    let textPreview: string | null = null;
    let extraKeywords = Array.of<string>();
    if (kind === "docx") {
      const docEntry = byName.get("word/document.xml");
      if (docEntry) {
        const data = this.readLocalFileData(buffer, docEntry);
        if (data) {
          const xml = this.toSafeString(data);
          // Extract text from w:t nodes
          const t = xml
            .replace(/<w:\w+[^>]*>/g, " ")
            .replace(/<\/w:\w+>/g, " ")
            .replace(/<\/?[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          textPreview = this.firstN(t, 280);
          if (textPreview) {
            const words = this.countWords(textPreview);
            wordCount ??= words;
          }
        }
      }
    } else if (kind === "xlsx") {
      // Count worksheets by listing entries and parse sheet names
      const worksheetCount = entries.filter(e =>
        e.name.startsWith("xl/worksheets/sheet")
      ).length;
      if (worksheetCount) pageCount = worksheetCount;

      const workbook = byName.get("xl/workbook.xml");
      let hasHiddenSheets = false;
      if (workbook) {
        const data = this.readLocalFileData(buffer, workbook);
        if (data) {
          const xml = this.toSafeString(data);
          const sheets = Array.from(
            xml.matchAll(/<sheet[^>]+name="([^"]+)"/g),
            m => m?.[1] ?? ""
          );
          if (sheets.length) extraKeywords = sheets;
          if (/state="(?:hidden|veryHidden)"/.test(xml)) hasHiddenSheets = true;
        }
      }

      // Use shared strings for preview and rough word count
      const sharedStrings = byName.get("xl/sharedStrings.xml");
      if (sharedStrings) {
        const data = this.readLocalFileData(buffer, sharedStrings);
        if (data) {
          const xml = this.toSafeString(data);
          const textNodes = Array.from(
            xml.matchAll(/<t[^>]*>([^<]+)<\/t>/g),
            m => m[1]
          );
          if (textNodes.length) {
            wordCount = textNodes.join(" ").split(/\s+/).filter(Boolean).length;
            const preview = textNodes.slice(0, 10).join(" ");
            textPreview = this.firstN(preview, 200);
          }
        }
      }

      // Analyze first few worksheets for dimensions and formulas
      let totalRows = 0;
      let hasFormulas = false;
      const worksheetEntries = entries.filter(
        e => e.name.startsWith("xl/worksheets/sheet") && e.name.endsWith(".xml")
      );
      for (const entry of worksheetEntries.slice(0, 3)) {
        const data = this.readLocalFileData(buffer, entry);
        if (!data) continue;
        const xml = this.toSafeString(data);
        const dim = xml.match(/<dimension\s+ref="([A-Z]+\d+):([A-Z]+\d+)"/);
        if (dim?.[2]) {
          const end = dim[2];
          const m = end.match(/^([A-Z]+)(\d+)$/);
          if (m?.[2]) {
            const row = Number.parseInt(m[2], 10);
            if (!Number.isNaN(row)) totalRows = Math.max(totalRows, row);
          }
        }
        if (!hasFormulas && (xml.includes("<f>") || xml.includes("<f ")))
          hasFormulas = true;
      }

      // Detect features from entry names
      const entryNames = new Set(entries.map(e => e.name));
      const hasPivotTables = entries.some(e => e.name.includes("pivotTable"));
      const hasCharts = entries.some(e => e.name.includes("/charts/"));
      const hasMacros = entryNames.has("xl/vbaProject.bin");
      const hasConnections = entryNames.has("xl/connections.xml");
      const hasCustomXml = entries.some(e => e.name.startsWith("customXml/"));

      if (hasHiddenSheets) extraKeywords.push("hidden-sheets");
      if (hasFormulas) extraKeywords.push("formulas");
      if (hasPivotTables) extraKeywords.push("pivot-tables");
      if (hasCharts) extraKeywords.push("charts");
      if (hasMacros) extraKeywords.push("macros");
      if (hasConnections) extraKeywords.push("connections");
      if (hasCustomXml) extraKeywords.push("custom-xml");

      // Use rows as lineCount if available
      if (totalRows > 0) {
        // Thread through via closure variable in return below using local capture
        // We'll set lineCount after keywords merge below
      }
    }

    return {
      type: "DOCUMENT",
      format: kind,
      mimeType: mime,
      pageCount,
      wordCount,
      lineCount: (() => {
        if (kind === "xlsx") {
          // recompute minimal rows using same small scan to avoid storing temp across branches
          const worksheetEntries = entries.filter(
            e =>
              e.name.startsWith("xl/worksheets/sheet") &&
              e.name.endsWith(".xml")
          );
          let totalRows = 0;
          for (const entry of worksheetEntries.slice(0, 3)) {
            const data = this.readLocalFileData(buffer, entry);
            if (!data) continue;
            const xml = this.toSafeString(data);
            const dim = xml.match(/<dimension\s+ref="([A-Z]+\d+):([A-Z]+\d+)"/);
            if (dim?.[2]) {
              const end = dim[2];
              const m = end.match(/^([A-Z]+)(\d+)$/);
              if (m?.[2]) {
                const row = Number.parseInt(m[2], 10);
                if (!Number.isNaN(row)) totalRows = Math.max(totalRows, row);
              }
            }
          }
          return totalRows || null;
        }
        return null;
      })(),
      language: null,
      encoding: null,
      author,
      subject,
      keywords: (() => {
        const base = keywords ?? [];
        return base.concat(extraKeywords).filter(Boolean).length
          ? base.concat(extraKeywords)
          : keywords;
      })(),
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: null,
      isLinearized: null,
      textPreview,
      createdDate,
      modifiedDate
    } satisfies DocSpecs;
  }
  protected async readBytes(stream: Readable) {
    return new Promise((resolve: (value: Buffer) => void, reject) => {
      const chunks = Array.of<Buffer>();
      let totalBytes = 0;

      const cleanup = () => {
        stream.removeAllListeners();
        stream.destroy();
      };

      stream.on("error", err => {
        cleanup();
        reject(err);
      });

      stream.on("data", (chunk: Buffer) => {
        const remaining = chunk.length - totalBytes;
        if (chunk.length <= remaining) {
          chunks.push(chunk);
          totalBytes += chunk.length;
        } else {
          // Take only what we need
          chunks.push(chunk.subarray(0, remaining));
          totalBytes = chunk.length;
        }

        if (totalBytes >= chunk.length) {
          cleanup();
          resolve(Buffer.concat(chunks));
        }
      });

      stream.on("end", () => {
        cleanup();
        resolve(Buffer.concat(chunks));
      });
    });
  }

  public async extractDocViaStream(stream: Readable, mime: string) {
    const header = await this.readBytes(stream);
    return this.getDocumentSpecsWorkup(header, mime);
  }
  public async extractDocViaPath(filePath: string, mime: string) {
    const stream = createReadStream(relative(process.cwd(), filePath));
    return await this.extractDocViaStream(stream, mime);
  }

  // public getDocumentSpecsWorkup(
  //   rawBuffer: Buffer<ArrayBufferLike>,
  //   mime: "application/pdf",
  //   filename?: string
  // ): DocSpecs<PdfImageAnalysisMetadata>;

  public getDocumentSpecsWorkup(
    buffer: Buffer<ArrayBufferLike>,
    mime: "application/pdf",
    fileName?: string
  ): DocSpecs<PdfImageAnalysisMeta>;
  public getDocumentSpecsWorkup(
    buffer: Buffer<ArrayBufferLike>,
    mime: string,
    fileName?: string
  ): DocSpecs<unknown>;
  public getDocumentSpecsWorkup(
    rawbuffer: Buffer<ArrayBufferLike>,
    mime: string,
    filename?: string
  ) {
    const buffer = rawbuffer;
    let ext = this.getExtFromFilename(filename);

    // PDF

    if (mime === "application/pdf") {
      ext = "pdf";
      return this.parsePdf(buffer, mime);
    } else if (
      buffer?.length >= 5 &&
      buffer.toString("latin1", 0, 5) === "%PDF-"
    ) {
      return this.parsePdf(buffer, "application/pdf");
    }

    // RTF
    if (
      mime === "application/rtf" ||
      (buffer?.length >= 5 && buffer.toString("latin1", 0, 5) === "{\\rtf")
    ) {
      ext = "rtf";
      return this.parseRtf(buffer, mime);
    }

    // OpenXML containers (docx, pptx, xlsx) start with PK\x03\x04 and have specific Content_Types
    const isZip = buffer?.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50;
    if (isZip) {
      const kindFromMime: Record<string, "docx" | "pptx" | "xlsx" | undefined> =
        {
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            "docx",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation":
            "pptx",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            "xlsx"
        };
      const kind =
        kindFromMime[mime] ??
        (ext === "docx"
          ? "docx"
          : ext === "pptx"
            ? "pptx"
            : ext === "xlsx"
              ? "xlsx"
              : undefined);
      if (kind) {
        ext = kind;
        return this.parseOpenXml(buffer, mime, kind);
      }
    }

    // Plain text-ish and code files
    if (mime in this.toExtObj) {
      const m = mime as keyof typeof this.toExtObj;
      ext = this.toExtObj[m][0];
      return this.parsePlainText(buffer, mime, filename);
    }

    // Legacy Office (doc/xls/ppt) or unknown binary: basic stub
    const fallbackFormat =
      ext === "doc"
        ? "doc"
        : ext === "xls"
          ? "xls"
          : ext === "ppt"
            ? "ppt"
            : "bin";
    return {
      type: "DOCUMENT",
      format: fallbackFormat,
      mimeType: mime,
      pageCount: null,
      wordCount: null,
      lineCount: null,
      language: null,
      encoding: null,
      author: null,
      subject: null,
      keywords: null,
      pdfVersion: null,
      isEncrypted: null,
      isSearchable: null,
      isLinearized: null,
      textPreview: null,
      createdDate: null,
      modifiedDate: null,
      metadata: {}
    } satisfies DocSpecs;
  }
}

export type CommonApplicationMimeTypes =
  | "application/pdf"
  | "application/rtf"
  | "application/json"
  | "application/xml"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/dash+xml"
  | "application/epub+zip"
  | "application/font-sfnt"
  | "application/gzip"
  | "application/java-archive"
  | "application/jsonc"
  | "application/jsonl"
  | "application/json5"
  | "application/ld+json"
  | "application/manifest+json"
  | "application/msword"
  | "application/node"
  | "application/octet-stream"
  | "application/ogg"
  | "application/sql"
  | "application/text"
  | "application/toml"
  | "application/vnd.amazon.ebook"
  | "application/vnd.apple.installer+xml"
  | "application/vnd.apple.mpegurl"
  | "application/vnd.apple.pkpass"
  | "application/vnd.json5"
  | "application/vnd.mozilla.xul+xml"
  | "application/vnd.ms-excel"
  | "application/vnd.ms-fontobject"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.oasis.opendocument.presentation"
  | "application/vnd.oasis.opendocument.spreadsheet"
  | "application/vnd.oasis.opendocument.text"
  | "application/vnd.rar"
  | "application/vnd.visio"
  | "application/wasm"
  | "application/x-7z-compressed"
  | "application/x-abiword"
  | "application/x-bzip"
  | "application/x-bzip2"
  | "application/x-cdf"
  | "application/x-csh"
  | "application/x-freearc"
  | "application/x-gzip"
  | "application/x-httpd-php"
  | "application/x-mdx"
  | "application/x-ndjson"
  | "application/x-python-code"
  | "application/x-sh"
  | "application/x-tar"
  | "application/x-zip-compressed"
  | "application/xhtml+xml"
  | "application/yaml"
  | "application/zip"
  | "text/css"
  | "text/csv"
  | "text/event-stream"
  | "text/html"
  | "text/javascript"
  | "text/markdown"
  | "text/plain"
  | "text/rust"
  | "text/typescript"
  | "text/vtt"
  | "text/x-c"
  | "text/x-c++"
  | "text/x-csharp"
  | "text/x-go"
  | "text/x-java"
  | "text/x-jsonl"
  | "text/x-php"
  | "text/x-python"
  | "text/x-ruby"
  | "text/x-script.python"
  | "text/x-tex"
  | "text/xml";

// type UIO = keyof typeof mimeToExt;

// type Filter<T> = T extends `text/${infer U}` ? `text/${U}` : never;

// type MMMM = Filter<UIO>;

// const OOOOOOOREAILY = (props: MMMM[]) => {
//   return [...props] as const;
// };
