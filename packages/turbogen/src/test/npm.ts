import { ConfigHandler } from "@/config/index.ts";

const config = new ConfigHandler(process.cwd());

const workspace = "d0paminedriven";
type NpmLatest = {
  name: string;
  version: string;
  keywords: string[];
  [record: string]:
    | string
    | number
    | boolean
    | string[]
    | Record<string, string>;
};

const deps = [
  "@radix-ui/react-slot",
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "motion",
  "next",
  "next-themes",
  "react",
  "react-dom",
  "tailwind-merge",
  "tw-animate-css"
] as const;

const devDeps = [
  "@edge-runtime/cookies",
  "@edge-runtime/types",
  "@playwright/test",
  "@tailwindcss/postcss",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@vercel/functions",
  "autoprefixer",
  "csstype",
  "dotenv",
  "eslint",
  "eslint-config-next",
  "motion-dom",
  "motion-utils",
  "postcss",
  "prettier",
  "sharp",
  "tailwindcss",
  "tailwindcss-motion",
  "tslib",
  "tsx",
  "typescript",
  "urlpattern-polyfill",
  "webpack"
] as const;

const localDeps = [
  `@${workspace}/eslint-config`,
  `@${workspace}/prettier-config`,
  `@${workspace}/tsconfig`
] as const;

async function fetchLatestVersion<const T extends string>(target: T) {
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

async function _resolveAllDeps(
  packages: readonly string[],
  devPackages: readonly string[],
  localDeps: readonly string[]
) {
  const entries = await Promise.all(
    packages.map(async pkg => {
      const version = (await fetchLatestVersion(pkg)).version;
      return [pkg, `^${version}`] as const;
    })
  );
  const devEntries = await Promise.all(
    devPackages.map(async pkg => {
      const v = (await fetchLatestVersion(pkg)).version;
      return [pkg, `^${v}`] as const;
    })
  );
  const localEntries = localDeps.map(p => [p, "workspace:*"] as const);
  return {
    dependencies: Object.fromEntries(entries),
    devDependencies: Object.fromEntries([...localEntries, ...devEntries])
  };
}

config.resolveAllDeps(deps, devDeps, localDeps, "d0paminedriven", "3020").then(data => {
  console.log(JSON.stringify(data, null, 2));
});
