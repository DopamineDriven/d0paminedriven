import { relative } from "node:path";
import type { UserConfig as Options } from "tsdown";
import { defineConfig } from "tsdown";

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
    }) satisfies Options
);
