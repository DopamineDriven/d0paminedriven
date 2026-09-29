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
    return `@import "tailwindcss/theme.css" layer(theme) source("../src");

@import "tailwindcss/utilities.css" layer(utilities);

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

export { ArrowRight } from "@/icons/arrow-right";
export { Code } from "@/icons/code";
export { Github } from "@/icons/github";
export { Layers } from "@/icons/layers";
export { Moon } from "@/icons/moon";
export { Package } from "@/icons/package";
export { Sun } from "@/icons/sun";
export { Terminal } from "@/icons/terminal";
export { Zap } from "@/icons/zap";
export { Icon } from "@/icons";

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
  \`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all outline-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 focus-visible:ring-offset-2 shrink-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&_svg]:not-[[class*='size-']]:not-[[class^='h-']]:not-[[class^='w-']]:size-4\`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-8",
        "icon-sm": "size-6",
        "icon-lg": "size-9"
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

  private get arrowRightIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function ArrowRight({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}` as const;
  }

  private get codeIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Code({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );
}` as const;
  }

  private get githubIconTemplate() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Github({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      {...svg}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
        fill="currentColor"
      />
    </svg>
  );
}` as const;
  }

  private get iconRoot() {
    // prettier-ignore
    return `"use client";

import type { ComponentPropsWithRef } from "react";
import { ArrowRight } from "@/icons/arrow-right";
import { Code } from "@/icons/code";
import { Github } from "@/icons/github";
import { Layers } from "@/icons/layers";
import { Moon } from "@/icons/moon";
import { Package } from "@/icons/package";
import { Sun } from "@/icons/sun";
import { Terminal } from "@/icons/terminal";
import { Zap } from "@/icons/zap";

const IconComponents = {
  ArrowRight,
  Code,
  Github,
  Layers,
  Moon,
  Package,
  Sun,
  Terminal,
  Zap
} as const;

export type IconName = keyof typeof IconComponents;

export type BaseSVGProps = Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>;

export interface IconProps<T extends IconName> extends BaseSVGProps {
  target?: T;
}

function IconWithTarget({ target, ...props }: IconProps<IconName>) {
  if (!target) {
    return null;
  }

  const IconComponent = IconComponents[target];
  return <IconComponent {...props} />;
}

export const Icon = Object.assign(
  // allows for target="icon name" -> <Icon target="Sun" />
  IconWithTarget,
  // allows for keying into icon name directly -> <Icon.Sun />, etc
  IconComponents
);

export { ArrowRight, Code, Github, Layers, Moon, Package, Sun, Terminal, Zap };
` as const;
  }

  private get layersIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Layers({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </svg>
  );
}` as const;
  }

  private get moonIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Moon({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role={role}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}` as const;
  }

  private get packageIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Package({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role={role}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}` as const;
  }

  private get sunIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Sun({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}` as const;
  }

  private get terminalIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Terminal({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M12 19h8" />
      <path d="m4 17 6-6-6-6" />
    </svg>
  );
}` as const;
  }

  private get zapIcon() {
    // prettier-ignore
    return `import type { BaseSVGProps } from "@/icons/index";

export function Zap({ role = "img", ...svg }: BaseSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role={role}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}` as const;
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
    // prettier-ignore
    return `import { relative } from "node:path";
import type { UserConfig } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: [
        "src/globals.css",
        "src/index.ts",
        "src/icons/index.tsx",
        "src/lib/*.ts",
        "src/ui/*.tsx",
        "!src/services/postbuild.ts"
      ],
      dts: { tsgo: true },
      external: ["react"],
      platform: "neutral",
      fixedExtension: false,
      target: ["esnext"],
      format: ["esm"],
      tsconfig: relative(process.cwd(), "tsconfig.json"),
      cwd: process.cwd(),
      clean: true,
      outDir: "dist",
      unbundle: true,
      css: {
        fileName: "globals.css",
        inject: false,
        minify: false,
        transformer: "postcss"
      }
    }) satisfies UserConfig
);` as const;
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
      libUtils: this.pkgPath("src/lib/utils.ts"),
      iconArrowRight: this.pkgPath("src/icons/arrow-right.tsx"),
      iconCode: this.pkgPath("src/icons/code.tsx"),
      iconGithub: this.pkgPath("src/icons/github.tsx"),
      iconRoot: this.pkgPath("src/icons/index.tsx"),
      iconLayers: this.pkgPath("src/icons/layers.tsx"),
      iconMoon: this.pkgPath("src/icons/moon.tsx"),
      iconsPackage: this.pkgPath("src/icons/package.tsx"),
      iconsSun: this.pkgPath("src/icons/sun.tsx"),
      iconsTerminal: this.pkgPath("src/icons/terminal.tsx"),
      iconsZap: this.pkgPath("src/icons/zap.tsx")
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
      this.wt("packages/ui/src/icons/arrow-right.tsx", this.arrowRightIcon),
      this.wt("packages/ui/src/icons/code.tsx", this.codeIcon),
      this.wt("packages/ui/src/icons/github.tsx", this.githubIconTemplate),
      this.wt("packages/ui/src/icons/index.tsx", this.iconRoot),
      this.wt("packages/ui/src/icons/layers.tsx", this.layersIcon),
      this.wt("packages/ui/src/icons/moon.tsx", this.moonIcon),
      this.wt("packages/ui/src/icons/package.tsx", this.packageIcon),
      this.wt("packages/ui/src/icons/sun.tsx", this.sunIcon),
      this.wt("packages/ui/src/icons/terminal.tsx", this.terminalIcon),
      this.wt("packages/ui/src/icons/zap.tsx", this.zapIcon),
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
