import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

/* eslint-disable @typescript-eslint/await-thenable */

export class PrettierScaffolder {
  constructor(
    public baseProps: PromptPropsBase,
    protected configHandler: ConfigHandler
  ) {}

  private get workspace() {
    return this.baseProps.workspace;
  }

  private get indexTemplate() {
    // prettier-ignore
    return `import type { PluginConfig } from "@ianvs/prettier-plugin-sort-imports";
import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

export type WorkspacePrettierConfig =
  Config & PluginConfig & PluginOptions;

const config = {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss"
  ],
  importOrder: [
    "<TYPES>",
    "<TYPES>^@${this.workspace}",
    "^@${this.workspace}/(.*)$",
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "<TYPES>^[.|..|@]",
    "^@/",
    "^~/",
    "^[../]",
    "^[./]"
  ],
  importOrderParserPlugins: [
    "typescript",
    "jsx",
    "decorators-legacy",
    "importAttributes"
  ],
  importOrderTypeScriptVersion: "6.0.3",
  semi: true,
  singleQuote: false,
  trailingComma: "none",
  arrowParens: "avoid",
  useTabs: false,
  tabWidth: 2,
  bracketSameLine: true,
  jsxSingleQuote: false,
  bracketSpacing: true,
  quoteProps: "as-needed",
  printWidth: 80
} satisfies WorkspacePrettierConfig;

export default config;
` as const;
  }

  private get eslintScaffold() {
    // prettier-ignore
    return `import { defineConfig } from "@eslint/config-helpers";
import { baseConfig } from "@${this.workspace}/eslint-config";

export default defineConfig(
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/require-await": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-object-type": "off"
    },
    ignores: ["dist/**"]
  },
  baseConfig(process.cwd())
);
` as const;
  }

  private get tsdownScaffold() {
    // prettier-ignore
    return `import { relative } from "node:path";
import type { InlineConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: ["index.ts"],
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
    }) satisfies InlineConfig
);
` as const
  }

  private get turboConfig() {
    return `{
  "$schema": "https://turborepo.org/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "index.ts",
        "tsconfig.json",
        "package.json",
        "eslint.config.ts",
        "tsdown.config.ts"
      ]
    }
  }
}
` as const;
  }

  private get deps() {
    return [
      "@ianvs/prettier-plugin-sort-imports",
      "prettier",
      "prettier-plugin-tailwindcss"
    ] as const;
  }

  private get devDeps() {
    return [
      "@typescript/native-preview",
      "@types/node",
      "typescript",
      "eslint",
      "jiti",
      "tsdown",
      "tslib",
      "tsx",
      "typescript-eslint"
    ] as const;
  }

  private get localDeps() {
    return [
      `@${this.workspace}/tsconfig`,
      `@${this.workspace}/eslint-config`
    ] as const;
  }

  private get tsconfigTemplate() {
    // prettier-ignore
    return `{
  "extends": "@${this.workspace}/tsconfig/node-pkg.json",
  "compilerOptions": {
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
    "types": ["*"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}`as const;
  }

  private prettierPath<const F extends string>(file: F) {
    return `tooling/prettier/${file}` as const;
  }

  private get getPaths() {
    return {
      index: this.prettierPath("index.ts"),
      packageJson: this.prettierPath("package.json"),
      tsconfig: this.prettierPath("tsconfig.json"),
      eslint: this.prettierPath("eslint.config.ts"),
      tsdown: this.prettierPath("tsdown.config.ts"),
      turbo: this.prettierPath("turbo.json")
    } as const;
  }

  private prettierTarget<const V extends keyof typeof this.getPaths>(
    target: V
  ) {
    return this.getPaths[target];
  }

  private writeTarget<
    const T extends ReturnType<typeof this.prettierTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.configHandler.withWs(target, template);
  }

  public async exePrettier() {
    const pkgJson = await this.configHandler.resolveAllDepsPrettier(
      this.deps,
      this.devDeps,
      this.localDeps,
      this.workspace
    );
    return Promise.all([
      this.writeTarget("tooling/prettier/index.ts", this.indexTemplate),
      this.writeTarget(
        "tooling/prettier/package.json",
        JSON.stringify(pkgJson, null, 2)
      ),
      this.writeTarget("tooling/prettier/tsconfig.json", this.tsconfigTemplate),
      this.writeTarget(
        "tooling/prettier/eslint.config.ts",
        this.eslintScaffold
      ),
      this.writeTarget(
        "tooling/prettier/tsdown.config.ts",
        this.tsdownScaffold
      ),
      this.writeTarget("tooling/prettier/turbo.json", this.turboConfig)
    ]);
  }
}
