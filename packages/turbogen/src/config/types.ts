import type { UTR } from "@d0paminedriven/type-utils";
export type BabelPkgs = {
  type: "babel";
  "babel-plugin-react-compiler": string;
};

export type BiomePkgs = { type: "biome"; "@biomejs/biome": string };
export type BuiPkgs = { type: "bui"; "@base-ui/react": string };

export type ClsxPkgs = { type: "clsx"; clsx: string };

export type CookiesPkgs = {
  type: "cookies";
  "@types/js-cookie": string;
  "js-cookie": string;
};

export type CssTypePkgs = { type: "csstype"; csstype: string };

export type CvaPkgs = { type: "cva"; "class-variance-authority": string };
export type DotenvPkgs = {
  type: "dotenv";
  dotenv: string;
  "dotenv-cli": string;
  "dotenv-expand": string;
};

export type EslintPkgs = {
  type: "eslint";
  eslint: string;
  "@eslint/compat": string;
  "@eslint/config-helpers": string;
  "@eslint/js": string;
  "eslint-plugin-import": string;
  "eslint-plugin-import-x": string;
  "eslint-plugin-jsx-a11y": string;
  "eslint-plugin-react": string;
  "eslint-plugin-react-hooks": string;
};

export type DDPkgs = {
  type: "dd";
  "@d0paminedriven/fs": string;
  "@d0paminedriven/turbogen": string;
};

export type GeistPkgs = { type: "geist"; geist: string };

export type GlobPkgs = { type: "glob"; glob: string };

export type JitiPkgs = { type: "jiti"; jiti: string };

export type JsdomPkgs = {
  type: "jsdom";
  jsdom: string;
  "@types/jsdom": string;
};

export type LightningPkgs = {
  type: "lightning";
  "unplugin-lightningcss": string;
};

export type MotionPkgs = {
  type: "motion";
  motion: string;
  "motion-dom": string;
  "motion-plus-dom": string;
  "motion-utils": string;
};

export type NextPkgs = {
  type: "next";
  next: string;
  "@next/eslint-plugin-next": string;
  "next-themes": string;
  "eslint-config-next": string;
};

export type NodePkgs = { type: "node"; "@types/node": string };

export type NycPkgs = { type: "nyc"; nyc: string };

export type PrettierPkgs = {
  type: "prettier";
  prettier: string;
  "@ianvs/prettier-plugin-sort-imports": string;
  "prettier-plugin-tailwindcss": string;
};

export type RadixPkgs = { type: "radix"; "@radix-ui/react-slot": string };

export type ReactPkgs = {
  type: "react";
  react: string;
  "@testing-library/react": string;
  "react-dom": string;
  "@types/react": string;
  "@types/react-dom": string;
  "react-resizable-panels": string;
  vaul: string;
};

export type RolldownPkgs = {
  type: "rolldown";
  rolldown: string;
  "rolldown-plugin-dts": string;
};

export type SharpPkgs = { type: "sharp"; sharp: string };

export type StylesPkgs = {
  type: "styles";
  "postcss-load-config": string;
  "postcss-import": string;
  postcss: string;
  autoprefixer: string;
};

export type TestPkgs = { type: "test"; "@playwright/test": string };

export type TsPkgs = { type: "ts"; typescript: string };

export type TsdownPkgs = {
  type: "tsdown";
  tsdown: string;
  "@tsdown/css": string;
};

export type TsEslintPkgs = { type: "tseslint"; "typescript-eslint": string };

export type TsgoPkgs = { type: "tsgo"; "@typescript/native-preview": string };

export type TslibPkgs = { type: "tslib"; tslib: string };

export type TsxPkgs = { type: "tsx"; tsx: string };

export type TurboPkgs = {
  type: "turbo";
  turbo: string;
  "eslint-plugin-turbo": string;
};

export type TwPkgs = {
  type: "tw";
  "@tailwindcss/postcss": string;
  tailwindcss: string;
  "tw-animate-css": string;
  "tailwind-merge": string;
  "tailwindcss-motion": string;
};

export type UtilsPkgs = {
  type: "utils";
  husky: string;
  "@changesets/cli": string;
};

export type VitePkgs = {
  type: "vite";
  vite: string;
  "@vitejs/plugin-react": string;
};

export type VitestPkgs = {
  type: "vitest";
  vitest: string;
  "@vitest/coverage-istanbul": string;
  "@vitest/ui": string;
};

export type UnionOfPkgs =
  | BabelPkgs
  | BiomePkgs
  | BuiPkgs
  | ClsxPkgs
  | CookiesPkgs
  | CssTypePkgs
  | CvaPkgs
  | DotenvPkgs
  | DDPkgs
  | EslintPkgs
  | GeistPkgs
  | GlobPkgs
  | JitiPkgs
  | JsdomPkgs
  | LightningPkgs
  | MotionPkgs
  | NextPkgs
  | NodePkgs
  | NycPkgs
  | PrettierPkgs
  | RadixPkgs
  | ReactPkgs
  | RolldownPkgs
  | SharpPkgs
  | StylesPkgs
  | TestPkgs
  | TsPkgs
  | TsdownPkgs
  | TsEslintPkgs
  | TsgoPkgs
  | TslibPkgs
  | TsxPkgs
  | TurboPkgs
  | TwPkgs
  | UtilsPkgs
  | VitePkgs
  | VitestPkgs;


  export type PkgsRecord = UTR<UnionOfPkgs, "type">;
