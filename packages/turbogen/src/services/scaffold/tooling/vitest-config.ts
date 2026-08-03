import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

/* eslint-disable @typescript-eslint/await-thenable */

export class VitestScaffolder {
  constructor(
    public baseProps: PromptPropsBase,
    protected configHandler: ConfigHandler
  ) {}

  private get workspace() {
    return this.baseProps.workspace;
  }

  private get collectCoverageFiles() {
    // prettier-ignore
    return `import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

async function collectCoverageFiles() {
  try {
    // Define the patterns to search
    const patterns = ["../../apps/*", "../../packages/*"];

    // Define the destination directory (you can change this as needed)
    const destinationDir = path.join(process.cwd(), "coverage/raw");

    // Create the destination directory if it doesn't exist
    await fs.mkdir(destinationDir, { recursive: true });

    // Arrays to collect all directories and directories with coverage.json
    const allDirectories = [];
    const directoriesWithCoverage = [];

    // Process each pattern
    for (const pattern of patterns) {
      // Find all paths matching the pattern
      const matches = await glob(pattern);

      // Filter to only include directories
      for (const match of matches) {
        const stats = await fs.stat(match);

        if (stats.isDirectory()) {
          allDirectories.push(match);
          const coverageFilePath = path.join(match, "coverage.json");

          // Check if coverage.json exists in this directory
          try {
            await fs.access(coverageFilePath);

            // File exists, add to list of directories with coverage
            directoriesWithCoverage.push(match);

            // Copy it to the destination with a unique name
            const directoryName = path.basename(match);
            const destinationFile = path.join(
              destinationDir,
              \`\${directoryName}.json\`
            );

            await fs.copyFile(coverageFilePath, destinationFile);
          } catch (err) {
            typeof err === "string"
              ? console.log(err)
              : err instanceof Error
                ? console.log(err.message)
                : console.log(JSON.stringify(err, null, 2));
            // File doesn't exist in this directory, skip
          }
        }
      }
    }

    // Create clean patterns for display (without any "../" prefixes)
    const replaceDotPatterns = (str: string) => {
      // Normalize and remove any ".." or "." path segments for safe display
      const normalized = path.normalize(str);
      const parts = normalized.split(path.sep);
      const filteredParts = parts.filter(part => part !== ".." && part !== ".");
      return filteredParts.join(path.sep);
    };

    if (directoriesWithCoverage.length > 0) {
      console.log(
        \`Found coverage.json in: \${directoriesWithCoverage
          .map(replaceDotPatterns)
          .join(", ")}\`
      );
    }

    console.log(\`Coverage collected into: \${path.join(process.cwd())}\`);
  } catch (error) {
    console.error("Error collecting coverage files:", error);
  }
}

collectCoverageFiles().catch(_err => {});
` as const;
  }

  private get indexTemplate() {
    // prettier-ignore
    return `import { resolve } from "node:path";
import type { ViteUserConfigExport } from "vitest/config";
import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export const sharedConfig = (cwd = process.cwd()) =>
  defineConfig({
    plugins: [reactPlugin({ include: /\\.spec\\.tsx?$/ })],
    root: cwd,
    resolve: {
      alias: {
        "@": resolve(cwd, "./src")
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      coverage: {
        provider: "istanbul",
        reporter: [
          [
            "json",
            {
              file: \`../coverage.json\`
            }
          ]
        ],
        enabled: true
      }
    }
  } satisfies ViteUserConfigExport);

declare global {
  interface JSON {
    parse<T = unknown>(
      text: string,
      reviver?: (this: any, key: string, value: any) => any
    ): T;
  }
  interface Body {
    json<T = unknown>(): Promise<T>;
  }
  interface Response {
    json<T = unknown>(): Promise<T>;
  }
  interface ObjectConstructor {
    keys<T = object>(
      o: T
    ): (keyof T extends infer K
      ? K extends string
        ? K
        : K extends number
          ? \`\${K}\`
          : never
      : never)[];
  }
}
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

  private get tsdownDevScaffold() {
    // prettier-ignore
    return `import { relative } from "node:path";
import type { InlineConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: [
        "index.ts"
      ],
      cwd: process.cwd(),
      target: ["node26"],
      fixedExtension: false,
      dts: { tsgo: true },
      watch: true,
      format: ["esm"],
      sourcemap: true,
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      clean: true,
      outDir: "dist",
      unbundle: true
    }) satisfies InlineConfig
);
` as const;
  }

  private get turboConfig() {
    // prettier-ignore
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
        "tsdown.config.ts",
        "scripts/collect-coverage-files.ts"
      ]
    }
  }
}
` as const;
  }

  private get deps() {
    return [
      "@vitejs/plugin-react",
      "@vitest/coverage-istanbul",
      "@vitest/ui",
      "vite",
      "vitest"
    ] as const;
  }

  private get devDeps() {
    return [
      "@typescript/native-preview",
      "@types/node",
      "typescript",
      "eslint",
      "glob",
      "jiti",
      "nyc",
      "prettier",
      "tsdown",
      "tslib",
      "tsx",
      "typescript-eslint"
    ] as const;
  }

  private get localDeps() {
    return [
      `@${this.workspace}/eslint-config`,
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`
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

  private vitestPath<const F extends string>(file: F) {
    return `tooling/vitest/${file}` as const;
  }

  private get getPaths() {
    return {
      index: this.vitestPath("index.ts"),
      packageJson: this.vitestPath("package.json"),
      tsconfig: this.vitestPath("tsconfig.json"),
      eslint: this.vitestPath("eslint.config.ts"),
      tsdown: this.vitestPath("tsdown.config.ts"),
      tsdownDev: this.vitestPath("tsdown-dev.config.ts"),
      turbo: this.vitestPath("turbo.json"),
      script: this.vitestPath("script/collect-coverage-files.ts")
    } as const;
  }

  private vitestTarget<const V extends keyof typeof this.getPaths>(
    target: V
  ) {
    return this.getPaths[target];
  }

  private writeTarget<
    const T extends ReturnType<typeof this.vitestTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.configHandler.withWs(target, template);
  }

  public async exeVitest() {
    const pkgJson = await this.configHandler.resolveAllDepsVitest(
      this.deps,
      this.devDeps,
      this.localDeps,
      this.workspace
    );
    return Promise.all([
      this.writeTarget("tooling/vitest/index.ts", this.indexTemplate),
      this.writeTarget(
        "tooling/vitest/package.json",
        JSON.stringify(pkgJson, null, 2)
      ),
      this.writeTarget("tooling/vitest/tsconfig.json", this.tsconfigTemplate),
      this.writeTarget("tooling/vitest/eslint.config.ts", this.eslintScaffold),
      this.writeTarget("tooling/vitest/tsdown.config.ts", this.tsdownScaffold),
      this.writeTarget("tooling/vitest/turbo.json", this.turboConfig),
      this.writeTarget(
        "tooling/vitest/tsdown-dev.config.ts",
        this.tsdownDevScaffold
      ),
      this.writeTarget(
        "tooling/vitest/script/collect-coverage-files.ts",
        this.collectCoverageFiles
      )
    ]);
  }
}
