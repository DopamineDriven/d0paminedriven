import { execSync } from "child_process";
import fsSync from "fs";
import fsAsync from "fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "path";
import * as dotenv from "dotenv";
import expand from "dotenv-expand";
import sharp from "sharp";
import type {
  BoxInfo,
  ExecuteCommandProps,
  ImageSize,
  MkDirSyncOptions,
  ReadDirOptions,
  RmDirOptions,
  SizeOpts,
  Unit,
  WriteFileAsyncDataUnion,
  WriteFileAsyncOptions,
  WriteStreamDataShape,
  WriteStreamOptions
} from "@/types/index.ts";
import { MimeService } from "@/mime/index.ts";
import { unitsObj } from "@/types/index.ts";

dotenv.config();

export default class Fs extends MimeService {
  constructor(public cwd: string) {
    super();
    cwd ??= process.cwd();
  }
  private get myEnv() {
    return dotenv.config({ processEnv: {} });
  }

  public get tmpDir() {
    return tmpdir();
  }

  public get tmpDirRelative() {
    return relative(this.cwd, tmpdir());
  }

  public parseDotEnv() {
    return expand.expand(this.myEnv);
  }

  /**
   *
   * @param target path to the file or directory to check for existence
   * @returns true if the file or directory exists, false otherwise
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * const exists = fs.exists("my-file.txt");
   * console.log(exists); // true if the file exists, false otherwise
   * ```
   * @description
   * This method checks if a file or directory exists at the specified path input
   *
   * Additional Note:
   *
   * say you have a directory that begins with a dot, such as `.turbo`;
   *
   * in this scenario, both `./.turbo` and `.turbo` will return true if the directory exists
   *
   */
  public exists<const T extends string>(target: T) {
    if (!/\//gm.test(target)) {
      if (/\./g.test(target)) {
        return fsSync.existsSync(resolve(join(this.cwd, target)));
      } else {
        const statsSync = fsSync.statSync(resolve(join(this.cwd, target)), {
          throwIfNoEntry: false
        });
        const isDir = statsSync?.isDirectory();
        if (isDir) {
          return isDir;
        } else return false;
      }
    } else {
      if (/\./g.test(target)) {
        return fsSync.existsSync(relative(this.cwd ?? process.cwd(), target));
      } else {
        const statsSync = fsSync.statSync(relative(this.cwd, target), {
          throwIfNoEntry: false
        });
        const isDir = statsSync?.isDirectory();
        if (isDir) {
          return isDir;
        } else return false;
      }
    }
  }

  /**
   *
   * @param ms milliseconds to wait
   * @returns a promise that resolves after the specified number of milliseconds
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * await fs.wait(1000); // waits for 1 second
   * console.log("Done waiting!");
   * ```
   *
   * Alternatively, you can use it like this:
   * ```ts
   * const fs = new Fs(process.cwd());
   * fs.wait(1000).then(() => { // waits for 1 second
   *   console.log("Done waiting!");
   *   // do something after waiting
   * });
   * ```
   *
   * @description
   * This method is useful for delaying execution in asynchronous code, such as when you need to wait for a file operation to complete or when you want to introduce a delay in a loop.
   */
  public wait<T extends number>(ms: T) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  /**
   * Handles an array or readonly array of strings and/or Buffers, converting Buffers to strings
   * @param arr An array or readonly array of strings and/or Buffers
   * @returns An array of strings with Buffers converted to UTF-8 strings.
   */
  public handleBuffStrArrUnion<
    const T extends (string | Buffer)[] | readonly (string | Buffer)[]
  >(arr: T) {
    return arr.map(v =>
      Buffer.isBuffer(v) ? Buffer.from(v).toString("utf-8") : v
    );
  }

  public isRootPathTargeted<const T extends string>(path: T) {
    if (/^(?:\.\/|\.|\/|root|\.\.\/|~\/\.?|cwd|\.\/\.)$/g.test(path)) {
      return true;
    } else return false;
  }

