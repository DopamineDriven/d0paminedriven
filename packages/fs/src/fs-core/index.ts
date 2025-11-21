import fsSync from "fs";
import fsAsync from "fs/promises";
import { relative } from "path";
import { FsSize } from "@/fs-size/index.ts";
import {
  WriteableDataType,
  WriteFileAsyncDataType,
  WriteFileAsyncOptions,
  WriteStreamOptions
} from "@/types/index.ts";

export class FsCore extends FsSize {
  constructor(public override cwd: string) {
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
