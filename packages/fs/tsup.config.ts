import { relative } from "node:path";
import type { Options } from "tsup";
import { defineConfig } from "tsup";

const tsupConfig = (options: Options) =>
  ({
    entry: [
      "src/index.ts",
      "src/fs/index.ts",
      "src/fs-atomic/index.ts",
      "src/fs-base/index.ts",
      "src/fs-core/index.ts",
      "src/fs-fetch/index.ts",
      "src/fs-size/index.ts",
      "src/fs-tmp/index.ts",
      "src/image/index.ts",
      "!src/image/notes.md",
      "src/ld/index.ts",
      "src/mime/index.ts",
      "src/types/index.ts",
      "src/types/stream.ts",
      "src/url/index.ts",
      "src/utils/index.ts",
      "!src/__generated__/**/*",
      "!src/test/**/*",
      "!public/**/*"
    ],
    target: ["node24"],
    dts: true,
    watch: process.env.NODE_ENV === "development",
    keepNames: true,
    format: ["esm"],
    sourcemap: true,
    tsconfig: relative(process.cwd(), "tsconfig.json"),
    clean: true,
    outDir: "dist",
    ...options
  }) satisfies Options;

export default defineConfig(tsupConfig);
