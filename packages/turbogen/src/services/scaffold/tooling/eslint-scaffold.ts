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
    return [
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`
    ] as const;
  }
  private get devDeps() {
    return [
      "@types/node",
      "@typescript/native-preview",
      "eslint",
      "prettier",
      "typescript"
    ] as const;
  }

  private get deps() {
    return [
      "@eslint/compat",
      "@eslint/js",
      "@next/eslint-plugin-next",
      "eslint-config-turbo",
      "eslint-plugin-import",
      "eslint-plugin-jsx-a11y",
      "eslint-plugin-react",
      "eslint-plugin-react-compiler",
      "eslint-plugin-react-hooks",
      "eslint-plugin-turbo",
      "jiti",
      "typescript-eslint"
    ] as const;
  }

  private get baseScaffold() {
    // prettier-ignore
    return `/// <reference types="./types.d.ts" />

import { join, relative } from "node:path";
import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import { includeIgnoreFile } from "@eslint/compat";

const _project = relative(process.cwd(), "tsconfig.json");

export default tseslint.config(
  includeIgnoreFile(join(import.meta.dirname, "../../.gitignore")),
  {
    // Globally ignored files
    ignores: [
      "**/*.config.*",
      "**/public/**",
      ".vscode/**/*.json",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/cache/**"
    ]
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.ts", "**/*.tsx"],
    plugins: {
      import: importPlugin,
      turbo: turboPlugin
    },
    ignores: ["**/*.config.*", "public/**/*.js", "**/node_modules/**", ".vscode/**/*.json"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked
    ],
    rules: {
      ...turboPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-misused-promises": [
        2,
        { checksVoidReturn: { attributes: false } }
      ],
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-non-null-assertion": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "no-unsafe-finally": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@next/next/no-page-custom-font": "off",
      // the following three rules are turned off due to existing errors eslint has when reading the source files
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-empty-function": "off"
    }
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { project: true } }
  }
);
` as const;
  }

  private get nextScaffold() {
    // prettier-ignore
    return `import nextPlugin from "@next/eslint-plugin-next";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // TypeError: context.getAncestors is not a function
      "@next/next/no-duplicate-head": "off",
      "import/no-default-export": "off"
    }
  }
];` as const;
  }

  private get reactScaffold() {
    // prettier-ignore
    return `import reactPlugin from "eslint-plugin-react";
import compilerPlugin from "eslint-plugin-react-compiler";
import hooksPlugin from "eslint-plugin-react-hooks";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-compiler": compilerPlugin,
      "react-hooks": hooksPlugin
    },
    rules: {
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...hooksPlugin.configs.recommended.rules,
      "react-compiler/react-compiler": "error"
    },
    languageOptions: {
      globals: {
        React: "writable"
      }
    }
  }
];
` as const;
  }

  private get tsconfigScaffold() {
    // prettier-ignore
    return `{
  "extends": "@${this.workspace}/tsconfig/base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json"
  },
  "include": ["."],
  "exclude": ["node_modules"]
}`as const;
  }

  private get dtsScaffold() {
    // prettier-ignore
    return `declare module "eslint-plugin-import" {
  import type { Linter, Rule } from "eslint";

  export const configs: {
    recommended: { rules: Linter.RulesRecord };
  };
  export const rules: Record<string, Rule.RuleModule>;
}

declare module "eslint-plugin-react" {
  import type { Linter, Rule } from "eslint";

  export const configs: {
    recommended: { rules: Linter.RulesRecord };
    all: { rules: Linter.RulesRecord };
    "jsx-runtime": { rules: Linter.RulesRecord };
  };
  export const rules: Record<string, Rule.RuleModule>;
}

declare module "eslint-plugin-react-compiler" {}

declare module "eslint-plugin-react-hooks" {
  import type { Linter, Rule } from "eslint";

  export const configs: {
    recommended: {
      rules: {
        "rules-of-hooks": Linter.RuleEntry;
        "exhaustive-deps": Linter.RuleEntry;
      };
    };
  };
  export const rules: Record<string, Rule.RuleModule>;
}

declare module "@next/eslint-plugin-next" {
  import type { Linter, Rule } from "eslint";

  export const configs: {
    recommended: { rules: Linter.RulesRecord };
    "core-web-vitals": { rules: Linter.RulesRecord };
  };
  export const rules: Record<string, Rule.RuleModule>;
}

declare module "eslint-plugin-turbo" {
  import type { Linter, Rule } from "eslint";

  export const configs: {
    recommended: { rules: Linter.RulesRecord };
  };
  export const rules: Record<string, Rule.RuleModule>;
}
` as const;
  }

  private eslintPath<const F extends string>(file: F) {
    return `tooling/eslint/${file}` as const;
  }

  private get getPaths() {
    return {
      base: this.eslintPath("base.mjs"),
      next: this.eslintPath("next.mjs"),
      packageJson: this.eslintPath("package.json"),
      react: this.eslintPath("react.mjs"),
      tsconfig: this.eslintPath("tsconfig.json"),
      types: this.eslintPath("types.d.ts")
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
      this.writeTarget("tooling/eslint/base.mjs", this.baseScaffold),
      this.writeTarget("tooling/eslint/next.mjs", this.nextScaffold),
      this.writeTarget(
        "tooling/eslint/package.json",
        JSON.stringify(pkgJson, null, 2)
      ),
      this.writeTarget("tooling/eslint/react.mjs", this.reactScaffold),
      this.writeTarget("tooling/eslint/tsconfig.json", this.tsconfigScaffold),
      this.writeTarget("tooling/eslint/types.d.ts", this.dtsScaffold)
    ]);
  }
}
