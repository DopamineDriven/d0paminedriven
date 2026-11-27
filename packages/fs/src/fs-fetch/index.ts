import fsSync from "fs";
import { open, rename } from "fs/promises";
import { relative } from "path";
import type { Piece } from "@d0paminedriven/mimedown";
import { FsTmp } from "@/fs-tmp/index.ts";
import { sniffFromRanges } from "@d0paminedriven/mimedown";

export class FsFetch extends FsTmp {
  constructor(public cwd: string) {
    super((cwd ??= process.cwd()));
  }
  public async assetToBuffer<const T extends string>(path: T) {
    const [fetcher] = await Promise.all([
      fetch(path).then(t => t.arrayBuffer())
    ]);
    const mime = this.getMimeTypeForPath(path);

    const b64encodedData =
      `data:${mime};base64, ${Buffer.from(fetcher).toString("base64")}` as const;
    // fallback to txt
    const extension = this.assetType(path) ?? "txt";
    return {
      b64encodedData,
      extension
    } as const;
  }

  public async assetToBufferView<const T extends string>(path: T) {
    const response = await fetch(path, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.statusText}`);
    }
    const reader = response.body?.getReader();
    if (reader) {
      const chunks = Array.of<Uint8Array>();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      // Concatenate all chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const completeBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        completeBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      const mime = this.getMimeTypeForPath(path);
      const b64encodedData = `data:${mime};base64, ${Buffer.from(completeBuffer).toString("base64")}`;
      const extension = this.assetType(path);
      return { b64encodedData, extension } as const;
    } else {
      // Fallback: use arrayBuffer if no stream is available.
      const arrayBuffer = await response.arrayBuffer();
      const mime = this.getMimeTypeForPath(path);
      const b64encodedData = `data:${mime};base64, ${Buffer.from(arrayBuffer).toString("base64")}`;
      const extension = this.assetType(path);
      return { b64encodedData, extension } as const;
    }
  }

  /**
   *
   * @param inputUrl remote url to fetch data from
   * @param outputPath desired output path relative to the cwd
   * @param useDetectedExtension optional, defaults to true
   *
   * if `useDetectedExtension` is false you must include the file extension in your output path &rarr;
   *
   *  🚫 'public/assets/image-1'
   *
   *  ✅ 'public/assets/image-1.png'
   */
  public async fetchRemoteWriteLocal<
    const I extends string,
    const O extends string
  >(inputUrl: I, outputPath: O, useDetectedExtension = true) {
    try {
      const result = await this.assetToBufferView(inputUrl);
      const cleanData = this.cleanDataUrl(result.b64encodedData);
      const formattedPath = useDetectedExtension
        ? `${outputPath}.${result.extension}`
        : outputPath;
      if (/\./g.test(formattedPath) === false) {
        throw new Error(
          "either add false as the third argument in `fetchRemoteWriteLocal` (input, output, use-detected-file-extension) or provide an output path without a file extension"
        );
      }
      this.withWs(formattedPath, Buffer.from(cleanData, "base64"));
    } catch (err) {
      return console.error(err);
    }
  }

  private knownToBlockHead(inputUrl: string) {
    if (inputUrl.startsWith("https://github.com")) {
      return "GET" as const;
    } else if (inputUrl.startsWith("https://raw.githubusercontent.com")) {
      return "GET" as const;
    } else {
      return "HEAD" as const;
    }
  }

  public getUrlExt(url: string) {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot === -1 || lastDot === pathname.length - 1) return null;
    return pathname.slice(lastDot + 1).toLowerCase();
  }

  private fuzzyExtEquality(a: string, b: string) {
    const aNorm = a.toLowerCase();
    const bNorm = b.toLowerCase();

    const distance = this.calculateLD(aNorm, bNorm);
    const maxLen = Math.max(aNorm.length, bNorm.length) || 1;
    const normalized = distance / maxLen;

    return normalized <= 0.34;
  }
  private async sniffFile(path: string) {
    const file = await open(path, "r");
    try {
      const { size } = await file.stat();
      const pieces = Array.of<Piece>();
      const take = async (offset: number, length: number) => {
        const bytes = Buffer.alloc(
          Math.max(0, Math.min(length, size - offset))
        );
        const { bytesRead } = await file.read(
          bytes,
          0,
          bytes.byteLength,
          offset
        );
        pieces.push({ offset, bytes: bytes.subarray(0, bytesRead) });
      };
      await take(0, 4096);
      let found = sniffFromRanges(pieces, size, { retryOnUnknown: true });
      for (let asked = 0; found.needs !== null && asked < 8; asked++) {
        const { offset, length, fromEnd } = found.needs;
        await take(fromEnd ? Math.max(0, size - offset) : offset, length);
        found = sniffFromRanges(pieces, size, { retryOnUnknown: true });
      }
      return { ...found, size } as const;
    } finally {
      await file.close();
    }
  }

  /**
   *
   * @param inputUrl remote url to fetch data from
   * @param outputPath desired output path relative to the cwd
   * @param useDetectedExtension optional, defaults to true
   *
   * if `useDetectedExtension` is false you must include the file extension in your output path &rarr;
   *
   *  🚫 'public/assets/image-1'
   *
   *  ✅ 'public/assets/image-1.png'
   *
   * @description
   * This method is designed for all files regardless of size, but especially for
   * larger files that may not fit into memory (it intelligently determines the best approach on the fly)
   * It streams the data directly to disk for files of all sizes instead of loading it all into memory
   */
  public async fetchRemoteWriteLocalLargeFiles<
    const I extends string,
    const O extends string
  >(inputUrl: I, outputPathI: O, useDetectedExtension = true, verbose = false) {
    if (!URL.canParse(inputUrl))
      throw new Error(`invalid URL ${inputUrl} is unable to be parsed`);
    try {
      const res = await fetch(inputUrl);
      if (!res.ok || !res.body) {
        throw new Error(
          `Failed to fetch asset: ${res.status} ${res.statusText}`
        );
      }

      // Onto disk first, under a name that says it is not finished.
      const partial = `${outputPathI}.part`;
      this.generateDirIfDNE(this.pathHandler(partial), {
        recursive: true
      });
      const writeStream = fsSync.createWriteStream(relative(this.cwd, partial));
      const { promise, reject, resolve } = Promise.withResolvers();
      writeStream.on("finish", () => resolve({}));
      writeStream.on("error", () => reject({}));

      const reader = res.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          writeStream.write(value);
        }
        writeStream.end();
      };

      await pump();
      await promise.then(() => {});

      // The bytes are on disk, time to sniff.
      const { evidence, ext, mime, parser, retry, topLevel, size } =
        await this.sniffFile(relative(this.cwd, partial));

      const { unit, value } = this.autoFileSizeRaw(size);
      if (verbose) {
        console.log({
          extension: ext,
          topLevelMime: topLevel,
          mime,
          parser,
          retry,
          evidence,
          size: `${value} ${unit}`
        });
      }
      let formattedPath: string;
      if (useDetectedExtension) {
        formattedPath = `${outputPathI}.${ext}`;
      } else {
        const lastDot = outputPathI.lastIndexOf(".");
        if (lastDot === 1 || lastDot === -1) {
          formattedPath = `${outputPathI}.${ext}`;
        }
        const outputPathExt = outputPathI.slice(
          outputPathI.lastIndexOf(".") + 1
        );
        const closeness = this.fuzzyExtEquality(ext, outputPathExt);
        if (closeness === true) {
          formattedPath = outputPathI;
        } else {
          formattedPath = outputPathI.replace(outputPathExt, ext);
        }
      }

      await rename(
        relative(this.cwd, partial),
        relative(this.cwd, formattedPath)
      );
      return;
    } catch (err) {
      console.error(`[fetchRemoteWriteLocalLargeFiles error]:`, err);
    }
  }
}
