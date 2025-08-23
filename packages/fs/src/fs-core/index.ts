import fsSync from "fs";
import fsAsync from "fs/promises";
import { join, relative, resolve } from "path";
import { FsSize } from "@/fs-size/index.ts";
import {
  WriteFileAsyncDataUnion,
  WriteFileAsyncOptions,
  WriteStreamDataShape,
  WriteStreamOptions
} from "@/types/index.ts";

export class FsCore extends FsSize {
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
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
      const dataBuff = new Uint8Array(
        Buffer.from(Buffer.from(data).toJSON().data)
      );
      return await fsAsync.writeFile(
        relative(this.cwd, path),
        dataBuff,
        typeof options === "object" ? { ...options } : options
      );
    }
  };

  
}
