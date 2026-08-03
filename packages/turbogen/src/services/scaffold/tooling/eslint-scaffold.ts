import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

/* eslint-disable @typescript-eslint/await-thenable */

export class EslintScaffolder {
  constructor(
    public baseProps: PromptPropsBase,
    protected configHandler: ConfigHandler
  ) {}

  private get workspace() {
    return this.baseProps.workspace;
  }
  private get localDeps() {
    return [`@${this.workspace}/tsconfig`] as const;
  }
  private get devDeps() {
    return [
      "@types/node",
      "@typescript/native-preview",
      "eslint",
      "prettier",
      "tsdown",
      "tslib",
      "tsx",
      "typescript"
    ] as const;
  }

  private get deps() {
    return [
      "@eslint/compat",
      "@eslint/config-helpers",
      "@eslint/js",
      "@next/eslint-plugin-next",
      "eslint-plugin-import",
      "eslint-plugin-jsx-a11y",
      "eslint-plugin-react",
      "eslint-plugin-react-hooks",
      "eslint-plugin-turbo",
      "jiti",
      "typescript-eslint"
    ] as const;
  }

  private get baseScaffold() {
    // prettier-ignore
    return `import { join } from "node:path";
import { includeIgnoreFile } from "@eslint/config-helpers";
import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import turboPlugin from "eslint-plugin-turbo";
import { defineConfig } from "@eslint/config-helpers";
import tseslint from "typescript-eslint";

export const baseConfig = (cwd=process.cwd()) => defineConfig(
  includeIgnoreFile(join(cwd, "../../.gitignore")),
  { ignores: ["**/*.config.*"] },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.ts", "**/*.tsx"],
    plugins: {
      import: importPlugin,
      turbo: turboPlugin
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    rules: {
      "turbo/no-undeclared-env-vars": [
        1,
        {
          allowList: ["^ENV_[A-Z]+$"]
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        1,
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-misused-promises": [
        0,
        { checksVoidReturn: { attributes: false } }
      ],
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "no-unsafe-finally": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@next/next/no-page-custom-font": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/require-await": "off",
      "preserve-caught-error": "off",
      "no-const": "off",
      "prefer-const": "off",
      "no-useless-assignment":"off",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-namespace": "off",
      "import/consistent-type-specifier-style": ["warn", "prefer-top-level"]
    }
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
);
` as const;
  }

  private get nextScaffold() {
    // prettier-ignore
    return `import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig } from "@eslint/config-helpers";

export const nextjsConfig = defineConfig({
  files: ["**/*.ts", "**/*.tsx"],
  plugins: {
    "@next/next": nextPlugin
  },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs["core-web-vitals"].rules,
    "@next/next/no-duplicate-head": "off",
    "@next/next/no-img-element": "off"
  }
});
` as const;
  }

  private get reactScaffold() {
    // prettier-ignore
    return `import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "@eslint/config-helpers";

export const reactConfig = defineConfig(
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat["jsx-runtime"],
    languageOptions: {
      ...reactPlugin.configs.flat.recommended?.languageOptions,
      ...reactPlugin.configs.flat["jsx-runtime"]?.languageOptions,
      globals: {
        React: "writable"
      }
    }
  },
  reactHooks.configs.flat["recommended-latest"]
);
` as const;
  }

  private get tsconfigScaffold() {
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

  private get turboConfigTemplate() {
    // prettier-ignore
    return `{
  "$schema": "https://turborepo.org/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "base.ts",
        "next.ts",
        "react.ts",
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

  private get tsdownTemplate() {
    // prettier-ignore
    return `import { relative } from "node:path";
import type { InlineConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: ["index.ts", "react.ts", "next.ts", "base.ts"],
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
);` as const;
  }

  private get eslintConfigTemplate() {
    return `import { defineConfig } from "@eslint/config-helpers";
import { baseConfig } from "./base.ts";

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

  private get IndexTemplate() {
    return `export { baseConfig } from "./base.ts";
export { nextjsConfig } from "./next.ts";
export { reactConfig } from "./react.ts";
` as const;
  }

  private eslintPath<const F extends string>(file: F) {
    return `tooling/eslint/${file}` as const;
  }

  private get getPaths() {
    return {
      base: this.eslintPath("base.ts"),
      next: this.eslintPath("next.ts"),
      packageJson: this.eslintPath("package.json"),
      react: this.eslintPath("react.ts"),
      tsconfig: this.eslintPath("tsconfig.json"),
      tsdown: this.eslintPath("tsdown.config.ts"),
      eslintConfig: this.eslintPath("eslint.config.ts"),
      index: this.eslintPath("index.ts"),
      turbo: this.eslintPath("turbo.json")
    } as const;
  }

  private eslintTarget<const V extends keyof typeof this.getPaths>(target: V) {
    return this.getPaths[target];
  }

  private writeTarget<
    const T extends ReturnType<typeof this.eslintTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.configHandler.withWs(target, template);
  }

  public async exeEslint() {
    const pkgJson = await this.configHandler.resolveAllDepsEslint(
      this.deps,
      this.devDeps,
      this.localDeps,
      this.workspace
    );
    return Promise.all([
      this.writeTarget("tooling/eslint/base.ts", this.baseScaffold),
      this.writeTarget("tooling/eslint/next.ts", this.nextScaffold),
      this.writeTarget(
        "tooling/eslint/package.json",
        JSON.stringify(pkgJson, null, 2)
      ),
      this.writeTarget("tooling/eslint/tsdown.config.ts", this.tsdownTemplate),

      this.writeTarget("tooling/eslint/react.ts", this.reactScaffold),
      this.writeTarget("tooling/eslint/tsconfig.json", this.tsconfigScaffold),
      this.writeTarget("tooling/eslint/index.ts", this.eslintConfigTemplate),
      this.writeTarget("tooling/eslint/turbo.json", this.turboConfigTemplate),
      this.writeTarget("tooling/eslint/index.ts", this.IndexTemplate)
    ]);
  }
}
