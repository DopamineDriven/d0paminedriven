import { Fs } from "@d0paminedriven/fs";
import type { NpmLatest, ToPascalCase } from "@/types/index.ts";

export class ConfigHandler extends Fs {
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
  }

  public readNpmrcConditional() {
    const path = `.npmrc` as const;
    if (this.exists(path)) {
      const fileContents = this.fileToBuffer(".npmrc").toString("utf-8");
      return [true, fileContents] as const;
    } else return [false, null] as const;
  }

  public get npmrcDefault() {
    // prettier-ignore
    return `enable-pre-post-scripts=true
node-linker=hoisted
auto-install-peers=true
` as const;
  }

  public handleNpmrc() {
    const arrHelper = Array.of<string>();
    const [doesExist, conditionalContents] = this.readNpmrcConditional();
    if (doesExist && typeof conditionalContents === "string") {
      arrHelper.push(conditionalContents);
      const file = conditionalContents;
      try {
        if (/enable-pre-post-scripts=true/g.test(file) === false) {
          arrHelper.push(`enable-pre-post-scripts=true`);
        }
        if (/node-linker=hoisted/g.test(file) === false) {
          arrHelper.push(`node-linker=hoisted`);
        }
        if (/link-workspace-packages=true/g.test(file) === false) {
          arrHelper.push("link-workspace-packages=true");
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new SyntaxError(error.message);
        } else if (error instanceof TypeError) {
          throw new TypeError(error.message);
        } else if (error instanceof RangeError) {
          throw new RangeError(error.message);
        } else if (error instanceof EvalError) {
          throw new EvalError(error.message);
        } else if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          console.error(error);
        }
      } finally {
        this.withWs(
          ".npmrc",
          arrHelper.length >= 1 ? arrHelper.join(`\n`) : conditionalContents
        );
      }
    } else {
      this.withWs(".npmrc", this.npmrcDefault);
    }
  }

  public hasNpmrcConfig() {
    return this.existsSync(".gitignore");
  }

  public isPlainObject(obj: unknown): obj is Record<string, unknown> {
    if (typeof obj === "undefined" || obj == null || typeof obj !== "object")
      return false;
    const proto = Reflect.getPrototypeOf(obj);
    // true for {} and Object.create(null)
    return proto === Object.prototype || proto === null;
  }

  public parseFileFromPath(path: string) {
    return /\//g.test(path) === true
      ? path?.split(/([/])/gim)?.reverse()?.[0]
      : path;
  }

  public kebabToCapital<const V extends string>(kebab: V) {
    return kebab
      .split(/(-)/g)
      .filter((_, i) => i % 2 === 0)
      .map(t => t.substring(0, 1).toUpperCase().concat(t.substring(1)))
      .join("") as ToPascalCase<typeof kebab>;
  }

  public toTitleCase<const T extends string>(value: T) {
    return this.kebabToCapital(value);
  }

  public calSansFont() {
    return this.fetchRemoteWriteLocalLargeFiles(
      "https://raw.githubusercontent.com/DopamineDriven/portfolio-2025/refs/heads/master/apps/web/public/fonts/CalSans-SemiBold.woff2",
      "apps/web/public/fonts/CalSans-SemiBold"
    );
  }

  public calSansRegularFont() {
    return this.fetchRemoteWriteLocalLargeFiles(
      "https://raw.githubusercontent.com/DopamineDriven/portfolio-2025/refs/heads/master/apps/web/public/fonts/CalSans-Regular.woff2",
      "apps/web/public/fonts/CalSans-Regular"
    );
  }

  public async fetchLatestVersion<const T extends string>(target: T) {
    const url = `https://registry.npmjs.org/${encodeURIComponent(target)}/latest`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `failed to fetch ${target}: ${res.status} ${res.statusText}`
      );
    }
    const data = (await res.json()) as NpmLatest;
    return data;
  }

  public async resolveAllDeps(
    packages: readonly string[],
    devPackages: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder",
    port = "3000"
  ) {
    const entries = await Promise.all(
      packages.map(async pkg => {
        const version = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${version}`] as const;
      })
    );
    const devEntries = await Promise.all(
      devPackages.map(async pkg => {
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/web`,
      private: true,
      version: "1.0.0",
      type: "module",
      license: "MIT",
      prettier: `@${workspace}/prettier-config`,
      scripts: {
        dev: `next dev -p ${port} --turbo`,
        build: "next build",
        format: `prettier --write "**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,json,yaml,yml,css,html,md,mdx,graphql,gql}" --ignore-unknown --cache`,
        start: "next start",
        lint: "eslint"
      },
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries])
    };
  }

  public async resolveAllDepsRoot(
    devPackages: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder",
    packageManager = "pnpm",
    repo?: string
  ) {
    const devEntries = await Promise.all(
      devPackages.map(async pkg => {
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    if (repo) {
      return {
        repository: repo,
        name: `@${workspace}/root`,
        license: "MIT",
        private: true,
        packageManager: `${packageManager}`,
        scripts: {
          "build:web": `turbo build --filter=@${workspace}/web`,
          changeset: "changeset",
          clean: "git clean -xdf node_modules",
          dev: "turbo dev --parallel --continue",
          format: `prettier --write "**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,json,yaml,yml,css,html,md,mdx}" --ignore-unknown --cache`,
          lint: "turbo lint",
          prepare: "husky",
          typecheck: "turbo typecheck",
          "clean:house":
            "cd tooling/eslint && git clean -xdf node_modules .turbo && cd ../prettier && git clean -xdf node_modules .turbo && cd ../typescript && git clean -xdf .turbo node_modules && cd ../jest-presets && git clean -xdf node_modules .turbo && cd ../.. && git clean -xdf node_modules pnpm-lock.yaml && pnpm install",
          "generate:base64": "openssl rand -base64 64",
          "generate:hex": "openssl rand -hex 64",
          "npm:registry": "npm set registry https://registry.npmjs.org",
          "run:web": `turbo dev --filter=@${workspace}/web`,
          "latest:pnpm": "corepack use pnpm@latest",
          "update:pnpm": "curl -fsSL https://get.pnpm.io/install.sh | sh -"
        },
        devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
        prettier: `@${workspace}/prettier-config`,
        engines: {
          node: ">=22",
          npm: ">=10",
          pnpm: ">=9"
        }
      };
    } else {
      return {
        name: `@${workspace}/root`,
        license: "MIT",
        private: true,
        packageManager: `${packageManager}`,
        scripts: {
          "build:web": `turbo build --filter=@${workspace}/web`,
          changeset: "changeset",
          clean: "git clean -xdf node_modules",
          dev: "turbo dev --parallel --continue",
          format: `prettier --write "**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,json,yaml,yml,css,html,md,mdx}" --ignore-unknown --cache`,
          lint: "turbo lint",
          prepare: "husky",
          typecheck: "turbo typecheck",
          "clean:house":
            "cd tooling/eslint && git clean -xdf node_modules .turbo && cd ../prettier && git clean -xdf node_modules .turbo && cd ../typescript && git clean -xdf .turbo node_modules && cd ../jest-presets && git clean -xdf node_modules .turbo && cd ../.. && git clean -xdf node_modules pnpm-lock.yaml && pnpm install",
          "generate:base64": "openssl rand -base64 64",
          "generate:hex": "openssl rand -hex 64",
          "npm:registry": "npm set registry https://registry.npmjs.org",
          "run:web": `turbo dev --filter=@${workspace}/web`,
          "latest:pnpm": "corepack use pnpm@latest",
          "update:pnpm": "curl -fsSL https://get.pnpm.io/install.sh | sh -"
        },
        devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
        prettier: `@${workspace}/prettier-config`,
        engines: {
          node: ">=22",
          npm: ">=10",
          pnpm: ">=9"
        }
      };
    }
  }

  public async resolveAllDepsEslint(
    deps: readonly string[],
    devDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const entries = await Promise.all(
      deps.map(async pkg => {
        const version = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${version}`] as const;
      })
    );
    const devEntries = await Promise.all(
      devDeps.map(async pkg => {
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/eslint-config`,
      private: true,
      version: "0.1.0",
      type: "module",
      exports: {
        "./base": "./base.mjs",
        "./next": "./next.mjs",
        "./react": "./react.mjs"
      },
      license: "MIT",
      scripts: {
        clean: "git clean -xdf .cache .turbo node_modules",
        format: "prettier --check . --ignore-path ../../.gitignore",
        typecheck: "tsc --noEmit"
      },
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
      prettier: `@${workspace}/prettier-config`
    };
  }

  public async resolveAllDepsJest(
    deps: readonly string[],
    devDeps: readonly string[],
    peerDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const entries = await Promise.all(
      deps.map(async pkg => {
        const version = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${version}`] as const;
      })
    );
    const devEntries = await Promise.all(
      devDeps.map(async pkg => {
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
    const peerEntries = await Promise.all(
      peerDeps.map(async pkg => {
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `>=${v}`] as const;
      })
    );
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/jest-presets`,
      version: "1.0.0",
      private: true,
      license: "MIT",
      files: ["browser/jest-preset.js", "node/jest-preset.js"],
      scripts: {
        clean: "git clean -xdf node_modules"
      },
      peerDependencies: Object.fromEntries(peerEntries),
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
      prettier: `@${workspace}/prettier-config`
    };
  }

  public async resolveAllDepsPrettier(
    deps: readonly string[],
    devDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const entries = await Promise.all(
      deps.map(async pkg => {
        const version = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${version}`] as const;
      })
    );
    const devEntries = await Promise.all(
      devDeps.map(async pkg => {
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/prettier-config`,
      private: true,
      version: "0.1.0",
      type: "module",
      exports: {
        ".": "./index.mjs"
      },
      scripts: {
        clean: "git clean -xdf .turbo node_modules",
        format: "prettier --check . --ignore-path ../../.gitignore",
        typecheck: "tsc --noEmit"
      },
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
      prettier: `@${workspace}/prettier-config`
    };
  }
}
