import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

/* eslint-disable @typescript-eslint/await-thenable */

export class UIPackageScaffolder {
  constructor(
    public baseProps: PromptPropsBase,
    protected handler: ConfigHandler
  ) {}

  private get workspace() {
    return this.baseProps.workspace;
  }

  private get cssTemplate() {
    // prettier-ignore
    return `@import "tailwindcss/theme.css" layer(theme) prefix(ui);
@import "tailwindcss/utilities.css" layer(utilities) prefix(ui) source("../src");
@custom-variant svg (& svg);
@custom-variant has-svg (&:has(> svg));
@custom-variant dark (&:where([data-theme=dark], .dark, [data-theme=dark] *));

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.14 0.0044 285.82);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.14 0.0044 285.82);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.14 0.0044 285.82);
  --color-primary: oklch(0.21 0.0059 285.88);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-secondary: oklch(0.97 0.0013 286.38);
  --color-secondary-foreground: oklch(0.21 0.0059 285.88);
  --color-muted: oklch(0.97 0.0013 286.38);
  --color-muted-foreground: oklch(0.55 0.0137 285.94);
  --color-accent: oklch(0.97 0.0013 286.38);
  --color-accent-foreground: oklch(0.21 0.0059 285.88);
  --color-destructive: oklch(0.64 0.2078 25.33);
  --color-destructive-foreground: oklch(0.98 0 0);
  --color-border: oklch(0.92 0.004 286.32);
  --color-input: oklch(0.92 0.004 286.32);
  --color-ring: oklch(0.21 0.0059 285.88);
  --color-chart-1: oklch(0.546 0.2153 262.87);
  --color-chart-2: oklch(0.5409 0.2468 292.95);
  --color-chart-3: oklch(0.6624 0.2895 320.92);
  --color-chart-4: oklch(0.6924 0.1426 165.69);
  --color-chart-5: oklch(0.8372 0.1644 84.53);
  --color-hue-0: oklch(0.9434 0.199 105.96);
  --color-hue-1: oklch(0.6477 0.263 359.98);
  --color-hue-2: oklch(0.6404 0.300 324.36);
  --color-hue-3: oklch(0.5636 0.292 301.63);
  --color-hue-4: oklch(0.5898 0.211 259.36);
  --color-hue-5: oklch(0.8203 0.141 210.49);
  --color-hue-6: oklch(0.8842 0.107 168.47);

  --radius-sm: 0.25rem;

  --container-8xl: 96rem;
  --container-9xl: 120rem;
  --container-10xl: 173.75rem;

  --spacing-8xl: 96rem;
  --spacing-9xl: 120rem;
  --spacing-10xl: 173.75rem;

  --perspective-1000: 1000px;

  --text-sxs: 0.625rem;
  --text-sxs--line-height: calc(0.875 / 0.625);
  --text-xxs: 0.5rem;
  --text-xxs--line-height: calc(0.75 / 0.5);

  --animate-shimmer: shimmer 3s cubic-bezier(0.4, 0.7, 0.6, 1) infinite;
  @keyframes shimmer {
    0% {
      opacity: 0.5;
    } /* Start with a semi-transparent state */
    50% {
      opacity: 1;
    } /* Become fully visible */
    100% {
      opacity: 0.5;
    } /* Return to semi-transparent */
  }

  --animate-twinkle: twinkle 5s infinite;
  @keyframes twinkle {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.2;
    }
  }
}

@layer theme {
  .dark {
    --color-background: oklch(0.14 0.0044 285.82);
    --color-foreground: oklch(0.98 0 0);
    --color-card: oklch(0.14 0.0044 285.82);
    --color-card-foreground: oklch(0.98 0 0);
    --color-popover: oklch(0.14 0.0044 285.82);
    --color-popover-foreground: oklch(0.98 0 0);
    --color-primary: oklch(0.98 0 0);
    --color-primary-foreground: oklch(0.21 0.0059 285.88);
    --color-secondary: oklch(0.27 0.0055 286.03);
    --color-secondary-foreground: oklch(0.98 0 0);
    --color-muted: oklch(0.27 0.0055 286.03);
    --color-muted-foreground: oklch(0.71 0.0129 286.07);
    --color-accent: oklch(0.27 0.0055 286.03);
    --color-accent-foreground: oklch(0.98 0 0);
    --color-destructive: oklch(0.4 0.1331 25.72);
    --color-destructive-foreground: oklch(0.98 0 0);
    --color-border: oklch(0.27 0.0055 286.03);
    --color-input: oklch(0.27 0.0055 286.03);
    --color-ring: oklch(0.87 0.0055 286.29);
    --color-chart-1: oklch(0.546 0.2153 262.87);
    --color-chart-2: oklch(0.5409 0.2468 292.95);
    --color-chart-3: oklch(0.6624 0.2895 320.92);
    --color-chart-4: oklch(0.6924 0.1426 165.69);
    --color-chart-5: oklch(0.8372 0.1644 84.53);
    --color-hue-0: oklch(0.9434 0.199 105.96);
    --color-hue-1: oklch(0.6477 0.263 359.98);
    --color-hue-2: oklch(0.6404 0.300 324.36);
    --color-hue-3: oklch(0.5636 0.292 301.63);
    --color-hue-4: oklch(0.5898 0.211 259.36);
    --color-hue-5: oklch(0.8203 0.141 210.49);
    --color-hue-6: oklch(0.8842 0.107 168.47);
  }
}

` as const;
  }

