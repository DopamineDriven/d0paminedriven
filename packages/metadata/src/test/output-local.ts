import { Fs } from "@d0paminedriven/fs";
import { cdnUrls } from "@/test/data.ts";

const fs = new Fs(process.cwd());

const exists = fs.exists("src/test/local");

if (!exists) {
  (async (mapper: string[]) => {
    for (const target of mapper) {
      await fs.fetchRemoteWriteLocalLargeFiles(
        target,
        `src/test/local/${target.split(/(\/)/).reverse()[0]?.split(".")?.[0]}`
      );
    }
  })([...cdnUrls]);
}
