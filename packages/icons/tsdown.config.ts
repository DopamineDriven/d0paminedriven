import { arch, platform } from "node:os";
import { join, relative, resolve } from "node:path";
import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

const p = platform();
const a = arch();
const executable = p === "win32" ? "tsgo.exe" : "tsgo";
const dirname = `native-preview-${p}-${a}`;

const path = resolve(
  join(
    process.cwd(),
    `../../node_modules/@typescript/${dirname}/lib/${executable}`
  )
);

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
      dts: { tsgo: { path } },
      external: ["react"],
      platform: "neutral",
      fixedExtension: false,
      target: ["esnext"],
      format: ["esm"],
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      cwd: process.cwd(),
      clean: true,
      sourcemap: false,
      outDir: "dist",
      unbundle: true
    }) satisfies UserConfig
);