  /**
   *
   * @param path path to the directory relative to the cwd
   * @param options options for reading the directory, defaults to recursive
   *
   * The following two examples are equivalent:
   *
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * const files = fs.readDir("./my-directory", { recursive: true });
   * console.log(files);
   * ```
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * const files = fs.readDir("my-directory", { recursive: true });
   * console.log(files);
   * ```
   *
   * @returns an array of strings representing the contents of the directory
   */
  public readDir<const T extends string>(
    path: T,
    options: ReadDirOptions = {
      recursive: true,
      withFileTypes: false,
      encoding: "utf-8"
    }
  ) {
    if (this.isRootPathTargeted(path)) {
      return this.handleBuffStrArrUnion(
        fsSync.readdirSync(resolve(join(this.cwd, "./")), { ...options })
      );
    } else {
      return this.handleBuffStrArrUnion(
        fsSync.readdirSync(
          relative((this.cwd ??= process.cwd()), path),
          options
        ) satisfies (string | Buffer)[]
      );
    }
  }

  public executeCommand = <const T extends string>({
    command,
    ...options
  }: ExecuteCommandProps<T>) =>
    Buffer.from(execSync(command, { ...options }).toJSON().data).toString(
      "utf-8"
    );

  public existsSync<const T extends string>(path: T) {
    return this.exists(path);
  }

  public pathHandler<const T extends string>(path: T) {
    return /\//g.test(path) === true
      ? path.split(/([/])/gim).reverse().slice(2).reverse().join("")
      : path;
  }

  public mkdirSync<const T extends string>(
    path: T,
    options?: MkDirSyncOptions
  ) {
    return fsSync.mkdirSync(relative(this.cwd, path), options);
  }

  private units = unitsObj;
  private u = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

  public autoFileSizeRaw(size: number | bigint) {
    let s = typeof size === "bigint" ? Number(size) : size;
    let i = 0;
    while (s >= 1024 && i < this.u.length - 1) {
      s /= 1024;
      i++;
    }
    return { value: s, unit: this.u[i] };
  }

  public getSize<const S extends Unit | Lowercase<Unit> | "auto">(
    size: number | bigint,
    target: S,
    opts: SizeOpts = { decimals: 4, includeUnits: true }
  ) {
    const { decimals, includeUnits } = opts;

    if (target === "auto") {
      const { value, unit } = this.autoFileSizeRaw(size);
      const rounded = value.toFixed(decimals);
      return includeUnits ? `${rounded} ${unit}` : Number.parseFloat(rounded);
    }

    const key = (
      target as Exclude<S, "auto">
    ).toUpperCase() as keyof typeof this.units;
    const exp = this.units[key];
    const divisor =
      typeof size === "bigint" ? 1024n ** BigInt(exp) : 1024 ** exp;
    let v = 0;
    if (typeof size === "bigint" || typeof divisor === "bigint") {
      if (typeof size === "bigint" && typeof divisor === "bigint")
        v = Number(size / divisor);
      else if (typeof size !== "bigint" && typeof divisor === "bigint")
        v = size / Number(divisor);
      else if (typeof size === "bigint" && typeof divisor !== "bigint")
        v = Number(size) / divisor;
    } else if (typeof size === "number" && typeof divisor === "number") {
      v = size / divisor;
    }
    const rounded = v.toFixed(decimals);

    return includeUnits
      ? (`${rounded} ${key}` as const)
      : Number.parseFloat(rounded);
  }

  public fileSizeMb<const T extends string>(path: T) {
    return fsSync.statSync(relative(this.cwd, path)).size / (1024 * 1024);
  }

  public fileSize<
    const T extends string,
    const S extends Unit | Lowercase<Unit> | "auto"
  >(path: T, target: S, opts?: SizeOpts) {
    if (!this.exists(path)) throw new Error(`path ${path} does not exist`);
    else {
      return this.getSize(
        fsSync.statSync(relative(this.cwd, path)).size,
        target,
        opts
      );
    }
  }

  public generateDirIfDNE<const T extends string>(
    path: T,
    options?: MkDirSyncOptions
  ) {
    if (this.existsSync(path)) return;
    else {
      return this.mkdirSync(path, options);
    }
  }

  public withWs<const T extends string>(
    path: T,
    data: WriteStreamDataShape,
    options?: WriteStreamOptions
  ) {
    try {
      if (/\//g.test(path) === true) {
        return this.generateDirIfDNE(this.pathHandler(path), {
          recursive: true
        });
      } else return path;
    } catch (error) {
      console.error(
        `[withWs error]: `.concat(
          typeof error === "string" ? error : JSON.stringify(error, null, 2)
        )
      );
    } finally {
      return fsSync
        .createWriteStream(
          relative(this.cwd ?? process.cwd(), path),
          typeof options !== "undefined"
            ? typeof options === "object"
              ? options
              : options
            : { autoClose: true }
        )
        .write(Buffer.from(Buffer.from(data).toJSON().data));
    }
  }

