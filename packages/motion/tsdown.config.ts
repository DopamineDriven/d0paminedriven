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
        "src/hooks/use-gentle-text-effect.ts",
        "src/hooks/use-resize-observer.ts",
        "src/types/helpers.ts",
        "src/types/gentle-text.ts",
        "src/types/hooks.ts",
        "src/types/scatter-text.ts",
        "src/types/split-text.ts",
        "src/types/wave-text.ts",
        "src/ui/gentle-text.tsx",
        "src/ui/scatter-text.tsx",
        "!src/services/postbuild.ts",
        "!src/services/output-md.ts",
        "!src/services/**/*.md"
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
      outDir: "dist",
      unbundle: true
    }) satisfies UserConfig
);
