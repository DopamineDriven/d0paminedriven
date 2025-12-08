import Fs from "@/fs/index.ts";

// Test the tmp directory utilities
const fs = new Fs(process.cwd());

async function testTmpUtils() {
console.log("Testing tmp directory utilities...\n");

// 1. Test uniqueTmpName
const uniqueName = fs.uniqueTmpName("test-session", "json");
console.log("✓ Generated unique name:", uniqueName);

// 2. Test writeTmp
const testData = { message: "Hello from tmp!", timestamp: Date.now() };
const tmpPath = fs.writeTmp(uniqueName, JSON.stringify(testData, null, 2));
console.log("✓ Written to tmp:", tmpPath);

fs.wait(10).then(() => {
  // 3. Test scanTmp
  const allTmpFiles = fs.scanTmp();
  console.log(`✓ Found ${allTmpFiles.length} files in tmp (non-recursive)`);

  const testFiles = fs.scanTmp("test-session");
  console.log(`✓ Found ${testFiles.length} test-session files`);

  // 4. Test readTmp
  const readData = fs.readTmp(uniqueName);
  const parsed = JSON.parse(Buffer.from(readData).toString("utf-8")) as object;
  if ("message" in parsed) {
    console.log("✓ Read from tmp:", parsed.message);
  }

  // 5. Test writing with subdirectory
  const subDirFile = fs.writeTmp("img-probe/test-image.txt", "Image data here");
  console.log("✓ Written to tmp subdirectory:", subDirFile);

  // 6. Test extractFromTmp (create output dir first)
  fs.generateDirIfDNE("./tmp-extracted", { recursive: true });
  const extracted = fs.extractFromTmp("test-session", "./tmp-extracted");
  console.log(`✓ Extracted ${extracted.length} files to ./tmp-extracted`);

  // 7. Test cleanupTmp
  const removed = fs.cleanupTmp("test-session");
  console.log(`✓ Cleaned up ${removed} test-session files from tmp`);

  // Clean up img-probe files too
  fs.cleanupTmp("img-probe");

  // Clean up extraction test
  fs.rmDirSync("./tmp-extracted");

  console.log("\n✅ All tmp utilities working correctly!");
});
}

testTmpUtils().catch(console.error);
