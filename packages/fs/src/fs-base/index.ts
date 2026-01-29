import fsSync from "node:fs";
import { devNull, EOL, homedir as casadir, machine as osmachine, hostname, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { Readable } from "node:stream";
import { ReadableStream as WebReadableStream } from "node:stream/web";
import * as dotenv from "dotenv";
import expand from "dotenv-expand";
import type { ReadDirOptions } from "@/types/index.ts";
import type { AsyncIter, Streamable } from "@/types/stream.ts";
import { MimeService } from "@/mime/index.ts";

export class FsBase extends MimeService {
  constructor(public cwd: string) {
    super();
  }
  public get tmpDir() {
    return tmpdir();
  }
  public get homedir() {
    if (process.env.HOME) return process.env.HOME;
    else return casadir();
  }
  public get platform() {
    return process.platform
  }
  public get hostname() {
    return hostname();
  }
  public get machine() {
    if (process.env.HOSTTYPE) return process.env.HOSTTYPE;
    else return osmachine();
  }
  public get devNull() {
    return devNull;
  }
  public get eol() {
    return EOL;
  }
  private get env() {
    return dotenv.config({ processEnv: {}, quiet: true });
  }
  public relPath<const T extends string>(path: T) {
    return relative(this.cwd, path);
  }

  public absPath<const T extends string>(path: T) {
    return resolve(this.relPath(path));
  }

  public parseDotEnv() {
    const env = expand.expand(this.env);
    if (typeof env !== "undefined") {
      if (env.error) {
        throw new Error(env.error.message);
      } else {
        return env.parsed;
      }
    } else {
      throw new Error("env returned undefined");
    }
  }

  public isHomeTargeted(path: string) {
    if (/^(~\/\.?)$/g.test(path)) {
      return true;
    } else if (path.includes(this.homedir)) {
      return true;
    } else {
      return false;
    }
  }

  public isRootPathTargeted<const T extends string>(path: T) {
    if (/^(?:\.\/|\.|\/|root|\.\.\/|cwd|\.\/\.)$/g.test(path)) {
      return true;
    } else {
      return false;
    }
  }

  public pathHandler<const T extends string>(path: T) {
    return /\//g.test(path) === true
      ? path.split(/([/])/gim).reverse().slice(2).reverse().join("")
      : path;
  }
  public isUint8Array(v: unknown) {
    return v instanceof Uint8Array;
  }

  public isBuffer(v: unknown) {
    return Buffer.isBuffer(v);
  }

  public isWebReadableStream(v: unknown) {
    return v instanceof WebReadableStream;
  }

  public isAsyncIterable(v: unknown): v is AsyncIter {
    return (
      typeof v === "object" &&
      v !== null &&
      Symbol.asyncIterator in (v as object)
    );
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

  public toReadable(data: Streamable) {
    if (typeof data === "string") return Readable.from([Buffer.from(data)]);
    if (this.isBuffer(data) || this.isUint8Array(data))
      return Readable.from([data]);
    if (this.isWebReadableStream(data)) return Readable.fromWeb(data);
    if (this.isAsyncIterable(data)) return Readable.from(data);
    if (data instanceof Readable) return data;
    throw new TypeError("Unsupported data type for toReadable()");
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
}
