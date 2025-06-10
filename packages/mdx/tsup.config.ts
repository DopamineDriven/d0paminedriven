import { relative } from "node:path";
import type { Options } from "tsup";
import { defineConfig } from "tsup";

const opts = {
  entry: ["src/index.ts", "!src/services/postbuild.ts"],
  dts: true,
  external: ["react"],
  watch: process.env.NODE_ENV === "development",
  keepNames: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  tsconfig: relative(process.cwd(), "tsconfig.json"),
  clean: true,
  outDir: "dist"
} as const satisfies Options;

const tsupConfig = (options: Omit<Options, keyof typeof opts>) =>
  ({
    ...opts,
    ...options
  }) satisfies Options;

export default defineConfig(tsupConfig);
