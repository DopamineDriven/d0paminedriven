import { relative } from "node:path";
import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";




export default defineConfig(
  options =>
    ({
      ...options,
      entry: ["index.ts", "react.ts", "next.ts", "base.ts"],
      cwd: process.cwd(),
      target: ["node26"],
      fixedExtension: false,
      dts: true,
      format: ["esm"],
      sourcemap: false,
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      clean: true,
      outDir: "dist",
      unbundle: true
    }) satisfies UserConfig
);
