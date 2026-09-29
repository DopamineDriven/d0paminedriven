import type { NpmLatest, ToPascalCase } from "@/types/index.ts";
import { Fs } from "@d0paminedriven/fs";

export class ConfigHandler extends Fs {
  protected m = new Map<keyof typeof this.CATALOG_REGISTRY, string>();
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
  }

  protected safeErrMsg(err: unknown) {
    if (err instanceof Error) {
      return err.message;
    } else if (typeof err === "object" && err != null) {
      return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    } else if (typeof err === "string") {
      return err;
    } else if (typeof err === "number") {
      return err.toPrecision(5);
    } else if (typeof err === "boolean") {
      return `${err}`;
    } else return String(err);
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
          throw error;
        } else if (error instanceof TypeError) {
          throw error;
        } else if (error instanceof RangeError) {
          throw error;
        } else if (error instanceof EvalError) {
          throw error;
        } else if (error instanceof Error) {
          throw error;
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

  public async calSansFont() {
    return await this.fetchRemoteWriteLocalLargeFiles(
      "https://raw.githubusercontent.com/DopamineDriven/portfolio-2025/refs/heads/master/apps/web/public/fonts/CalSans-SemiBold.woff2",
      "apps/web/public/fonts/CalSans-SemiBold"
    );
  }

  public async calSansRegularFont() {
    return await this.fetchRemoteWriteLocalLargeFiles(
      "https://raw.githubusercontent.com/DopamineDriven/portfolio-2025/refs/heads/master/apps/web/public/fonts/CalSans-Regular.woff2",
      "apps/web/public/fonts/CalSans-Regular"
    );
  }

  public async fetchLatestVersion<const T extends string>(target: T) {
    const url = `https://registry.npmjs.org/${encodeURIComponent(target)}/latest`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`failed to fetch ${target}: ${res.status} ${res.statusText}`);
      /** */
    }
    const data = (await res.json()) as NpmLatest;
    return data;
  }

  public arrToArrOfArrs = <const T = unknown>(
    arr: readonly T[],
    int = 10,
    agg = Array.of<T[]>()
  ) => {
    for (let i = 0; i < arr.length; i += int) {
      agg.push(arr.slice(i, i + int));
    }
    return agg;
  };

  public async resolveCentralCatalog() {
    const vvv = Object.keys(this.CATALOG_REGISTRY);
    try {
      for (const pkg of vvv) {
        if (pkg === "typescript") {
          this.m.set(pkg, `^6.0.3`);
          continue;
        }
        const v = (await this.fetchLatestVersion(pkg)).version;
        this.m.set(pkg, `^${v}`);
      }
    } catch (err) {
      throw new Error(this.safeErrMsg(err));
    } finally {
      // prettier-ignore
      const yamlFile= `packages:
  - apps/*
  - packages/*
  - tooling/*

enablePrePostScripts: true
nodeLinker: hoisted
autoInstallPeers: true
minimumReleaseAge: 0
trustPolicy: "off"
trustLockfile: true
blockExoticSubdeps: false
ignorePatchFailures: true
dangerouslyAllowAllBuilds: true
verifyStoreIntegrity: false

catalogs:
  babel:
    babel-plugin-react-compiler: ${this.m.get("babel-plugin-react-compiler")}
  biome:
    "@biomejs/biome": ${this.m.get("@biomejs/biome")}
  bui:
    "@base-ui/react": ${this.m.get("@base-ui/react")}
  clsx:
    clsx: ${this.m.get("clsx")}
  cookies:
    "@types/js-cookie": ${this.m.get("@types/js-cookie")}
    js-cookie: ${this.m.get("js-cookie")}
  csstype:
    csstype: ${this.m.get("csstype")}
  cva:
    class-variance-authority: ${this.m.get("class-variance-authority")}
  dd:
    "@d0paminedriven/fs": ${this.m.get("@d0paminedriven/fs")}
    "@d0paminedriven/turbogen": ${this.m.get("@d0paminedriven/turbogen")}
  dotenv:
    dotenv: ${this.m.get("dotenv")}
    dotenv-cli: ${this.m.get("dotenv-cli")}
    dotenv-expand: ${this.m.get("dotenv-expand")}
  eslint:
    "@eslint/compat": ${this.m.get("@eslint/compat")}
    "@eslint/config-helpers": ${this.m.get("@eslint/config-helpers")}
    "@eslint/js": ${this.m.get("@eslint/js")}
    eslint: ${this.m.get("eslint")}
    eslint-plugin-import: ${this.m.get("eslint-plugin-import")}
    eslint-plugin-import-x: ${this.m.get("eslint-plugin-import-x")}
    eslint-plugin-jsx-a11y: ${this.m.get("eslint-plugin-jsx-a11y")}
    eslint-plugin-react: ${this.m.get("eslint-plugin-react")}
    eslint-plugin-react-hooks: ${this.m.get("eslint-plugin-react-hooks")}
  geist:
    geist: ${this.m.get("geist")}
  glob:
    glob: ${this.m.get("glob")}
  jiti:
    jiti: ${this.m.get("jiti")}
  jsdom:
    "@types/jsdom": ${this.m.get("@types/jsdom")}
    jsdom: ${this.m.get("jsdom")}
  lightning:
    unplugin-lightningcss: ${this.m.get("unplugin-lightningcss")}
  motion:
    motion: ${this.m.get("motion")}
    motion-dom: ${this.m.get("motion-dom")}
    motion-plus-dom: ${this.m.get("motion-plus-dom")}
    motion-utils: ${this.m.get("motion-utils")}
  next:
    "@next/eslint-plugin-next": ${this.m.get("@next/eslint-plugin-next")}
    eslint-config-next: ${this.m.get("eslint-config-next")}
    next: ${this.m.get("next")}
    next-themes: ${this.m.get("next-themes")}
  node:
    "@types/node": ${this.m.get("@types/node")}
  nyc:
    nyc: ${this.m.get("nyc")}
  prettier:
    "@ianvs/prettier-plugin-sort-imports": ${this.m.get("@ianvs/prettier-plugin-sort-imports")}
    prettier: ${this.m.get("prettier")}
    prettier-plugin-tailwindcss: ${this.m.get("prettier-plugin-tailwindcss")}
  radix:
    "@radix-ui/react-slot": ${this.m.get("@radix-ui/react-slot")}
  react:
    "@testing-library/react": ${this.m.get("@testing-library/react")}
    "@types/react": ${this.m.get("@types/react")}
    "@types/react-dom": ${this.m.get("@types/react-dom")}
    react: ${this.m.get("react")}
    react-dom: ${this.m.get("react-dom")}
    react-resizable-panels: ${this.m.get("react-resizable-panels")}
    vaul: ${this.m.get("vaul")}
  rolldown:
    rolldown: ${this.m.get("rolldown")}
    rolldown-plugin-dts: ${this.m.get("rolldown-plugin-dts")}
  sharp:
    sharp: ${this.m.get("sharp")}
  styles:
    autoprefixer: ${this.m.get("autoprefixer")}
    postcss: ${this.m.get("postcss")}
    postcss-import: ${this.m.get("postcss-import")}
    postcss-load-config: ${this.m.get("postcss-load-config")}
  test:
    "@playwright/test": ${this.m.get("@playwright/test")}
  ts:
    typescript: ${this.m.get("typescript")}
  tsdown:
    tsdown: ${this.m.get("tsdown")}
    "@tsdown/css": ${this.m.get("@tsdown/css")}
  tseslint:
    typescript-eslint: ${this.m.get("typescript-eslint")}
  tsgo:
    "@typescript/native-preview": ${this.m.get("@typescript/native-preview")}
  tslib:
    tslib: ${this.m.get("tslib")}
  tsx:
    tsx: ${this.m.get("tsx")}
  turbo:
    eslint-plugin-turbo: ${this.m.get('eslint-plugin-turbo')}
    turbo: ${this.m.get("turbo")}
  tw:
    "@tailwindcss/postcss": ${this.m.get("@tailwindcss/postcss")}
    tailwind-merge: ${this.m.get("tailwind-merge")}
    tailwindcss: ${this.m.get("tailwindcss")}
    tailwindcss-motion: ${this.m.get("tailwindcss-motion")}
    tw-animate-css: ${this.m.get("tw-animate-css")}
  utils:
    "@changesets/cli": ${this.m.get("@changesets/cli")}
    husky: ${this.m.get("husky")}
  vite:
    "@vitejs/plugin-react": ${this.m.get("@vitejs/plugin-react")}
    vite: ${this.m.get("vite")}
  vitest:
    "@vitest/coverage-istanbul": ${this.m.get("@vitest/coverage-istanbul")}
    "@vitest/ui": ${this.m.get("@vitest/ui")}
    vitest: ${this.m.get("vitest")}`;
      this.withWs("pnpm-workspace.yaml", yamlFile);
    }
  }

  public resolveCatalogs(data: readonly string[]) {
    const x = Array.of<[string, string]>();
    for (const d of data) {
      if (d in this.CATALOG_REGISTRY) {
        x.push([
          d,
          this.CATALOG_REGISTRY[d as keyof typeof this.CATALOG_REGISTRY]
        ]);
      } else {
        throw new Error(`${d} not in catalog`);
      }
    }
    return x;
  }

  public async resolveAllDeps(
    packages: readonly string[],
    devPackages: readonly string[],
    localDeps: readonly string[],
    localDevDeps: readonly string[],
    workspace = "placeholder",
    port = "3000"
  ) {
    const depCatalogs = this.resolveCatalogs(packages);
    const devDepCatalogs = this.resolveCatalogs(devPackages);
    const localDevEntries = localDevDeps.map(p => [p, "workspace:*"] as const);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/web`,
      private: true,
      version: "1.0.0",
      type: "module",
      license: "MIT",
      prettier: `@${workspace}/prettier-config`,
      scripts: {
        dev: `next dev -p ${port}`,
        build: "next build",
        format: `prettier --write "**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,json,yaml,yml,css,html,md,mdx,graphql,gql}" --ignore-unknown --cache`,
        start: "next start",
        lint: "eslint",
        typecheck: "tsgo --noEmit",
        typegen: "next typegen"
      },
      dependencies: Object.fromEntries([...localEntries, ...depCatalogs]),
      devDependencies: Object.fromEntries([
        ...localDevEntries,
        ...devDepCatalogs
      ])
    };
  }

  public async resolveAllDepsRoot(
    devPackages: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder",
    packageManager = "pnpm",
    repo?: string
  ) {
    const devCatalogs = this.resolveCatalogs(devPackages);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    if (repo) {
      return {
        repository: repo,
        name: `@${workspace}/root`,
        license: "MIT",
        private: true,
        packageManager: `${packageManager}`,
        scripts: {
          "build:eslint": `turbo build --filter=@${workspace}/eslint-config`,
          "build:prettier": `turbo build --filter=@${workspace}/prettier-config`,
          "build:ui": `turbo build --filter=@${workspace}/ui`,
          "build:web": `turbo build --filter=@${workspace}/web`,
          "build:types": `turbo build --filter=@${workspace}/types`,
          "build:vitest": `turbo build --filter=@${workspace}/vitest-config`,
          "build:targeted":
            "pnpm build:eslint && pnpm build:prettier && pnpm build:vitest && pnpm build:types && pnpm build:ui",
          changeset: "changeset",
          clean: "git clean -xdf node_modules",
          dev: "turbo dev --parallel --continue",
          format: `prettier --write "**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,json,yaml,yml,css,html,md,mdx}" --ignore-unknown --cache`,
          lint: "turbo lint",
          prepare: "husky",
          "clean:house": "bash ./manage.sh clean:house",
          "postclean:house": `pnpm --filter=@${workspace}/web typegen`,
          "list:packages": "bash ./manage.sh list",
          "generate:base64": "openssl rand -base64 64",
          "generate:hex": "openssl rand -hex 64",
          "run:web": `turbo dev --filter=@${workspace}/web`
        },
        devDependencies: Object.fromEntries([...localEntries, ...devCatalogs]),
        prettier: `@${workspace}/prettier-config`,
        engines: {
          node: ">=24",
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
          "build:eslint": `turbo build --filter=@${workspace}/eslint-config`,
          "build:prettier": `turbo build --filter=@${workspace}/prettier-config`,
          "build:ui": `turbo build --filter=@${workspace}/ui`,
          "build:web": `turbo build --filter=@${workspace}/web`,
          "build:types": `turbo build --filter=@${workspace}/types`,
          "build:vitest": `turbo build --filter=@${workspace}/vitest-config`,
          "build:targeted":
            "pnpm build:eslint && pnpm build:prettier && pnpm build:vitest && pnpm build:types && pnpm build:ui",
          changeset: "changeset",
          clean: "git clean -xdf node_modules",
          dev: "turbo dev --parallel --continue",
          format: `prettier --write "**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,json,yaml,yml,css,html,md,mdx}" --ignore-unknown --cache`,
          lint: "turbo lint",
          prepare: "husky",
          typecheck: "turbo typecheck",
          "clean:house": "bash ./manage.sh clean:house",
          "postclean:house": `pnpm --filter=@${workspace}/web typegen`,
          "list:packages": "bash ./manage.sh list",
          "generate:base64": "openssl rand -base64 64",
          "generate:hex": "openssl rand -hex 64",
          "run:web": `turbo dev --filter=@${workspace}/web`
        },
        devDependencies: Object.fromEntries([...localEntries, ...devCatalogs]),
        prettier: `@${workspace}/prettier-config`,
        engines: {
          node: ">=24",
          npm: ">=10",
          pnpm: ">=9"
        }
      };
    }
  }
  public normalizeDomain(s: string) {
    const raw = s.trim();
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
      ? raw
      : `https://${raw}`;
    const domain = URL.canParse(candidate) ? new URL(candidate).hostname : raw;
    return domain;
  }
  public async resolveAllDepsTypesPkg(
    devDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const devDepCatalogs = this.resolveCatalogs(devDeps);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/types`,
      version: "0.1.0",
      description: "convenient type utils",
      publishConfig: {
        access: "public",
        typesVersions: {
          "*": {
            "*": ["dist/index.d.ts"],
            utils: ["dist/utils.d.ts"]
          }
        }
      },
      license: "MIT",
      source: "src/index.ts",
      typesVersions: {
        "*": {
          "*": ["dist/index.d.ts"],
          utils: ["dist/utils.d.ts"]
        }
      },
      type: "module",
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      sideEffects: false,
      files: ["dist/**/*.{js,cjs,mjs,d.ts,d.cts,d.mts}"],
      exports: {
        ".": "./dist/index.js",
        "./utils": "./dist/utils.js"
      },
      scripts: {
        build: "tsdown",
        dev: "pnpm build",
        lint: "eslint",
        typecheck: "tsgo --noEmit",
        format:
          'prettier --write "src/**/*.{ts,cts,mts,js,mjs,cjs,json,yaml,yml}" --ignore-unknown --cache',
        clean: "git clean -xdf .turbo dist node_modules"
      },
      devDependencies: Object.fromEntries([...localEntries, ...devDepCatalogs]),
      prettier: `@${workspace}/prettier-config`
    };
  }

  public async resolveAllDepsEslint(
    deps: readonly string[],
    devDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const depCatalogs = this.resolveCatalogs(deps);
    const devDepCatalogs = this.resolveCatalogs(devDeps);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/eslint-config`,
      version: "0.1.0",
      type: "module",
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      sideEffects: false,
      files: ["dist/**/*.{js,cjs,mjs,d.ts,d.cts,d.mts}"],
      publishConfig: {
        access: "public",
        typesVersions: {
          "*": {
            "*": ["dist/index.d.ts"],
            base: ["dist/base.d.ts"],
            next: ["dist/next.d.ts"],
            react: ["dist/react.d.ts"]
          }
        }
      },
      typesVersions: {
        "*": {
          "*": ["dist/index.d.ts"],
          base: ["dist/base.d.ts"],
          next: ["dist/next.d.ts"],
          react: ["dist/react.d.ts"]
        }
      },
      source: "index.ts",
      exports: {
        ".": "./dist/index.js",
        "./base": "./dist/base.js",
        "./next": "./dist/next.js",
        "./react": "./dist/react.js"
      },
      license: "MIT",
      scripts: {
        build: "tsdown",
        clean: "git clean -xdf .cache .turbo node_modules dist",
        lint: "eslint",
        format: "prettier --check . --ignore-path ../../.gitignore",
        typecheck: "tsgo --noEmit"
      },
      dependencies: Object.fromEntries(depCatalogs),
      devDependencies: Object.fromEntries([...localEntries, ...devDepCatalogs])
    };
  }

  public CATALOG_REGISTRY = {
    "@base-ui/react": "catalog:bui",
    "@biomejs/biome": "catalog:biome",
    "@changesets/cli": "catalog:utils",
    "@d0paminedriven/fs": "catalog:dd",
    "@d0paminedriven/turbogen": "catalog:dd",
    "@eslint/compat": "catalog:eslint",
    "@eslint/config-helpers": "catalog:eslint",
    "@eslint/js": "catalog:eslint",
    "@ianvs/prettier-plugin-sort-imports": "catalog:prettier",
    "@next/eslint-plugin-next": "catalog:next",
    "@playwright/test": "catalog:test",
    "@radix-ui/react-slot": "catalog:radix",
    "@tailwindcss/postcss": "catalog:tw",
    "@testing-library/react": "catalog:react",
    "@tsdown/css": "catalog:tsdown",
    "@types/js-cookie": "catalog:cookies",
    "@types/jsdom": "catalog:jsdom",
    "@types/node": "catalog:node",
    "@types/react": "catalog:react",
    "@types/react-dom": "catalog:react",
    "@typescript/native-preview": "catalog:tsgo",
    "@vitejs/plugin-react": "catalog:vite",
    "@vitest/coverage-istanbul": "catalog:vitest",
    "@vitest/ui": "catalog:vitest",
    autoprefixer: "catalog:styles",
    "babel-plugin-react-compiler": "catalog:babel",
    "class-variance-authority": "catalog:cva",
    clsx: "catalog:clsx",
    csstype: "catalog:csstype",
    dotenv: "catalog:dotenv",
    "dotenv-cli": "catalog:dotenv",
    "dotenv-expand": "catalog:dotenv",
    eslint: "catalog:eslint",
    "eslint-config-next": "catalog:next",
    "eslint-plugin-import": "catalog:eslint",
    "eslint-plugin-import-x": "catalog:eslint",
    "eslint-plugin-jsx-a11y": "catalog:eslint",
    "eslint-plugin-react": "catalog:eslint",
    "eslint-plugin-react-hooks": "catalog:eslint",
    "eslint-plugin-turbo": "catalog:turbo",
    geist: "catalog:geist",
    glob: "catalog:glob",
    husky: "catalog:utils",
    jiti: "catalog:jiti",
    "js-cookie": "catalog:cookies",
    jsdom: "catalog:jsdom",
    motion: "catalog:motion",
    "motion-dom": "catalog:motion",
    "motion-plus-dom": "catalog:motion",
    "motion-utils": "catalog:motion",
    next: "catalog:next",
    "next-themes": "catalog:next",
    nyc: "catalog:nyc",
    postcss: "catalog:styles",
    "postcss-import": "catalog:styles",
    "postcss-load-config": "catalog:styles",
    prettier: "catalog:prettier",
    "prettier-plugin-tailwindcss": "catalog:prettier",
    react: "catalog:react",
    "react-dom": "catalog:react",
    "react-resizable-panels": "catalog:react",
    rolldown: "catalog:rolldown",
    "rolldown-plugin-dts": "catalog:rolldown",
    sharp: "catalog:sharp",
    "tailwind-merge": "catalog:tw",
    tailwindcss: "catalog:tw",
    "tailwindcss-motion": "catalog:tw",
    tsdown: "catalog:tsdown",
    tslib: "catalog:tslib",
    tsx: "catalog:tsx",
    turbo: "catalog:turbo",
    "tw-animate-css": "catalog:tw",
    typescript: "catalog:ts",
    "typescript-eslint": "catalog:tseslint",
    "unplugin-lightningcss": "catalog:lightning",
    vaul: "catalog:react",
    vite: "catalog:vite",
    vitest: "catalog:vitest"
  } as const;

  public async resolveAllDepsPrettier(
    deps: readonly string[],
    devDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const depCatalogs = this.resolveCatalogs(deps);
    const devDepCatalogs = this.resolveCatalogs(devDeps);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/prettier-config`,
      version: "0.1.0",
      type: "module",
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      sideEffects: false,
      files: ["dist/**/*.{js,cjs,mjs,d.ts,d.cts,d.mts}"],
      publishConfig: {
        access: "public",
        typesVersions: {
          "*": {
            "*": ["dist/index.d.ts"]
          }
        }
      },
      typesVersions: {
        "*": {
          "*": ["dist/index.d.ts"]
        }
      },
      source: "index.ts",
      exports: {
        ".": "./dist/index.js"
      },
      scripts: {
        build: "tsdown",
        clean: "git clean -xdf .turbo node_modules dist",
        lint: "eslint",
        format: "prettier --check . --ignore-path ../../.gitignore",
        typecheck: "tsgo --noEmit"
      },
      dependencies: Object.fromEntries(depCatalogs),
      devDependencies: Object.fromEntries([...localEntries, ...devDepCatalogs]),
      prettier: `@${workspace}/prettier-config`
    };
  }
  public async resolveAllDepsVitest(
    deps: readonly string[],
    devDeps: readonly string[],
    localDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const depCatalogs = this.resolveCatalogs(deps);
    const devDepCatalogs = this.resolveCatalogs(devDeps);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
    return {
      name: `@${workspace}/vitest-config`,
      version: "0.1.0",
      type: "module",
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      sideEffects: false,
      files: ["dist/**/*.{js,cjs,mjs,d.ts,d.cts,d.mts}"],
      publishConfig: {
        access: "public",
        typesVersions: {
          "*": {
            "*": ["dist/index.d.ts"]
          }
        }
      },
      typesVersions: {
        "*": {
          "*": ["dist/index.d.ts"]
        }
      },
      source: "index.ts",
      exports: {
        ".": "./dist/index.js"
      },
      license: "MIT",
      scripts: {
        build: "tsdown",
        dev: "tsdown --config tsdown-dev.config.ts",
        lint: "eslint",
        clean: "git clean -xdf .cache .turbo node_modules dist",
        format:
          'prettier --write "src/**/*.{ts,cts,mts,js,mjs,cjs,json,yaml,yml}" --ignore-unknown --cache',
        typecheck: "tsgo --noEmit"
      },
      dependencies: Object.fromEntries(depCatalogs),
      devDependencies: Object.fromEntries([...localEntries, ...devDepCatalogs]),
      prettier: `@${workspace}/prettier-config`
    };
  }
  public async resolveAllDepsUIPkg(
    deps: readonly string[],
    devDeps: readonly string[],
    localDeps: readonly string[],
    peerDeps: readonly string[],
    workspace = "placeholder"
  ) {
    const depCatalogs = this.resolveCatalogs(deps);
    const devDepCatalogs = this.resolveCatalogs(devDeps);
    const peerDepCatalogs = this.resolveCatalogs(peerDeps);
    const localEntries = localDeps.map(p => [p, "workspace:*"] as const);

    return {
      name: `@${workspace}/ui`,
      version: "0.1.0",
      description: "convenient ui helpers",
      files: ["dist/**/*.{js,mjs,cjs,d.mts,d.ts,d.cts,css}"],
      license: "MIT",
      sideEffecs: ["**/*.css"],
      type: "module",
      typesVersions: {
        "*": {
          "*": ["dist/*.d.ts", "dist/*.d.cts", "dist/*/index.d.ts"],
          "globals.css": ["dist/globals.d.ts"],
          icons: ["dist/icons/index.d.ts", "dist/icons/*.d.ts"],
          lib: ["dist/lib/*.d.ts"],
          ui: ["dist/ui/*.d.ts"]
        }
      },
      publishConfig: {
        access: "public",
        typesVersions: {
          "*": {
            "*": ["dist/*.d.ts", "dist/*.d.cts", "dist/*/index.d.ts"],
            "globals.css": ["dist/globals.d.ts"],
            icons: ["dist/icons/index.d.ts", "dist/icons/*.d.ts"],
            lib: ["dist/lib/*.d.ts"],
            ui: ["dist/ui/*.d.ts"]
          }
        }
      },
      source: "src/index.ts",
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      exports: {
        ".": "./dist/index.js",
        "./globals.css": "./dist/globals.css",
        "./icons": "./dist/icons/index.js",
        "./icons/*": "./dist/icons/*.js",
        "./lib/*": "./dist/lib/*.js",
        "./ui/*": "./dist/ui/*.js"
      },
      scripts: {
        lint: "eslint",
        dev: "pnpm build",
        prebuild: "rm -rf dist",
        postbuild: "tsx src/services/postbuild.ts flag-check",
        build: "tsdown",
        typecheck: "tsgo --noEmit",
        clean: "git clean -xdf dist node_modules",
        types: "tsc --emitDeclarationOnly"
      },
      peerDependencies: Object.fromEntries(peerDepCatalogs),
      dependencies: Object.fromEntries(depCatalogs),
      devDependencies: Object.fromEntries([...localEntries, ...devDepCatalogs]),
      prettier: `@${workspace}/prettier-config`
    };
  }
}