  public writeFileAsync = async <const T extends string>(
    path: T,
    data: WriteFileAsyncDataUnion,
    options?: WriteFileAsyncOptions
  ) => {
    try {
      if (/\//g.test(path) === true)
        return this.generateDirIfDNE(this.pathHandler(path), {
          recursive: true
        });
      else return path;
    } catch (error) {
      console.error(
        `[writeFileAsync error]: `.concat(
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error, null, 2)
        )
      );
    } finally {
      return await fsAsync.writeFile(
        relative(this.cwd ?? process.cwd(), path),
        Buffer.from(Buffer.from(data).toJSON().data),
        options
      );
    }
  };

  public async unlink<const P extends string>(path: P) {
    if (this.existsSync(path)) {
      return await fsAsync.unlink(relative(this.cwd, path));
    } else {
      throw new Error(`input path ${path} does not exist`);
    }
  }

  public rmFile<const FP extends string>(filePath: FP) {
    if (this.exists(filePath)) {
      if (this.isRootPathTargeted(filePath)) {
        fsSync.rmSync(resolve(join(this.cwd, filePath)));
      } else fsSync.rmSync(resolve(this.cwd, filePath));
    } else return;
  }

  public async rmdir<const D extends string>(dir: D, options?: RmDirOptions) {
    const resolved = relative(this.cwd, dir);

    if (this.exists(dir)) {
      return fsAsync.rmdir(relative(this.cwd, dir), options);
    } else {
      // Either doesn't exist or is not a directory
      throw new Error(`directory ${resolved} does not exist`);
    }
  }

  public rmDirSync<const D extends string>(dir: D) {
    const resolved = resolve(this.cwd, dir);
    if (this.exists(dir)) {
      return fsSync.rm(resolved, { force: true, recursive: true }, err => {
        if (err?.message) {
          console.error(err?.message);
        }
      });
    } else {
      throw new Error(`directory ${resolved} does not exist`);
    }
  }
  public fileToBuffer = <const T extends string>(path: T) =>
    Buffer.from(
      fsSync.readFileSync(relative(this.cwd ?? process.cwd(), path)).toJSON()
        .data
    );

  public fileToBufferAsync = async <const T extends string>(path: T) => {
    return await fsAsync.readFile(relative(this.cwd, path));
  };

