import { relative } from "node:path";
import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
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
      target: ["node26"],
      fixedExtension: false,
      dts: { tsgo: true },
      format: ["esm"],
      sourcemap: true,
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      clean: true,
      outDir: "dist",
      unbundle: true
    }) satisfies UserConfig
);
