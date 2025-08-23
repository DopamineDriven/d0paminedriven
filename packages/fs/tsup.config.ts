import { relative } from "node:path";
import type { Options } from "tsup";
import { defineConfig } from "tsup";

const tsupConfig = (options: Options) =>
  ({
    entry: [
      "src/index.ts",
      "src/fs/index.ts",
      "src/image/index.ts",
      "!src/image/notes.md",
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
