import type { ReadableStream as WebReadableStream } from "stream/web";
import type { Readable } from "node:stream";
export type Bin = Buffer | Uint8Array;
export type WebRS = WebReadableStream<Uint8Array>;
export type AsyncIter = AsyncIterable<Uint8Array>;

/** Inputs you actually accept — no `any`, no lies. */
export type Streamable = string | Bin | WebRS | AsyncIter | Readable;
