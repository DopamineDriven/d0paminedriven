import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Fs } from "@d0paminedriven/fs";
import type { ExpandedDocSpecs, ExpandedImgSpecs } from "@/types/index.ts";
import { Extract } from "@/extract/index.ts";
import { tuplesToTest } from "@/test/tuples.ts";

const fs = new Fs(process.cwd());

const p = new Extract();

const arr =
  Array.of<
    [ExpandedDocSpecs | ExpandedImgSpecs, ExpandedDocSpecs | ExpandedImgSpecs]
  >();

async function comprehensive() {
  for (const [remote, local] of tuplesToTest) {
    const bufLocal = fs.fileToBuffer(local ?? "");
    const [r, l] = await Promise.all([
      p.extractRemote(remote ?? "", 4096 * 48),
      p.extractRemote(bufLocal, 4096 * 48)
    ]);
    arr.push([r, l]);
  }
  return arr;
}

describe("buffer size equality", async () => {
  const remoteVsLocal = await comprehensive();
  remoteVsLocal.map(v => {
    it(
      `${v[0].source} should have the same bytes read ${v[0].byteSize} as ${v[1].source}, ${v[1].byteSize}`,
      {},
      () => {
        assert.equal(v[0].byteSize, v[1].byteSize);
      }
    );
  });
});
