import fsSync from "fs";
import fsAsync from "fs/promises";
import { resolve } from "path";
import type {
  ReadDirOptions,
  WriteableDataType,
  WriteFileAsyncOptions,
  WriteStreamOptions
} from "@/types/index.ts";
import { FsCore } from "@/fs-core/index.ts";
import { Streamable } from "@/types/stream.ts";

export class FsTmp extends FsCore {
  constructor(public cwd: string) {
    super((cwd ??= process.cwd()));
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
    data: WriteableDataType,
    options?: WriteStreamOptions
  ) {
    const fullPath = resolve(this.tmpDir, filename);
    Promise.resolve(this.withWs(fullPath, data, options));
    // if (stream && typeof stream !== 'string') {
    //   stream.write(data);
    //   stream.end();
    // }
  }

  public async writeTmpAsync<const F extends string>(
    filename: F,
    data: WriteableDataType,
    options: WriteFileAsyncOptions = {}
  ) {
    const fullPath = resolve(this.tmpDir, filename);
    return await this.writeFileAsync(
      fullPath,
      data,
      typeof options === "object" ? { ...options, mode: 0o777 } : options
    );
  }

  public async readTmpAsync<const F extends string>(filename: F) {
    const fullPath = resolve(this.tmpDir, filename);
    if (!this.existsTmp(filename)) {
      throw new Error(`Tmp file not found: ${filename}`);
    }
    return await fsAsync.readFile(fullPath);
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
    if (typeof pattern === "string") {
      return tmpContents.filter(t => t.includes(pattern));
    }
    return tmpContents.filter(path => {
      // const _filename = path.includes("/")
      //   ? (path.split("/")?.pop() ?? path)
      //   : path;
      return pattern.test(path);
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
    const batches = this.arrToArrOfArrs(files, batchSize);

    let totalRemoved = 0;

    for (const [index, batch] of batches.entries()) {
      // Yield current batch info before removing
      yield {
        action: "removing" as const,
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
        action: "batch-complete" as const,
        batchNumber: index + 1,
        batchSize: batch.length,
        totalRemoved,
        remaining: files.length - totalRemoved
      };
    }

    return {
      action: "complete" as const,
      totalRemoved,
      totalBatches: batches.length,
      pattern: pattern.toString()
    };
  }
  /**
   * Async version of withWs with atomic write support and progress tracking
   * @param path Target file path
   * @param data Streamable data to write
   * @param options Optional atomic write and abort signal
   * @returns Promise with path and bytes written
   * @example
   * ```ts
   * const fs = new Fs(process.cwd());
   * // Simple async write
   * const result = await fs.asyncWithWs("output.txt", "Hello World");
   * console.log(`Wrote ${result.bytes} bytes to ${result.path}`);
   *
   * // Atomic write with temp file
   * const { path, bytes } = await fs.asyncWithWs(
   *   "critical-data.json",
   *   JSON.stringify(data),
   *   { atomic: true }
   * );
   * ```
   */
  public async asyncWithWs(
    path: string,
    data: Streamable,
    options?: { atomic?: boolean; signal?: AbortSignal }
  ) {
    const { atomic = false, signal: _signal = AbortSignal } = options ?? {};
    let bytes = 0;

    // Non-atomic write path
    if (!atomic) {
      try {
        if (/\//g.test(path)) {
          return this.generateDirIfDNETmp(this.pathHandler(path), {
            recursive: true
          });
        } else return path;
      } catch (error) {
        console.error(
          `[asyncWithWs non-atomic error]: `.concat(
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : JSON.stringify(error, null, 2)
          )
        );
      } finally {
        // Convert streamable to buffer and write
        const readable = this.toReadable(data);
        const chunks = [];
        for await (const chunk of readable) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        try {
          // Write directly to target path (not tmp!)
          this.withWs(path, buffer);
        } catch (err) {
          console.error(err);
        } finally {
          return { path, bytes: buffer.length };
        }
      }
    }

    // Atomic write path
    let tmpName: string | undefined;
    try {
      // Ensure directory exists
      if (/\//g.test(path)) {
        this.generateDirIfDNETmp(this.pathHandler(path), {
          recursive: true
        });
      }

      // Setup temp file name
      tmpName = this.uniqueTmpName("atomic", "tmp");
    } catch (error) {
      console.error(
        `[asyncWithWs atomic setup error]: `.concat(
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error, null, 2)
        )
      );
      // Clean up temp file if it exists
      if (tmpName) {
        try {
          this.rmTmpFile(tmpName);
        } catch (err) {
          console.error(err);
        }
      }
    } finally {
      // Atomic write execution using your existing tmp methods!
      if (tmpName) {
        let newPath: string | null = null;
        let newBytes = 0;
        // Convert streamable to buffer
        const readable = this.toReadable(data);
        const chunks = [];
        for await (const chunk of readable) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        bytes = buffer.length;
        try {
          // Write to tmp first
          await this.writeTmpAsync(tmpName, buffer.toString());

          // Atomic rename from tmp to final destination (not tmp to tmp!)
          const tmpPath = resolve(this.tmpDir, tmpName);
          const finalPath = resolve(this.cwd, path);

          await fsAsync.rename(tmpPath, finalPath);

          // Set success values
          newPath = path;
          newBytes = bytes;
        } catch (err) {
          console.error(`[asyncWithWs atomic rename error]:`, err);
          // If rename failed, try to clean up tmp file
          if (this.existsTmp(tmpName)) {
            try {
              this.rmTmpFile(tmpName);
            } catch (err) {
              console.error(err);
            }
          }
          throw err; // Re-throw to let caller handle
        }

        return { path, bytes, newPath, newBytes };
      }
    }

    // Fallback (shouldn't reach)
    return { path, bytes: 0 };
  }
}
