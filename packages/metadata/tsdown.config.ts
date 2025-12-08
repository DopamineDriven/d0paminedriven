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
        "src/docs/index.ts",
        "src/docs/mime-workup.ts",
        "src/extract/index.ts",
        "src/extract/client.ts",
        "src/images/index.ts",
        "src/images/workup.ts",
        "src/mixins/index.ts",
        "src/types/index.ts",
        "src/types/utils.ts",
        "!src/test/**"
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
