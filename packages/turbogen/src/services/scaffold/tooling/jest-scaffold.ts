import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

export class JestScaffolder extends ConfigHandler {
  constructor(
    public override cwd: string,
    public baseProps: PromptPropsBase
  ) {
    super((cwd ??= process.cwd()));
  }

  private get workspace() {
    return this.baseProps.workspace;
  }

  private get browserTemplate() {
    // prettier-ignore
    return `/**
 * Jest preset for Browser + TypeScript workspaces
 * https://github.com/DopamineDriven/d0paminedriven/tree/master/packages/turbogen
 *
 * @type {import("ts-jest").JestConfigWithTsJest}
 */
export default {
  roots: ["<rootDir>"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\\\.(mjs|cjs|js|jsx|ts|tsx|mts|cts)$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "mts",
    "cts",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "json",
    "node"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/test/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist",
    "<rootDir>/artifacts",
    "<rootDir>/build",
    "<rootDir>/.story",
    "<rootDir>/.next",
    "<rootDir>/.turbo",
    "<rootDir>/.out",
    "<rootDir>/.output"
  ],
  preset: "ts-jest",
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      diagnostics: true,
      isolatedModules: true,
      useESM: true
    }
  },
  testTimeout: 30000,
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test/__fixtures__/",
    "/dist/",
    "/artifacts/",
    "/build/",
    "/.story/",
    "/.turbo/",
    "/.next/",
    "/.out/",
    "/.output/"
  ]
};` as const;
  }

  private get nodeTemplate() {
    // prettier-ignore
    return `/**
 * Jest preset for Node + TypeScript workspaces
 * https://github.com/DopamineDriven/d0paminedriven/tree/master/packages/turbogen
 *
 * @type {import("ts-jest").JestConfigWithTsJest}
 */
export default {
  roots: ["<rootDir>"],
  testEnvironment: "node",
  transform: {
    "^.+\\\\.(mjs|cjs|js|jsx|ts|tsx|mts|cts)$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "mts",
    "cts",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "json",
    "node"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/test/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist",
    "<rootDir>/artifacts",
    "<rootDir>/build",
    "<rootDir>/.story",
    "<rootDir>/.next",
    "<rootDir>/.turbo",
    "<rootDir>/.out",
    "<rootDir>/.output"
  ],
  preset: "ts-jest",
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      diagnostics: true,
      isolatedModules: true,
      useESM: true
    }
  },
  testTimeout: 30000,
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test/__fixtures__/",
    "/dist/",
    "/artifacts/",
    "/build/",
    "/.story/",
    "/.turbo/",
    "/.next/",
    "/.out/",
    "/.output/"
  ]
};
` as const;
  }

  private get deps() {
    return ["ts-jest"] as const;
  }

  private get devDeps() {
    return ["jest-environment-jsdom", "prettier", "typescript"] as const;
  }

  private get peerDeps() {
    return ["jest"] as const;
  }

  private get localDeps() {
    return [
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`
    ] as const;
  }

  private get tsconfigTemplate() {
    // prettier-ignore
    return `{
  "extends": "@${this.workspace}/tsconfig/base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json"
  },
  "include": ["."],
  "exclude": ["node_modules"]
}
`as const;
  }

  private jestPath<const F extends string>(file: F) {
    return `tooling/jest-presets/${file}` as const;
  }

  private get getPaths() {
    return {
      browser: this.jestPath("browser/jest-preset.mjs"),
      node: this.jestPath("node/jest-preset.mjs"),
      packageJson: this.jestPath("package.json"),
      tsconfig: this.jestPath("tsconfig.json")
    } as const;
  }

  private jestPresetsTarget<const V extends keyof typeof this.getPaths>(
    target: V
  ) {
    return this.getPaths[target];
  }

  private writeTarget<
    const T extends ReturnType<typeof this.jestPresetsTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.withWs(target, template);
  }

  public async exeJestPresets() {
    const pkgJson = await this.resolveAllDepsJest(
      this.deps,
      this.devDeps,
      this.peerDeps,
      this.localDeps,
      this.workspace
    );
    return Promise.all([
      this.writeTarget(
        "tooling/jest-presets/browser/jest-preset.mjs",
        this.browserTemplate
      ),
      this.writeTarget(
        "tooling/jest-presets/node/jest-preset.mjs",
        this.nodeTemplate
      ),
      this.writeTarget(
        "tooling/jest-presets/package.json",
        JSON.stringify(pkgJson, null, 2)
      ),
      this.writeTarget(
        "tooling/jest-presets/tsconfig.json",
        this.tsconfigTemplate
      )
    ]);
  }
}
