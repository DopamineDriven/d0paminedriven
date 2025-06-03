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
    return `module.exports = {
  roots: ["<rootDir>"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePathIgnorePatterns: [
    "<rootDir>/test/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist"
  ],
  preset: "ts-jest"
};` as const;
  }

  private get nodeTemplate() {
    // prettier-ignore
    return `/**
 * @type {import("ts-jest").ConfigSet}
 */
module.exports = {
  roots: ["<rootDir>"],
  transform: {
    "^.+\\.(m|c)?(j|t)sx?$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "cts",
    "mts",
    "mjs",
    "cjs",
    "js",
    "jsx",
    "json",
    "json5",
    "node"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/test/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist"
  ],
  preset: "ts-jest"
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
      browser: this.jestPath("browser/jest-preset.js"),
      node: this.jestPath("node/jest-preset.js"),
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
        "tooling/jest-presets/browser/jest-preset.js",
        this.browserTemplate
      ),
      this.writeTarget(
        "tooling/jest-presets/node/jest-preset.js",
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
