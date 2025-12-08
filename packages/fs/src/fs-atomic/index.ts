import fsSync from "fs";
import fsAsync from "fs/promises";
import { execSync } from "node:child_process";
import { join, relative, resolve } from "path";
import type {
  ExecuteCommandProps,
  MkDirSyncOptions,
  NoParamCallback,
  ReadDirOptions,
  RmOptions
} from "@/types/index.ts";
import { FsBase } from "@/fs-base/index.ts";

export class FsAtomic extends FsBase {
  constructor(public cwd: string) {
    super((cwd ??= process.cwd()));
  }

  public executeCommand = <const T extends string>({
    command,
    ...options
  }: ExecuteCommandProps<T>) =>
    Buffer.from(execSync(command, { ...options }));

  public mkdirSync<const T extends string>(
    path: T,
    options: MkDirSyncOptions = { mode: 0o777, recursive: true }
  ) {
    return fsSync.mkdirSync(relative(this.cwd, path), options);
  }

  public generateDirIfDNE<const T extends string>(
    path: T,
    options: MkDirSyncOptions = { mode: 0o777, recursive: true }
  ) {
    if (this.exists(path)) return;
    else {
      return this.mkdirSync(path, options);
    }
  }

  public fileToBuffer = <const T extends string>(path: T) =>
    Buffer.from(fsSync.readFileSync(relative(this.cwd, path)).toJSON().data);

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

  public rmFile<const FP extends string>(
    filePath: FP,
    options: RmOptions = {
      force: true,
      maxRetries: 0,
      recursive: true,
      retryDelay: 100
    }
  ) {
    if (this.exists(filePath)) {
      if (this.isRootPathTargeted(filePath)) {
        fsSync.rmSync(resolve(join(this.cwd, filePath)), options);
      } else fsSync.rmSync(resolve(this.cwd, filePath), options);
    } else return;
  }
  /**
   * Removes files and directories (modeled on the standard POSIX `rm` utility).
   * To get a behavior similar to the `rm -rf` Unix command, use options `{ recursive: true, force: true }`.
   * @return Fulfills with `undefined` upon success.
   */
  public async rmdir<const D extends string>(
    dir: D,
    options: RmOptions = {
      maxRetries: 0,
      retryDelay: 100,
      recursive: true,
      force: true
    }
  ) {
    const resolved = relative(this.cwd, dir);

    if (this.exists(dir)) {
      return await fsAsync.rm(relative(this.cwd, dir), options);
    } else {
      // Either doesn't exist or is not a directory
      throw new Error(`directory ${resolved} does not exist`);
    }
  }

  public rmDirSync<const D extends string>(
    dir: D,
    options: RmOptions = {
      force: true,
      recursive: true,
      maxRetries: 0,
      retryDelay: 100
    },
    callback: NoParamCallback = err =>
      err?.message
        ? console.error(err.message)
        : console.error(`directory ${dir} does not exist`)
  ) {
    const resolved = resolve(this.cwd, dir);
    if (this.exists(dir)) {
      return fsSync.rm(resolved, options, callback);
    } else {
      throw new Error(`directory ${resolved} does not exist`);
    }
  }


    public existsTmp(path: string) {
      return this.exists(resolve(this.tmpDir, path));
    }

    public mkdirTmp(
      path: string,
      options: MkDirSyncOptions = { mode: 0o777, recursive: true }
    ) {
      return this.mkdirSync(resolve(this.tmpDir, path), options);
    }

    public generateDirIfDNETmp<const T extends string>(
      path: T,
      options?: MkDirSyncOptions
    ) {
      if (this.existsTmp(path)) return;
      else {
        return this.mkdirTmp(path, options);
      }
    }
    public rmTmpFile<const V extends string>(filename: V) {
      const tmpPath = resolve(this.tmpDir, filename);

      this.rmFile(tmpPath);
    }
}
