import type { PkgsRecord } from "@/config/types.ts";
import type { NpmLatest, ToPascalCase } from "@/types/index.ts";
import { Fs } from "@d0paminedriven/fs";

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

  public async resolveAllDeps(
    packages: readonly string[],
    devPackages: readonly string[],
    localDeps: readonly string[],
    localDevDeps: readonly string[],
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
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
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
      dependencies: Object.fromEntries([...localEntries, ...entries]),
      devDependencies: Object.fromEntries([...localDevEntries, ...devEntries])
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
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
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
        devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
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
        devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
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
    const devEntries = await Promise.all(
      devDeps.map(async pkg => {
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
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
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
      prettier: `@${workspace}/prettier-config`
    };
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
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
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
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries])
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
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
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
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
      prettier: `@${workspace}/prettier-config`
    };
  }
  public async resolveAllDepsVitest(
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
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
        const v = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${v}`] as const;
      })
    );
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
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
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
    const entries = await Promise.all(
      deps.map(async pkg => {
        const version = (await this.fetchLatestVersion(pkg)).version;
        return [pkg, `^${version}`] as const;
      })
    );
    const devEntries = await Promise.all(
      devDeps.map(async pkg => {
        if (pkg === "typescript") {
          return [pkg, `^6.0.3`] as const;
        }
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
      peerDependencies: Object.fromEntries(peerEntries),
      dependencies: Object.fromEntries(entries),
      devDependencies: Object.fromEntries([...localEntries, ...devEntries]),
      prettier: `@${workspace}/prettier-config`
    };
  }

  public pnpmWorkspaceYaml({
    babel,
    biome,
    bui,
    clsx,
    cookies,
    csstype,
    cva,
    dd,
    dotenv,
    eslint,
    geist,
    glob,
    jiti,
    jsdom,
    lightning,
    motion,
    next,
    node,
    nyc,
    prettier,
    radix,
    react,
    rolldown,
    sharp,
    styles,
    test,
    ts,
    tsdown,
    tseslint,
    tsgo,
    tslib,
    tsx,
    turbo,
    tw,
    utils,
    vite,
    vitest
  }: PkgsRecord) {
    // prettier-ignore
    return `packages:
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
    babel-plugin-react-compiler: ${babel["babel-plugin-react-compiler"]}
  biome:
    "@biomejs/biome": ${biome["@biomejs/biome"]}
  bui:
    "@base-ui/react": ${bui["@base-ui/react"]}
  clsx:
    clsx: ${clsx.clsx}
  cookies:
    "@types/js-cookie": ${cookies["@types/js-cookie"]}
    js-cookie: ${cookies["js-cookie"]}
  csstype:
    csstype: ${csstype.csstype}
  cva:
    class-variance-authority: ${cva["class-variance-authority"]}
  dd:
    "@d0paminedriven/fs": ${dd["@d0paminedriven/fs"]}
    "@d0paminedriven/turbogen": ${dd["@d0paminedriven/turbogen"]}
  dotenv:
    dotenv: ${dotenv.dotenv}
    dotenv-cli: ${dotenv["dotenv-cli"]}
    dotenv-expand: ${dotenv["dotenv-expand"]}
  eslint:
    "@eslint/compat": ${eslint["@eslint/compat"]}
    "@eslint/config-helpers": ${eslint["@eslint/config-helpers"]}
    "@eslint/js": ${eslint["@eslint/js"]}
    eslint: ${eslint.eslint}
    eslint-plugin-import: ${eslint["eslint-plugin-import"]}
    eslint-plugin-import-x: ${eslint["eslint-plugin-import-x"]}
    eslint-plugin-jsx-a11y: ${eslint["eslint-plugin-jsx-a11y"]}
    eslint-plugin-react: ${eslint["eslint-plugin-react"]}
    eslint-plugin-react-hooks: ${eslint["eslint-plugin-react-hooks"]}
  geist:
    geist: ${geist.geist}
  glob:
    glob: ${glob.glob}
  jiti:
    jiti: ${jiti.jiti}
  jsdom:
    "@types/jsdom": ${jsdom["@types/jsdom"]}
    jsdom: ${jsdom.jsdom}
  lightning:
    unplugin-lightningcss: ${lightning["unplugin-lightningcss"]}
  motion:
    motion: ${motion.motion}
    motion-dom: ${motion["motion-dom"]}
    motion-plus-dom: ${motion["motion-plus-dom"]}
    motion-utils: ${motion["motion-utils"]}
  next:
    "@next/eslint-plugin-next": ${next["@next/eslint-plugin-next"]}
    eslint-config-next: ${next["eslint-config-next"]}
    next: ${next.next}
    next-themes: ${next["next-themes"]}
  node:
    "@types/node": ${node["@types/node"]}
  nyc:
    nyc: ${nyc.nyc}
  prettier:
    "@ianvs/prettier-plugin-sort-imports": ${prettier["@ianvs/prettier-plugin-sort-imports"]}
    prettier: ${prettier.prettier}
    prettier-plugin-tailwindcss: ${prettier["prettier-plugin-tailwindcss"]}
  radix:
    "@radix-ui/react-slot": ${radix["@radix-ui/react-slot"]}
  react:
    "@testing-library/react": ${react["@testing-library/react"]}
    "@types/react": ${react["@types/react"]}
    "@types/react-dom": ${react["@types/react-dom"]}
    react: ${react.react}
    react-dom: ${react["react-dom"]}
    react-resizable-panels: ${react["react-resizable-panels"]}
    vaul: ${react.vaul}
  rolldown:
    rolldown: ${rolldown.rolldown}
    rolldown-plugin-dts: ${rolldown["rolldown-plugin-dts"]}
  sharp:
    sharp: ${sharp.sharp}
  styles:
    autoprefixer: ${styles.autoprefixer}
    postcss: ${styles.postcss}
    postcss-import: ${styles["postcss-import"]}
    postcss-load-config: ${styles["postcss-load-config"]}
  test:
    "@playwright/test": ${test["@playwright/test"]}
  ts:
    typescript: ${ts.typescript}
  tsdown:
    tsdown: ${tsdown.tsdown}
    "@tsdown/css": ${tsdown["@tsdown/css"]}
  tseslint:
    typescript-eslint: ${tseslint["typescript-eslint"]}
  tsgo:
    "@typescript/native-preview": ${tsgo["@typescript/native-preview"]}
  tslib:
    tslib: ${tslib.tslib}
  tsx:
    tsx: ${tsx.tsx}
  turbo:
    eslint-plugin-turbo: ${turbo["eslint-plugin-turbo"]}
    turbo: ${turbo.turbo}
  tw:
    "@tailwindcss/postcss": ${tw["@tailwindcss/postcss"]}
    tailwind-merge: ${tw["tailwind-merge"]}
    tailwindcss: ${tw.tailwindcss}
    tailwindcss-motion: ${tw["tailwindcss-motion"]}
    tw-animate-css: ${tw["tw-animate-css"]}
  utils:
    "@changesets/cli": ${utils["@changesets/cli"]}
    husky: ${utils.husky}
  vite:
    "@vitejs/plugin-react": ${vite["@vitejs/plugin-react"]}
    vite: ${vite.vite}
  vitest:
    "@vitest/coverage-istanbul": ${vitest["@vitest/coverage-istanbul"]}
    "@vitest/ui": ${vitest["@vitest/ui"]}
    vitest: ${vitest.vitest}`
  }
}
