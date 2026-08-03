import { relative } from "node:path";
import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: ["src/index.ts", "!src/services/postbuild.ts"],
      cwd: process.cwd(),
      target: ["node26"],
      external: ["react"],
      fixedExtension: false,
      dts: { tsgo: true },
      format: ["esm"],
      platform: "neutral",
      sourcemap: true,
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      clean: true,
      outDir: "dist",
      unbundle: true
    }) satisfies UserConfig
);
