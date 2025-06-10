import { execSync } from "child_process";
import fsSync from "fs";
import fsAsync from "fs/promises";
import { join, relative, resolve } from "path";
import * as dotenv from "dotenv";
import expand from "dotenv-expand";
import sharp from "sharp";
import type {
  ExecuteCommandProps,
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
  }

  private get myEnv() {
    return dotenv.config({ processEnv: {} });
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
    options: ReadDirOptions = { recursive: true }
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
    const response = await fetch(path);
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

  public async fetchRemoteWriteLocalLargeFiles<
    const I extends string,
    const O extends string
  >(inputUrl: I, outputPath: O, useDetectedExtension = true) {
    const MAX_SAFE_IN_MEMORY_MB = 100;

    try {
      const head = await fetch(inputUrl, { method: "HEAD" });
      const contentLength = head.headers.get("content-length");
      const fileSizeMb = contentLength
        ? parseInt(contentLength, 10) / (1024 * 1024)
        : null;

      const formattedPath = useDetectedExtension
        ? `${outputPath}.${this.assetType(inputUrl)}`
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
    } else return await sharp(target).toFormat(format, { quality }).toBuffer();
  }
}
