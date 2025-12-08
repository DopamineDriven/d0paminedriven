import fsAsync from "fs/promises";
import { Abortable } from "node:events";
import fsSync from "node:fs";
import { relative } from "path";
import { FsSize } from "@/fs-size/index.ts";
import {
  WriteableDataType,
  WriteFileAsyncDataType,
  WriteFileAsyncOptions,
  WriteStreamOptions
} from "@/types/index.ts";

export interface CreateReadStreamOptions extends Abortable {
  encoding?: BufferEncoding | null | undefined;
  autoClose?: boolean | undefined;
  emitClose?: boolean | undefined;
  start?: number | undefined;
  end?: number | undefined;
  highWaterMark?: number | undefined;
}

export class FsCore extends FsSize {
  constructor(public cwd: string) {
    super((cwd ??= process.cwd()));
  }

  public withWs<const T extends string>(
    path: T,
    data: WriteableDataType,
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
        .write(data);
    }
  }
  public async withWsAsync<const T extends string>(
    path: T,
    data: WriteableDataType,
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
        .write(data);
    }
  }

  // public async withRs<const T extends string>(
  //   path: T,
  //   flags?: number | string,
  //   mode?: fsSync.Mode,
  //   options: CreateReadStreamOptions = {}
  // ) {
  //   if (this.exists(path)) {
  //     const fd = await open(path, flags, mode);
  //     const stream = createReadStream(path,);

  //   } else throw new Error(`path ${path} does not exist.`);
  // }

  public writeFileAsync = async <const T extends string>(
    path: T,
    data: WriteFileAsyncDataType,
    options: WriteFileAsyncOptions = {}
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
      return fsAsync.writeFile(relative(this.cwd, path), data, options);
    }
  };
}
