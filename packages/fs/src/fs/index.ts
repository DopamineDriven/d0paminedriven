import { createReadStream } from "node:fs";
import { relative, resolve } from "node:path";
import { Readable } from "node:stream";
import { FsFetch } from "@/fs-fetch/index.ts";

export default class Fs extends FsFetch {
  constructor(public cwd: string) {
    super((cwd ??= process.cwd()));
  }

  public async getSpecs(filePath: string, size = 4096 * 36) {
    if (URL.canParse(filePath)) {
      return await this.extractRemote(filePath, size);
    } else {
      const stream = createReadStream(relative(this.cwd, filePath), {
        highWaterMark: size
      });
      const buffer = await this.readBytes(stream, size);
      return await this.extractRemote(buffer, size);
    }
  }

  public async getSpecsFlexi(target: Buffer | string, size = 4096 * 36) {
    if (Buffer.isBuffer(target)) {
      return this.extractRemote(target, size);
    } else {
      if (URL.canParse(target)) {
        return await this.extractRemote(target, size);
      } else {
        const stream = createReadStream(relative(this.cwd, target), {
          highWaterMark: size
        });
        const buffer = await this.readBytes(stream, size);
        return this.extractRemote(buffer, size);
      }
    }
  }

  public async getSpecsTmp(filename: string, size = 4096 * 36) {
    const absPath = resolve(this.tmpDir, filename);
    const rs = createReadStream(absPath);
    const arr = Array.of<Buffer>();
    const iterate = rs.iterator() as NodeJS.AsyncIterator<Buffer>;
    for await (const chunk of iterate) {
      arr.push(chunk);
    }
    const buffer = Buffer.concat(arr);
    return await this.extractRemote(buffer, size);
  }

  /**
   * Extract image metadata using streaming (only reads ~4KB)
   * Much more memory efficient for large images
   */
  public async getSpecsStream(filePath: string, size = 4096 * 36) {
    const stream = createReadStream(relative(this.cwd, filePath), {
      highWaterMark: size
    });
    const buffer = await this.readBytes(stream, size);
    return await this.extractRemote(buffer, size);
  }

  public async getSpecsStreamTmp(filename: string) {
    const absPath = resolve(this.tmpDir, filename);
    const rs = createReadStream(absPath);
    const arr = Array.of<Buffer>();
    const iterate = rs.iterator() as NodeJS.AsyncIterator<Buffer>;
    for await (const chunk of iterate) {
      arr.push(chunk);
    }
    const buffer = Buffer.concat(arr);
    return await this.extractRemote(buffer);
  }

  protected async readBytes(stream: Readable, size?: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
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
        const bytes = size ?? chunk.length;
        const remaining = bytes - totalBytes;
        if (chunk.length <= remaining) {
          chunks.push(chunk);
          totalBytes += chunk.length;
        } else {
          // Take only what we need
          chunks.push(chunk.subarray(0, remaining));
          totalBytes = bytes;
        }

        if (totalBytes >= bytes) {
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
}
