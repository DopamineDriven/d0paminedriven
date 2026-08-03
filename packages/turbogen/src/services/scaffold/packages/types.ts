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

  private get globalCss() {
    // prettier-ignore
    return `@import "tailwindcss/theme.css" layer(theme) source("../src");

@import "tailwindcss/utilities.css" layer(utilities);

@custom-variant dark (&:where([data-theme=dark], .dark, [data-theme=dark] *));

@font-face {
  font-family: "CalSans";
  src: url("https://raw.githubusercontent.com/DopamineDriven/d0paminedriven/refs/heads/master/packages/turbogen/public/CalSans-SemiBold.woff2")
    format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "CalSans";
  src: url("https://raw.githubusercontent.com/DopamineDriven/d0paminedriven/refs/heads/master/packages/turbogen/public/CalSans-Regular.woff2")
    format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@theme {
  --font-cal-sans: CalSans, sans-serif;
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
  --color-hue-2: oklch(0.6404 0.3 324.36);
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
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
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
    --color-hue-2: oklch(0.6404 0.3 324.36);
    --color-hue-3: oklch(0.5636 0.292 301.63);
    --color-hue-4: oklch(0.5898 0.211 259.36);
    --color-hue-5: oklch(0.8203 0.141 210.49);
    --color-hue-6: oklch(0.8842 0.107 168.47);
  }
}
` as const;
  }

  private get srcRootIndex() {
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

  private get uiButtonComponent() {
    // prettier-ignore
    return `"use client";

import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ComponentPropsWithRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  ref,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
};

Button.displayName = "Button";

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
    return `import type { ComponentPropsWithRef } from "react";

export function ArrowRight({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
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
}
` as const;
  }

  private get codeIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Code({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
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
}
` as const;
  }

  private get githubIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Github({
  ...svg
}: Omit<ComponentPropsWithRef<"svg">, "xmlns" | "viewBox" | "role">) {
  return (
    <svg
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      {...svg}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
        fill="currentColor"
      />
    </svg>
  );
}
` as const;
  }

  private get iconRoot() {
    // prettier-ignore
    return `"use client";

import type { ComponentPropsWithRef } from "react";
import { ArrowRight } from "./arrow-right";
import { Code } from "./code";
import { Github } from "./github";
import { Layers } from "./layers";
import { Moon } from "./moon";
import { Package } from "./package";
import { Sun } from "./sun";
import { Terminal } from "./terminal";
import { Zap } from "./zap";

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
  // allows for target="icon name"
  IconWithTarget,
  // allows for keying into icon name directly
  IconComponents
);

export { ArrowRight, Code, Github, Layers, Moon, Package, Sun, Terminal, Zap };
` as const;
  }

  private get layersIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Layers({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
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
}
` as const;
  }

  private get moonIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Moon({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role="img"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...svg}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
` as const;
  }

  private get packageIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";
export function Package({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      role="img"
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
}
` as const;
  }

  private get sunIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Sun({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
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
}
` as const;
  }

  private get terminalIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Terminal({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
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
}
` as const;
  }

  private get zapIcon() {
    // prettier-ignore
    return `import type { ComponentPropsWithRef } from "react";

export function Zap({
  ...svg
}: Omit<
  ComponentPropsWithRef<"svg">,
  | "viewBox"
  | "xmlns"
  | "fill"
  | "role"
  | "stroke"
  | "strokeWidth"
  | "strokeLinecap"
  | "strokeLinejoin"
>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
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
}
` as const;
  }

  private get turboJson() {
    // prettier-ignore
    return `{
  "extends": ["//"],
  "tasks": {
   "build": {
      "outputs": ["dist/**"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "src/**/*.ts",
        "tsconfig.json",
        "package.json",
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
import { baseConfig } from "@${this.workspace}/eslint-config/base";

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
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
    "ignoreDeprecations":"6.0",
    "types": ["*"],
    "rootDir": "./src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/globals.d.ts", "next-env.d.ts"],
  "exclude": ["dist"]
}
` as const;
  }

  private get tsdownConfigTemplate() {
    // prettier-ignore
    return `import { relative } from "node:path";
import type { UserConfig as Options } from "tsdown";
import { defineConfig } from "tsdown";

export default defineConfig(
  options =>
    ({
      ...options,
      entry: ["src/index.ts", "src/utils.ts"],
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
    }) satisfies Options
);
` as const;
  }

  private get deps() {
    return [
      "@radix-ui/react-slot",
      "@swc/helpers",
      "class-variance-authority",
      "clsx",
      "tailwind-merge"
    ] as const;
  }

  private get devDeps() {
    return [
      "@d0paminedriven/fs",
      "@microsoft/api-extractor",
      "@swc/core",
      "@tailwindcss/postcss",
      "@types/node",
      "@types/react",
      "@types/react-dom",
      "@typescript/native-preview",
      "autoprefixer",
      "chokidar",
      "eslint",
      "jiti",
      "next",
      "postcss",
      "prettier",
      "react",
      "react-dom",
      "tailwindcss",
      "terser",
      "tslib",
      "tsup",
      "tsx",
      "tw-animate-css",
      "typescript"
    ] as const;
  }

  private get localDevDeps() {
    return [
      `@${this.workspace}/eslint-config`,
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`
    ] as const;
  }

  private get peerDeps() {
    return ["next", "react", "react-dom", "tailwindcss"] as const;
  }

  private pkgPath<const F extends string>(file: F) {
    return `packages/types/${file}` as const;
  }

  private get pkgPaths() {
    return {
      turbojson: this.pkgPath("turbo.json"),
      packageJson: this.pkgPath("package.json"),
      eslint: this.pkgPath("eslint.config.ts"),
      tsup: this.pkgPath("tsup.config.ts"),
      tsdown: this.pkgPath("tsdown.config.ts"),
      tsconfig: this.pkgPath("tsconfig.json"),
      rootIndex: this.pkgPath("src/index.ts"),
      uiButton: this.pkgPath("src/ui/button.tsx"),
      postbuildService: this.pkgPath("src/services/postbuild.ts"),
      libUtils: this.pkgPath("src/lib/utils.ts"),
      utils: this.pkgPath("src/utils.ts")
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
      this.wt("packages/types/eslint.config.ts", this.eslintConfigTs),
      this.wt("packages/types/package.json", JSON.stringify(pkgJson, null, 2)),
      this.wt("packages/types/src/index.ts", this.srcRootIndex),
      this.wt("packages/types/src/lib/utils.ts", this.libUtils),
      this.wt("packages/types/src/services/postbuild.ts", this.postBuildService),
      this.wt("packages/types/src/ui/button.tsx", this.uiButtonComponent),
      this.wt("packages/types/tsconfig.json", this.tsConfigTemplate),
      this.wt("packages/types/tsdown.config.ts", this.tsdownConfigTemplate),
      this.wt("packages/types/turbo.json", this.turboJson)
    ]);
  }
}