  private get rootTemplate() {
    // prettier-ignore
    return `import "./globals.css";
export { cn } from "@/lib/utils";

export { Button, buttonVariants } from "@/ui/button";
export type { ButtonProps } from "@/ui/button";
` as const;
  }

  private get buttonTemplate() {
    // prettier-ignore
    return `"use client";

import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  \`ui:inline-flex ui:items-center ui:justify-center ui:gap-2 ui:whitespace-nowrap ui:rounded-md ui:text-sm ui:font-medium ui:ring-offset-background ui:transition-all ui:outline-none ui:focus-visible:outline-none ui:focus-visible:ring-[3px] ui:focus-visible:ring-primary/40 ui:focus-visible:ring-offset-2 ui:shrink-0 ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:svg:pointer-events-none ui:svg:shrink-0 ui:aria-invalid:ring-destructive/20 ui:dark:aria-invalid:ring-destructive/40 ui:aria-invalid:border-destructive ui:svg:not-[[class*='size-']]:not-[[class^='h-']]:not-[[class^='w-']]:size-4\`,
  {
    variants: {
      variant: {
        default: "ui:bg-primary ui:text-primary-foreground ui:hover:bg-primary/90",
        destructive:
          "ui:bg-destructive ui:text-white ui:hover:bg-destructive/90 ui:focus-visible:ring-destructive/20 ui:dark:focus-visible:ring-destructive/40 ui:dark:bg-destructive/60",
        outline:
          "ui:border ui:bg-background ui:shadow-xs ui:hover:bg-accent ui:hover:text-accent-foreground ui:dark:bg-input/30 ui:dark:border-input ui:dark:hover:bg-input/50",
        secondary:
          "ui:bg-secondary ui:text-secondary-foreground ui:hover:bg-secondary/80",
        ghost:
          "ui:hover:bg-accent ui:hover:text-accent-foreground ui:dark:hover:bg-accent/50",
        link: "ui:text-primary ui:underline-offset-4 ui:hover:underline"
      },
      size: {
        default: "ui:h-9 ui:px-4 ui:py-2 ui:has-svg:px-3",
        sm: "ui:h-8 ui:rounded-md ui:gap-1.5 ui:px-3 ui:has-svg:px-2.5",
        lg: "ui:h-10 ui:rounded-md ui:px-6 ui:has-svg:px-4",
        icon: "ui:size-8",
        "icon-sm": "ui:size-6",
        "icon-lg": "ui:size-9"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps
  extends ComponentPropsWithRef<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
` as const;
  }

