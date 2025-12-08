import type { ExpandedDocSpecs } from "@/index.ts";
import { Extract } from "@/index.ts";

export async function pdfRemoteTest(testData: string[], extractor: Extract) {
  console.log(
    `\n=== Remote PDF Page Count Test (${testData.length} PDFs) ===\n`
  );

  const results: (ExpandedDocSpecs & { filename: string })[] = [];

  for (const url of testData) {
    const path = new URL(url).pathname;
    const filename = path.slice(path.lastIndexOf("/") + 1);
    const result = (await extractor.extractRemote(
      url,
      4096 * 48
    )) as ExpandedDocSpecs;
    results.push({ filename, ...result });

    const icon = result.pageCount !== null ? "✓" : "✗";
    const pages =
      result.pageCount !== null ? String(result.pageCount).padStart(4) : " N/A";
    const name =
      filename.length > 55 ? filename.slice(0, 52) + "..." : filename;
    console.log(
      `${icon} ${name.padEnd(55)} | ${pages} pg | v${(result.pdfVersion ?? "?").padEnd(4)} | ${result.isLinearized ? "Lin" : "   "}`
    );
  }

  const nullCount = results.filter(r => r.pageCount === null).length;
  const pageCounts = results
    .map(r => r.pageCount)
    .filter((n): n is number => n !== null);

  console.log(`\n=== Summary ===`);
  console.log(
    `Total: ${results.length} | Success: ${pageCounts.length} | Null: ${nullCount}`
  );
  console.log(
    `Pages - Min: ${Math.min(...pageCounts)} | Max: ${Math.max(...pageCounts)} | Avg: ${Math.round(pageCounts.reduce((a, b) => a + b, 0) / pageCounts.length)}`
  );

  if (nullCount > 0) {
    console.log(`\n=== Null page count ===`);
    results
      .filter(r => r.pageCount === null)
      .forEach(r => console.log(`- ${r.filename}`));
  }
  return {results};
}
