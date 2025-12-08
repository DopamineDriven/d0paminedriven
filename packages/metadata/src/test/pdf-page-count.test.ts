import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Extract } from "@/index.ts";
import { pdfRemoteTest } from "@/test/pdf-remote-test.ts";
import { testData } from "@/test/pdf-test-data.ts";

const p = new Extract();

describe("buffer size equality", async () => {
  const remoteVsLocal = await pdfRemoteTest(testData, p);
  remoteVsLocal.results.map(v => {
    it(`${v.pageCount} pages should not be null.`, {}, () => {
      assert.notEqual(v.pageCount, null);
    });
  });
});
