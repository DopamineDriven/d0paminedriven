import { default as Fs } from "@/fs/index.ts";

const fs = new Fs(process.cwd());
(async () =>
  await fs.fetchRemoteWriteLocalLargeFiles(
    "https://r3f-elevator.vercel.app/r3f-ktx2/textures/brushed-stainless-steel-satin/brushed_metal_26_94_ao.ktx2",
    "src/test/__gen__/brushed-stainless-steel-satin-brushed-metal-ao",
    true
  ))();
