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
        "src/bin/init.ts",
        "src/config/index.ts",
        "src/types/index.ts",
        "src/services/cli/index.ts",
        "src/services/cli/inquirer.ts",
        "src/services/scaffold/apps/generic-scaffold.ts",
        "src/services/scaffold/packages/ui.ts",
        "src/services/scaffold/root/root-scaffolder.ts",
        "src/services/scaffold/tooling/eslint-scaffold.ts",
        "src/services/scaffold/tooling/jest-scaffold.ts",
        "src/services/scaffold/tooling/prettier-scaffold.ts",
        "src/services/scaffold/tooling/ts-scaffold.ts",
        "src/services/scaffold/index.ts",
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