  public dirContainsDir<const From extends string, const To extends string>(
    readDir: From,
    targetDir: To,
    options?: ReadDirOptions
  ) {
    return this.readDir(readDir, options)
      .filter(t => t.split(".").length === 1)
      .includes(targetDir);
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
    console.log(Object.fromEntries(Array.from(response.headers.entries())));
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

  public formatHelper<const T extends string>(f: T) {
    if (/([A-Za-z]+-[A-Za-z]+)/g.test(f) === true) {
      const formatting = f
        .split(/-/g)
        .map(v => v.substring(0, 1).toUpperCase().concat(v.substring(1)))
        .join(" ");
      return formatting;
    } else return f.substring(0, 1).toUpperCase().concat(f.substring(1));
  }

  public cleanDataUrl<const C extends string>(props: C) {
    return props.replace(
      /^data:(?:image|application|haptics|video|text|font|model|audio|multipart)\/[A-Za-z0-9+-.]+(?:;[^,]+)*;base64,/i,
      ""
    );
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
   * This method is designed for large files that may not fit into memory.
   * It streams the data directly to disk instead of loading it all into memory.
   */
  public async fetchRemoteWriteLocalLargeFiles<
    const I extends string,
    const O extends string
  >(inputUrl: I, outputPathI: O, useDetectedExtension = true) {
    const MAX_SAFE_IN_MEMORY_MB = 100;

    try {
      const isGithubRaw = inputUrl.startsWith(
        "https://raw.githubusercontent.com"
      );
      const head = await fetch(inputUrl, {
        method: isGithubRaw ? "GET" : "HEAD"
      });
      const contentLength = head.headers.get("content-length");
      const fileSizeMb = contentLength
        ? parseInt(contentLength, 10) / (1024 * 1024)
        : null;
      let outputPath = outputPathI;
      const assetTypeViaUrl = this.assetType(inputUrl);
      const contentType = (head.headers.get("content-type") ??
        "application/octet-stream") as keyof typeof this.toExtObj;
      const formattedPath = useDetectedExtension
        ? `${outputPath}.${typeof assetTypeViaUrl === "undefined" ? this.toExtObj[contentType][0] : assetTypeViaUrl}`
        : outputPath;

      this.generateDirIfDNE(this.pathHandler(formattedPath), {
        recursive: true
      });

      // stream directly to disk for large files
      if (fileSizeMb !== null && fileSizeMb > MAX_SAFE_IN_MEMORY_MB) {
        const res = await fetch(inputUrl);
        if (!res.ok || !res.body) {
          throw new Error(`Failed to fetch asset: ${res.statusText}`);
        }

        const writeStream = fsSync.createWriteStream(
          relative(this.cwd ?? process.cwd(), formattedPath)
        );
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
        return;
      }

      // else use original base64 → buffer method
      const result = await this.assetToBufferView(inputUrl);
      const cleanedData = this.cleanDataUrl(result.b64encodedData);
      this.withWs(formattedPath, Buffer.from(cleanedData, "base64"));
    } catch (err) {
      console.error(`[fetchRemoteWriteLocalLargeFiles error]:`, err);
    }
  }

  private findBox(
    buffer: Buffer,
    type: string,
    start = 0,
    end: number = buffer.length
  ): BoxInfo | null {
    let pos = start;
    while (pos < end) {
      let boxSize = buffer.readUInt32BE(pos);
      let boxType = buffer.toString("ascii", pos + 4, pos + 8);
      let hdrSize = 8;
      if (boxSize === 1) {
        boxSize = Number(buffer.readBigUInt64BE(pos + 8));
        hdrSize = 16;
      } else if (boxSize === 0) {
        boxSize = end - pos;
      }
      if (boxType === type) {
        return { pos: pos + hdrSize, size: boxSize - hdrSize };
      }
      pos += boxSize;
    }
    return null;
  }

  public async getImageSize(filePath: string) {
    const buffer = await this.fileToBufferAsync(filePath);
    // PNG: Signature is 89 50 4E 47 0D 0A 1A 0A, width/height in IHDR at offsets 16/20 (big-endian)
    if (
      buffer?.length >= 24 &&
      buffer?.[0] === 0x89 &&
      buffer?.[1] === 0x50 &&
      buffer?.[2] === 0x4e &&
      buffer?.[3] === 0x47 &&
      buffer?.[4] === 0x0d &&
      buffer?.[5] === 0x0a &&
      buffer?.[6] === 0x1a &&
      buffer?.[7] === 0x0a
    ) {
      if (
        buffer.readUint32BE(8) !== 13 ||
        buffer?.[12] !== 0x49 ||
        buffer?.[13] !== 0x48 ||
        buffer?.[14] !== 0x44 ||
        buffer?.[15] !== 0x52
      ) {
        throw new Error("IHDR Chunk of png not found or incorrect.");
      }
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
        type: "png"
      } satisfies ImageSize;
    }

    // JPEG: Starts with FF D8, dimensions in SOF marker (FF C0-FF CF, excluding some)
    if (buffer.length >= 10 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let pos = 2;
      while (pos < buffer.length - 10) {
        if (buffer[pos] !== 0xff) {
          throw new Error("Invalid JPEG file");
        }
        const marker = buffer[pos + 1];
        if (marker === 0xda) break; // Start of Scan, no more headers
        const segmentSize = buffer.readUInt16BE(pos + 2);
        if (!marker) {
          throw new Error("no marker for jpeg");
        }
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          // Valid SOF marker with dimensions
          return {
            width: buffer.readUInt16BE(pos + 7),
            height: buffer.readUInt16BE(pos + 5),
            type: "jpeg"
          } satisfies ImageSize;
        }
        pos += segmentSize + 2;
      }
      throw new Error("No dimensions found in JPEG file");
    }

    // GIF: Signature GIF87a or GIF89a, width/height at offsets 6/8 (little-endian)
    const gifHeader = buffer.toString("ascii", 0, 6);
    if (
      buffer.length >= 10 &&
      (gifHeader === "GIF87a" || gifHeader === "GIF89a")
    ) {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8),
        type: "gif"
      } satisfies ImageSize;
    }

    // BMP: Signature BM, width/height at offsets 18/22 (little-endian, height can be negative for top-down)
    if (buffer.length >= 26 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return {
        width: buffer.readInt32LE(18),
        height: Math.abs(buffer.readInt32LE(22)),
        type: "bmp"
      } satisfies ImageSize;
    }

    // WebP: RIFF container with WEBP, then VP8/VP8L/VP8X chunks
    if (
      buffer.length >= 30 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      const chunkType = buffer.toString("ascii", 12, 16);
      if (chunkType === "VP8X") {
        let widthSubtractOne = 0;
        let heightSubtractOne = 0;
        if (buffer?.[24] && buffer?.[25] && buffer?.[26]) {
          widthSubtractOne =
            buffer[24] | (buffer[25] << 8) | (buffer[26] << 16);
        }
        if (buffer?.[27] && buffer?.[28] && buffer?.[29]) {
          heightSubtractOne =
            buffer[27] | (buffer[28] << 8) | (buffer[29] << 16);
        }
        // Extended format

        return {
          width: widthSubtractOne + 1,
          height: heightSubtractOne + 1,
          type: "webp"
        } satisfies ImageSize;
      } else if (chunkType === "VP8 ") {
        // Lossy simple
        const dataStart = 20;
        if (
          buffer[dataStart + 3] !== 0x9d ||
          buffer[dataStart + 4] !== 0x01 ||
          buffer[dataStart + 5] !== 0x2a
        ) {
          throw new Error("Invalid VP8 keyframe");
        }
        const width = buffer.readUInt16LE(dataStart + 6) & 0x3fff;
        const height = buffer.readUInt16LE(dataStart + 8) & 0x3fff;
        return {
          width,
          height,
          type: "webp"
        } satisfies ImageSize;
      } else if (chunkType === "VP8L") {
        // Lossless simple
        const dataStart = 20;
        if (buffer[dataStart] !== 0x2f) {
          throw new Error("Invalid VP8L signature");
        }
        const bits = buffer.readUInt32LE(dataStart + 1);
        if (bits >>> 29 !== 0) {
          throw new Error("Invalid VP8L version");
        }
        const width = 1 + (bits & 0x3fff);
        const height = 1 + ((bits >> 14) & 0x3fff);
        return {
          width,
          height,
          type: "webp"
        } satisfies ImageSize;
      }
      throw new Error("Unsupported WebP chunk");
    }

    // AVIF: ISOBMFF with ftyp avif/avis, dimensions in meta > iprp > ipco > ispe
    if (buffer.length >= 32 && buffer.toString("ascii", 4, 8) === "ftyp") {
      const ftyp = this.findBox(buffer, "ftyp");
      if (!ftyp) throw new Error("Invalid AVIF: No ftyp");
      const brands = buffer.toString("ascii", ftyp.pos, ftyp.pos + ftyp.size);
      if (!brands.includes("avif") && !brands.includes("avis"))
        throw new Error("Not an AVIF file");

      const meta = this.findBox(buffer, "meta");
      if (!meta) throw new Error("Invalid AVIF: No meta");
      const metaSubStart = meta.pos + 4; // Skip version + flags
      const metaSubEnd = meta.pos + meta.size;

      const iprp = this.findBox(buffer, "iprp", metaSubStart, metaSubEnd);
      if (!iprp) throw new Error("Invalid AVIF: No iprp");
      const ipco = this.findBox(buffer, "ipco", iprp.pos, iprp.pos + iprp.size);
      if (!ipco) throw new Error("Invalid AVIF: No ipco");
      const ispe = this.findBox(buffer, "ispe", ipco.pos, ipco.pos + ipco.size);
      if (!ispe) throw new Error("Invalid AVIF: No ispe");

      if (buffer[ispe.pos] !== 0) throw new Error("Invalid ispe version");
      const width = buffer.readUInt32BE(ispe.pos + 4);
      const height = buffer.readUInt32BE(ispe.pos + 8);
      return {
        width,
        height,
        type: "avif"
      } satisfies ImageSize;
    }

    throw new Error("Unsupported image format or invalid file");
  }

  /**
   *
   * @access package-private
   *
   * work in progress, for internal package maintainer use only
   */
  // USE fluent-ffmpeg for video/animated image transforms (apng, etc)
  // https://www.npmjs.com/package/fluent-ffmpeg
  // https://www.npmjs.com/package/@types/fluent-ffmpeg
  public async imageTransform<
    const F extends
      | "webp"
      | "avif"
      | "jpg"
      | "png"
      | "tif"
      | "tiff"
      | "jp2"
      | "jpeg"
  >({
    format,
    target,
    quality = 80,
    tint,
    resize
  }: {
    format: F;
    target: Buffer<ArrayBuffer>;
    quality?: number;
    tint?:
      | string
      | {
          r?: number | undefined;
          g?: number | undefined;
          b?: number | undefined;
          alpha?: number | undefined;
        };
    resize?: {
      widthOrOptions?: number | sharp.ResizeOptions | null;
      height?: number | null;
      options?: sharp.ResizeOptions;
    };
  }) {
    if (tint && !resize) {
      return await sharp(target)
        .toFormat(format, { quality })
        .tint(tint)
        .toBuffer();
    } else if (!tint && resize) {
      return await sharp(target)
        .toFormat(format, { quality })
        .resize(resize.widthOrOptions, resize.height, resize.options)
        .toBuffer();
    } else if (tint && resize) {
      return await sharp(target)
        .toFormat(format, { quality })
        .tint(tint)
        .resize(resize.widthOrOptions, resize.height, resize.options)
        .toBuffer();
    } else {
      return await sharp(target).toFormat(format, { quality }).toBuffer();
    }
  }

  /**
   * Write data to a file in the system's tmp directory
   * @param filename The filename (can include subdirectories like "img-probe/file.txt")
   * @param data The data to write
   * @param options Optional write stream options
   * @returns The full path to the written file
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * const tmpPath = fs.writeTmp("session-data.json", JSON.stringify(data));
   * // Or with a subdirectory:
   * fs.writeTmp("img-probe/output.png", imageBuffer);
   * ```
   */
  public writeTmp<const F extends string>(
    filename: F,
    data: WriteStreamDataShape,
    options?: WriteStreamOptions
  ) {
    const fullPath = resolve(this.tmpDir, filename);
    Promise.resolve(this.withWs(fullPath, data, options));
    // if (stream && typeof stream !== 'string') {
    //   stream.write(data);
    //   stream.end();
    // }
  }

  /**
   * Read a file from the tmp directory
   * @param filename The filename to read (can include subdirectories)
   * @returns Buffer containing the file data
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * const data = fs.readTmp("session-data.json");
   * const parsed = JSON.parse(data.toString("utf-8"));
   * ```
   */
  public readTmp<const F extends string>(filename: F) {
    const fullPath = resolve(this.tmpDir, filename);
    if (!this.exists(fullPath)) {
      throw new Error(`Tmp file not found: ${filename}`);
    }
    return this.fileToBuffer(fullPath);
  }

  /**
   * Scan the tmp directory for files matching a pattern
   * @param pattern Optional pattern to filter files (e.g., "img-probe")
   * @param options Options for directory reading (defaults to non-recursive to avoid permission issues)
   * @returns Array of matching file paths relative to tmp directory
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * // Get all img-probe files
   * const imgFiles = fs.scanTmp("img-probe");
   * // Get all files in tmp (non-recursive)
   * const allFiles = fs.scanTmp();
   * ```
   */
  public scanTmp(
    pattern?: string | RegExp,
    options: ReadDirOptions = {
      recursive: false,
      withFileTypes: false,
      encoding: "utf-8"
    }
  ) {
    const dirs = resolve(this.tmpDir);
    const tmpContents = this.readDir(dirs, options);

    if (!pattern) {
      return tmpContents;
    }
    if (typeof pattern ==="string") {
      return tmpContents.filter((t) => t.includes(pattern));
    }
    return tmpContents.filter(path => {
      // const _filename = path.includes("/")
      //   ? (path.split("/")?.pop() ?? path)
      //   : path;
      return  pattern.test(path);
    });
  }

  /**
   * Extract specific files from tmp directory to a target location
   * @param pattern Pattern to match files (e.g., "img-probe")
   * @param targetDir Target directory to extract files to
   * @param options Options for extraction behavior
   * @returns Array of extracted file paths
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * // Extract all img-probe files to ./output
   * const extracted = fs.extractFromTmp("img-probe", "./output");
   * // Extract with custom behavior
   * fs.extractFromTmp("session-", "./sessions", {
   *   preserveStructure: true,
   *   cleanupAfter: true
   * });
   * ```
   */
  public extractFromTmp(
    pattern: string,
    targetDir: string,
    options?: {
      preserveStructure?: boolean;
      cleanupAfter?: boolean;
      overwrite?: boolean;
    }
  ) {
    const {
      preserveStructure = false,
      cleanupAfter = false,
      overwrite = true
    } = options ?? {};

    const matchingFiles = this.scanTmp(pattern);
    const extracted: string[] = [];

    for (const file of matchingFiles) {
      const sourcePath = resolve(this.tmpDir, file);
      const lastSegment = file.includes("/") ? file.split("/").pop() : file;
      if (!lastSegment) continue;
      const targetPath = preserveStructure
        ? resolve(targetDir, file)
        : resolve(targetDir, lastSegment);

      if (this.exists(targetPath) && !overwrite) {
        console.warn(`Skipping existing file: ${targetPath}`);
        continue;
      }

      const data = this.fileToBuffer(sourcePath);
      this.withWs(targetPath, data);
      extracted.push(targetPath);

      if (cleanupAfter) {
        this.rmFile(sourcePath);
      }
    }

    return extracted;
  }

  /**
   * Clean up tmp files matching a pattern
   * @param pattern Pattern to match files for deletion
   * @param maxAge Optional max age in milliseconds (only delete files older than this)
   * @returns Number of files removed
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * // Remove all img-probe files
   * fs.cleanupTmp("img-probe");
   * // Remove session files older than 1 hour
   * fs.cleanupTmp("session-", 60 * 60 * 1000);
   * ```
   */
  public cleanupTmp(pattern: string, maxAge?: number) {
    const matchingFiles = this.scanTmp(pattern);
    let removed = 0;

    for (const file of matchingFiles) {
      const fullPath = resolve(this.tmpDir, file);

      try {
        const stats = fsSync.statSync(fullPath);

        if (maxAge) {
          const age = Date.now() - stats.mtimeMs;
          if (age < maxAge) {
            continue;
          }
        }

        if (stats.isDirectory()) {
          this.rmDirSync(fullPath);
        } else {
          this.rmFile(fullPath);
        }
        removed++;
      } catch (err) {
        console.warn(`Failed to remove tmp file ${file}:`, err);
      }
    }

    return removed;
  }

  public rmTmpFile<const V extends string>(filename: V){
    const tmpPath = resolve(this.tmpDir, filename);

    this.rmFile(tmpPath);
}

  /**
   * Generate a unique tmp filename with optional prefix
   * @param prefix Optional prefix for the filename
   * @param extension Optional file extension (without dot)
   * @returns Unique filename
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * const filename = fs.uniqueTmpName("img-probe", "png");
   * // Returns: "img-probe-1701234567890-a3b2c1.png"
   * ```
   */
  public uniqueTmpName(prefix?: string, extension?: string) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const parts = [prefix ?? "tmp", timestamp, random].join("-");

    return extension ? `${parts}.${extension}` : parts;
  }

  /**
   * Async generator for cleaning tmp files with batched removal
   * @param pattern Pattern to match files for deletion
   * @param batchSize Number of files to remove per batch (default 10)
   * @yields Progress information during cleanup
   * @returns Final cleanup summary
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * // Clean up with progress tracking
   * for await (const progress of fs.cleanTmpGenerator("session-", 25)) {
   *   console.log(progress);
   * }
   * ```
   */
  public async *cleanTmpGenerator(pattern: string | RegExp, batchSize = 10) {
    const files = this.scanTmp(pattern);
    
    // Use arrToArrOfArrs for effortless batching!
    const batches = await this.arrToArrOfArrs({
      arrToFragment: files,
      arrOfArrsAggregator: [],
      interval: batchSize
    });
    
    let totalRemoved = 0;
    
    for (const [index, batch] of batches.entries()) {
      // Yield current batch info before removing
      yield { 
        action: 'removing' as const, 
        batch: [...batch],
        batchNumber: index + 1,
        totalBatches: batches.length,
        totalFound: files.length,
        removed: totalRemoved 
      };
      
      // Remove files in this batch
      for (const file of batch) {
        this.rmTmpFile(file);
        totalRemoved++;
      }
      
      // Yield progress after batch removal
      yield { 
        action: 'batch-complete' as const, 
        batchNumber: index + 1,
        batchSize: batch.length,
        totalRemoved,
        remaining: files.length - totalRemoved
      };
    }
    
    return { 
      action: 'complete' as const, 
      totalRemoved,
      totalBatches: batches.length,
      pattern: pattern.toString()
    };
  }
}