  private get postBuildService() {
    // prettier-ignore
    return `import { Fs } from "@d0paminedriven/fs";

const fs = new Fs(process.cwd());

const distJsFileArr = () => {
  return fs
    .readDir("dist", { recursive: true })
    .filter(p => /(\\.)/g.test(p))
    // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
    .filter(p => /\\.js$/g.test(p));
};
const getTargeted = <const T extends "chunk" | "source">(
  target: T,
  files: string[]
) =>
  files.filter(
    file =>
      /(chunk-)/g.test(
        file.includes("/") ? (file.split(/\\//g).reverse()?.[0] ?? "") : file
      ) === (target === "chunk" ? true : false)
  );

function isFlagged<const F extends string>(file: F) {
  return /[\`|'|"]+use client+[\`|'|"]+[;]?/g.test(file);
}

function readFile(filePath: string) {
  return fs.fileToBuffer(filePath).toString("utf-8");
}

const isolateUseClientFlaggedFiles = (files: string[]) => {
  return files
    .map(file => {
      const fileContent = readFile(\`dist/\${file}\`);
      const detectflag = isFlagged(fileContent);

      if (detectflag === true) {
        return [file, true] as const;
      } else return [file, false] as const;
    })
    .filter(([_files, hasUseClient]) => hasUseClient)
    .map(([file, _truthy]) => file);
};

function isolateImportsInUseClientFlaggedFiles(files: string[]) {
  return files.map(file => {
    const content = readFile(\`dist/\${file}\`);
    const parseIt =
      // eslint-disable-next-line no-useless-escape
      /import(?:(?:(?:[ \\n\\t]+([^ *\\n\\t\\{\\},]+)[ \\n\\t]*(?:,|[ \\n\\t]+))?([ \\n\\t]*\\{(?:[ \\n\\t]*[^ \\n\\t"'\\{\\}]+[ \\n\\t]*,?)+\\})?[ \\n\\t]*)|[ \\n\\t]*\\*[ \\n\\t]*as[ \\n\\t]+([^ \\n\\t\\{\\}]+)[ \\n\\t]+)from[ \\n\\t]*(?:['"])([^'"\\n]+)(['"])/g.exec(
        content
      );
    return parseIt;
  });
}

const getIsolatedChunkFiles = () =>
  isolateImportsInUseClientFlaggedFiles(
    isolateUseClientFlaggedFiles(getTargeted("source", distJsFileArr()))
  ).map(o => o?.[4]?.split(/\\//g)?.reverse()?.[0] ?? "") ?? Array.of<string>();

const isolateChunkPaths = () => {
  const arrHelper = Array.of<string>();
  getIsolatedChunkFiles().forEach(function (chunk) {
    const targetedFileNames = getTargeted("chunk", distJsFileArr());

    return targetedFileNames
      .filter(targeted => targeted.includes(chunk))
      .map(t => {
        arrHelper.push(\`dist/\${t}\`);
        return \`dist/\${t}\`;
      });
  });
  return arrHelper;
};

function prependClient(fileContent: string) {
  if (isFlagged(fileContent) === false) {
    return \`"use client";\\n\`.concat(fileContent);
  } else return fileContent;
}

function handleUseClientInjectionOfRelevantChunks(files: string[]) {
  return files.map(file => {
    const fileContent = readFile(file);
    fs.withWs(file, prependClient(fileContent));
    return prependClient(fileContent);
  });
}
// tsx src/services/postbuild.ts flag-check
if (process.argv[2] === "flag-check") {
  handleUseClientInjectionOfRelevantChunks(isolateChunkPaths());
}
` as const;
  }

  private get libUtils() {
    // prettier-ignore
    return `import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
` as const;
  }

  private get turboJson() {
    // prettier-ignore
    return `{
  "$schema": "https://turborepo.org/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "src/**/*.tsx",
        "src/**/*.ts",
        "src/**/*.css",
        "tsconfig.json",
        "package.json",
        "postcss.config.mjs",
        "eslint.config.ts",
        "tsdown.config.ts"
      ]
    }
  }
}` as const;
  }

  private get eslintConfigTs() {
    // prettier-ignore
    return `import { defineConfig } from "eslint/config";
import { baseConfig, reactConfig } from "@${this.workspace}/eslint-config";

export default defineConfig(
  {
    ignores: ["dist/**"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/prefer-string-starts-ends-with": "off",
      "@typescript-eslint/require-await": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-empty-object-type": "off"
    }
  },
  baseConfig(process.cwd()),
  reactConfig
);
` as const;
  }

  private get nextEnvDts() {
    // prettier-ignore
    return `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.` as const;
  }

