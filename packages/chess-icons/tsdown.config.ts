import { relative } from "node:path";
import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: [
        "src/index.ts",
        "src/icons/*.tsx",
        "src/types/index.ts",
        "!public/**/*"
      ],
      dts: { tsgo: true },
      external: ["react"],
      platform: "neutral",
      fixedExtension: false,
      target: ["esnext"],
      format: ["esm"],
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      cwd: process.cwd(),
      clean: true,
      outDir: "dist",
      unbundle: true
    }) satisfies UserConfig
);
