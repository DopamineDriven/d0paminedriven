import { relative } from "node:path";
import type { UserConfig as Options } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  (
    options: Omit<
      Options,
      | "entry"
      | "target"
      | "dts"
      | "watch"
      | "format"
      | "cwd"
      | "sourcemap"
      | "clean"
      | "outDir"
      | "tsconfig"
    >
  ) =>
    ({
      ...options,
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
        "src/image/workup.ts",
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
      cwd: process.cwd(),
      target: ["node25"],
      fixedExtension: false,
      dts: { tsgo: true },
      watch: process.env.NODE_ENV === "development",
      format: ["esm"],
      sourcemap: true,
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      clean: true,
      outDir: "dist",
      unbundle: true
    }) satisfies Options
);