  private get postcssConfigMjs() {
    // prettier-ignore
    return `/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};` as const;
  }

  private get tsConfigTemplate() {
    // prettier-ignore
    return `{
  "extends": "@${this.workspace}/tsconfig/react-library.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ],
    "types": ["*"],
    "sourceMap": false,
    "declarationMap": false,
    "rootDir": ".",
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
    "outDir": "dist"
  },

  "include": ["src/**/*.ts", "src/**/*.tsx", "next-env.d.ts", "**/*.ts", "**/*.mjs"],
  "exclude": ["dist"]
}
` as const;
  }

  private get tsdownTemplate() {
  return this.handler.tsdownWorkup("ui");
}

  private get deps() {
    return [
      "@radix-ui/react-slot",
      "class-variance-authority",
      "clsx",
      "csstype",
      "tailwind-merge"
    ] as const;
  }

  private get devDeps() {
    return [
      "@d0paminedriven/fs",
      "@tailwindcss/postcss",
      "@tsdown/css",
      "@types/jsdom",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "@typescript/native-preview",
      "autoprefixer",
      "eslint",
      "jiti",
      "jsdom",
      "next",
      "postcss",
      "postcss-import",
      "postcss-load-config",
      "prettier",
      "react",
      "react-dom",
      "rolldown",
      "rolldown-plugin-dts",
      "tailwindcss",
      "tsdown",
      "tsx",
      "tw-animate-css",
      "typescript",
      "typescript-eslint",
      "unplugin-lightningcss",
      "vitest"
    ] as const;
  }

  private get localDevDeps() {
    return [
      `@${this.workspace}/eslint-config`,
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`,
      `@${this.workspace}/vitest-config`
    ] as const;
  }

  private get peerDeps() {
    return ["next", "react", "react-dom", "tailwindcss"] as const;
  }

  private pkgPath<const F extends string>(file: F) {
    return `packages/ui/${file}` as const;
  }

  private get pkgPaths() {
    return {
      turbojson: this.pkgPath("turbo.json"),
      packageJson: this.pkgPath("package.json"),
      eslint: this.pkgPath("eslint.config.ts"),
      postcss: this.pkgPath("postcss.config.mjs"),
      tsdown: this.pkgPath("tsdown.config.ts"),
      tsconfig: this.pkgPath("tsconfig.json"),
      nextenvdts: this.pkgPath("next-env.d.ts"),
      cssTemplate: this.pkgPath("src/globals.css"),
      rootIndex: this.pkgPath("src/index.ts"),
      uiButton: this.pkgPath("src/ui/button.tsx"),
      postbuildService: this.pkgPath("src/services/postbuild.ts"),
      libUtils: this.pkgPath("src/lib/utils.ts")
    };
  }

  private pkgTarget<const V extends keyof typeof this.pkgPaths>(target: V) {
    return this.pkgPaths[target];
  }

  private wt<
    const T extends ReturnType<typeof this.pkgTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.handler.withWs(target, template);
  }

  public async exeUIPkg() {
    const pkgJson = await this.handler.resolveAllDepsUIPkg(
      this.deps,
      this.devDeps,
      this.localDevDeps,
      this.peerDeps,
      this.workspace
    );
    return Promise.all([
      this.wt("packages/ui/eslint.config.ts", this.eslintConfigTs),
      this.wt("packages/ui/next-env.d.ts", this.nextEnvDts),
      this.wt("packages/ui/package.json", JSON.stringify(pkgJson, null, 2)),
      this.wt("packages/ui/postcss.config.mjs", this.postcssConfigMjs),
      this.wt("packages/ui/src/globals.css", this.cssTemplate),
      this.wt("packages/ui/src/index.ts", this.rootTemplate),
      this.wt("packages/ui/src/lib/utils.ts", this.libUtils),
      this.wt("packages/ui/src/services/postbuild.ts", this.postBuildService),
      this.wt("packages/ui/src/ui/button.tsx", this.buttonTemplate),
      this.wt("packages/ui/tsconfig.json", this.tsConfigTemplate),
      this.wt("packages/ui/tsdown.config.ts", this.tsdownTemplate),
      this.wt("packages/ui/turbo.json", this.turboJson)
    ]);
  }
}
