# Turbogen Catalog Emission — Implementation Plan (Second Pass, registry-first)

> Companion to [fable.md](./fable.md) (the POA/ADR). Refined against the
> **exploratory target manifests** in `adrs/turbogen-catalogs/exploratory/`
> (hand-mapped from a real `turbogen@9.0.3` generation) and re-anchored to the
> 9.0.3 source, which already landed the tooling-verbatim restructure
> (`TypesPackageScaffolder`, `VitestScaffolder`, tsdown shells, inline ts holds).
>
> **Rev 2 (2026-08-04, per Andrew):** registry-first. The hand-authored
> catalogs yaml (`exploratory/workspace-yaml/index.md`) **is** the source of
> truth and ships as a verbatim template; the only derived construct is a flat
> registry mapping package name → `catalog:<group>` ref. Future dep
> adds/removes are manual edits (registry + yaml + a scaffolder list), guarded
> by compile-time keys and one drift test — no `CATALOG` data object, no
> derived reverse lookup, no runtime `yaml.stringify`.
>
> Written for Andrew (solo maintainer, full context) — every task carries
> copy-paste-ready code. Steps use `- [ ]` checkboxes for tracking.

**Goal:** Generated manifests emit `catalog:<group>` refs; the generated
`pnpm-workspace.yaml` carries the catalogs section verbatim from the template.

**Architecture:** `src/services/catalog/registry.ts` holds the flat
pkg → ref map (`CatalogedPkg = keyof typeof CATALOG_REGISTRY`).
`src/services/catalog/workspace-catalogs.ts` holds the verbatim yaml block,
imported by both `RootScaffolder` (emission) and the drift test (validation).
`ConfigHandler` — the mapping execution locus — swaps its seven async fetch
loops for synchronous registry lookups. The `typescript` hold stops being
seven inline conditionals and becomes the single `^6.0.3` value in the yaml.

**Tech stack:** TypeScript 6 (tsgo typecheck), tsx for test scripts, `yaml`
dev-side only (the drift test; `js-yaml` already removed at 9.0.3).

## Global Constraints

- CLAUDE.md hard rules apply to every snippet: no `any`, no `enum`, no
  `.filter(Boolean)`, `satisfies` over assertions (`as const` allowed),
  `Array.of<T>()` for empty arrays, explicit `.ts` path imports, no barrels.
- **`typescript` is held at `^6.0.3`** until TS 7.1.0 restores the internal
  API typescript-eslint needs. After this work the hold lives in the yaml
  template ONLY — Task 4 deletes the seven inline conditionals.
- Named catalogs require **pnpm ≥ 9.5**; exploratory root says `engines.pnpm
  >=9` — Task 6 flags the `>=10` bump (your call).
- Every emitted `catalog:` ref must resolve against the emitted catalogs
  section — Task 3's drift test is the referential-integrity gate; the Task 7
  smoke `pnpm install` is the end-to-end proof (pnpm hard-errors on unknown
  catalog names).

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/services/catalog/registry.ts` | create | flat `CATALOG_REGISTRY` (pkg → `catalog:<group>`), `CatalogedPkg` |
| `src/services/catalog/workspace-catalogs.ts` | create | verbatim catalogs yaml block (template literal) |
| `src/test/catalog-validate.ts` | create | registry ↔ yaml drift test (tsx script) |
| `src/config/index.ts` | modify | seven builders go sync via registry lookup; `sideEffecs` fix |
| `src/services/scaffold/*/*.ts` | modify | dep getters typed + reconciled to exploratory lists; dead `await`s dropped |
| `src/services/scaffold/root/root-scaffolder.ts` | modify | append catalogs template to workspace yaml; engines/allowBuilds/settings fixes |
| `src/index.ts` + `package.json` | modify | export the catalog module per existing conventions |

---

## Task 1: `registry.ts` — the flat registry

Only packages that some builder actually emits get entries (~71). Catalog
members that exist purely as menu headroom in the yaml (`vaul`,
`eslint-config-next`, `eslint-plugin-import-x`, `dotenv-cli`,
`@testing-library/react`, `react-resizable-panels`, `motion-plus-dom`) need
**no** registry entry — they just ride along in the emitted yaml.

- [ ] **Step 1: create `src/services/catalog/registry.ts`**

```ts
export const CATALOG_REGISTRY = {
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
  "dotenv-expand": "catalog:dotenv",
  eslint: "catalog:eslint",
  "eslint-plugin-import": "catalog:eslint",
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
  vite: "catalog:vite",
  vitest: "catalog:vitest"
} as const;

export type CatalogedPkg = keyof typeof CATALOG_REGISTRY;

export type CatalogRef = (typeof CATALOG_REGISTRY)[CatalogedPkg];
```

No lookup function needed — direct indexing (`CATALOG_REGISTRY[pkg]`) is
total because the parameter type is `CatalogedPkg`. Duplicate keys are a TS
compile error, so no collision guard either.

- [ ] **Step 2: typecheck** — `pnpm --filter @d0paminedriven/turbogen typecheck`

## Task 2: `workspace-catalogs.ts` — the verbatim yaml block

Lives in the catalog domain (not inlined in `RootScaffolder`) so the drift
test can import the exact emitted string.

- [ ] **Step 1: create `src/services/catalog/workspace-catalogs.ts`**

The body is the `catalogs:` block from
`adrs/turbogen-catalogs/exploratory/workspace-yaml/index.md` (lines 18–133 of
the fenced yaml) pasted **verbatim** into a template literal — copy from the
file, don't retype. Skeleton with first/last groups shown:

```ts
// prettier-ignore
export const WORKSPACE_CATALOGS_YAML = `catalogs:
  babel:
    babel-plugin-react-compiler: ^1.0.0
  biome:
    "@biomejs/biome": ^2.5.6
  bui:
    "@base-ui/react": ^1.6.0
  /* …paste the remaining groups verbatim from
     exploratory/workspace-yaml/index.md — clsx, cookies, csstype, cva, dd,
     dotenv, eslint, geist, glob, jiti, jsdom, lightning, motion, next, node,
     nyc, prettier, radix, react, rolldown, sharp, styles, test, ts, tsdown,
     tseslint, tsgo, tslib, tsx, turbo, tw, utils, vite… */
  vitest:
    "@vitest/coverage-istanbul": ^4.1.10
    "@vitest/ui": ^4.1.10
    vitest: ^4.1.10
` as const;
```

(The `/* … */` above is a paste marker for this doc only — the real file
contains all 37 groups and no comments. The `ts:` group's `^6.0.3` **is** the
typescript hold now; annotate it with a yaml comment if you like —
`# HOLD: lift at TS 7.1.0` — pnpm ignores comments.)

- [ ] **Step 2: wire into `RootScaffolder`** (full emission lands in Task 6;
  the import is all that's needed here)

```ts
import { WORKSPACE_CATALOGS_YAML } from "@/services/catalog/workspace-catalogs.ts";
```

```ts
private get pnpmWorkspaceYaml() {
  return `${this.pnpmWorkspaceYamlTemplate}\n\n${WORKSPACE_CATALOGS_YAML}`;
}
```

…and in `exeRoot`, swap the write target:

```ts
this.writeTarget("pnpm-workspace.yaml", this.pnpmWorkspaceYaml),
```

## Task 3: drift test — registry ↔ yaml referential integrity

The registry and the yaml are edited by hand, independently. This script makes
forgetting one of the two touches loud: every registry entry's package must
exist **in the exact group its ref claims**.

- [ ] **Step 1: create `src/test/catalog-validate.ts`**

```ts
import assert from "node:assert/strict";
import { parse } from "yaml";
import type { CatalogedPkg } from "@/services/catalog/registry.ts";
import { CATALOG_REGISTRY } from "@/services/catalog/registry.ts";
import { WORKSPACE_CATALOGS_YAML } from "@/services/catalog/workspace-catalogs.ts";

const parsed = parse(WORKSPACE_CATALOGS_YAML) as {
  catalogs: Record<string, Record<string, string>>;
};

assert.ok(parsed.catalogs, "yaml template must contain a catalogs: block");

const pkgs = Object.keys(CATALOG_REGISTRY);

for (const pkg of pkgs) {
  const group = CATALOG_REGISTRY[pkg].replace(/^catalog:/, "");
  const members = parsed.catalogs[group];
  assert.ok(members, `registry points "${pkg}" at missing group "${group}"`);
  assert.ok(
    typeof members[pkg] === "string",
    `"${pkg}" is not a member of catalog group "${group}" in the yaml`
  );
}

// the typescript hold survives — lift at TS 7.1.0 (see fable.md decision log)
assert.equal(parsed.catalogs.ts?.typescript, "^6.0.3");

// informational: yaml members no registry entry references (intentional menu headroom)
const referenced = new Set<string>(pkgs);
const headroom = Object.entries(parsed.catalogs).flatMap(([group, members]) =>
  Object.keys(members)
    .filter(pkg => !referenced.has(pkg))
    .map(pkg => `${group}/${pkg}`)
);
console.log(
  `catalog-validate ✅ — ${pkgs.length} registry refs verified; menu headroom: ${headroom.join(", ")}`
);
```

- [ ] **Step 2: run it** —
  `pnpm --filter @d0paminedriven/turbogen exec tsx src/test/catalog-validate.ts`
  Expected: ✅ with headroom listing exactly the seven intentional extras
  (`next/eslint-config-next`, `eslint/eslint-plugin-import-x`,
  `dotenv/dotenv-cli`, `react/@testing-library/react`,
  `react/react-resizable-panels`, `react/vaul`, `motion/motion-plus-dom`).
  Anything else in that list = a stale registry or yaml edit.

Note on `assert.ok(members, …)`: `parsed` is typed from a cast on `parse` —
the augmented `JSON.parse<T>` pattern doesn't exist for `yaml`, and the shape
is asserted structurally by the checks themselves, which is the point of the
script. If you'd rather avoid the cast entirely, type it
`Record<string, unknown>` and narrow member-by-member — the checks stay the
same.

## Task 4: `ConfigHandler` — the mapping goes synchronous (core task)

This is where the mapping is exe'd. All seven builders get the identical
mechanical transform — **delete** the `Promise.all` fetch loops and the inline
`if (pkg === "typescript")` holds, **replace** with registry lookups, **drop**
`async`. Shells (name/scripts/exports/engines) are untouched.

- [ ] **Step 1: add imports + two shared helpers to `ConfigHandler`**

```ts
import type { CatalogedPkg } from "@/services/catalog/registry.ts";
import { CATALOG_REGISTRY } from "@/services/catalog/registry.ts";
```

```ts
private catalogEntries(packages: readonly CatalogedPkg[]) {
  return packages.map(pkg => [pkg, CATALOG_REGISTRY[pkg]] as const);
}

private workspaceEntries(locals: readonly string[]) {
  return locals.map(pkg => [pkg, "workspace:*"] as const);
}
```

- [ ] **Step 2: rewrite `resolveAllDeps` (web) — full replacement**

```ts
public resolveAllDeps(
  packages: readonly CatalogedPkg[],
  devPackages: readonly CatalogedPkg[],
  localDeps: readonly string[],
  localDevDeps: readonly string[],
  workspace = "placeholder",
  port = "3000"
) {
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
    dependencies: Object.fromEntries([
      ...this.workspaceEntries(localDeps),
      ...this.catalogEntries(packages)
    ]),
    devDependencies: Object.fromEntries([
      ...this.workspaceEntries(localDevDeps),
      ...this.catalogEntries(devPackages)
    ])
  };
}
```

- [ ] **Step 3: rewrite `resolveAllDepsUIPkg` — peers use `catalog:` too**

Per the exploratory `packages/ui.md`, peerDependencies are `catalog:` refs now
(not `>=` floors). Entries construction becomes:

```ts
public resolveAllDepsUIPkg(
  deps: readonly CatalogedPkg[],
  devDeps: readonly CatalogedPkg[],
  localDeps: readonly string[],
  peerDeps: readonly CatalogedPkg[],
  workspace = "placeholder"
) {
  return {
    /* ...shell unchanged, EXCEPT the typo fix below... */
    sideEffects: ["**/*.css"], // was `sideEffecs` — config/index.ts:533; the
    // exploratory ui.md carries the typo accidentally, fix it in both
    peerDependencies: Object.fromEntries(this.catalogEntries(peerDeps)),
    dependencies: Object.fromEntries(this.catalogEntries(deps)),
    devDependencies: Object.fromEntries([
      ...this.workspaceEntries(localDeps),
      ...this.catalogEntries(devDeps)
    ]),
    prettier: `@${workspace}/prettier-config`
  };
}
```

- [ ] **Step 4: apply the identical transform to the remaining five**

`resolveAllDepsRoot`, `resolveAllDepsTypesPkg`, `resolveAllDepsEslint`,
`resolveAllDepsPrettier`, `resolveAllDepsVitest` — each: external-list params
`readonly string[]` → `readonly CatalogedPkg[]` (local lists stay
`readonly string[]`), fetch loops → `this.catalogEntries(...)`, local loops →
`this.workspaceEntries(...)`, `async` keyword deleted, inline typescript
conditional deleted. Return shapes untouched.

- [ ] **Step 5: quarantine, don't delete, the fetch machinery**

`fetchLatestVersion` + `NpmLatest` stay (future `--latest` mode per fable.md
§5.8) but nothing on the default path calls them anymore.

- [ ] **Step 6: typecheck** — expect call-site errors in scaffolders (their
  lists aren't `CatalogedPkg[]` yet). That's Task 5's worklist, enumerated by
  the compiler.

## Task 5: scaffolder dep lists — reconcile to exploratory + type against registry

Lists stay where they live today (in the scaffolders — your call, minimal
churn); they get `satisfies` typing so an unregistered dep is a compile error,
and their contents update to match the exploratory manifests exactly. Paste-
ready getter bodies below; `localDeps`/`localDevDeps` getters keep
interpolating `@${this.workspace}/…` and are listed only where they change.

- [ ] **Step 1: `apps/generic-scaffold.ts`** (target: `exploratory/apps/web.md`)

```ts
import type { CatalogedPkg } from "@/services/catalog/registry.ts";

private get deps() {
  return [
    "@base-ui/react",
    "class-variance-authority",
    "clsx",
    "csstype",
    "geist",
    "js-cookie",
    "motion",
    "next",
    "next-themes",
    "react",
    "react-dom",
    "tailwind-merge",
    "tw-animate-css"
  ] as const satisfies readonly CatalogedPkg[];
}

private get devDeps() {
  return [
    "@playwright/test",
    "@tailwindcss/postcss",
    "@types/js-cookie",
    "@types/jsdom",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "@typescript/native-preview",
    "autoprefixer",
    "babel-plugin-react-compiler",
    "dotenv",
    "dotenv-expand",
    "eslint",
    "jiti",
    "jsdom",
    "motion-dom",
    "motion-utils",
    "postcss",
    "postcss-load-config",
    "prettier",
    "sharp",
    "tailwindcss",
    "tailwindcss-motion",
    "tslib",
    "tsx",
    "typescript",
    "vitest"
  ] as const satisfies readonly CatalogedPkg[];
}

private get localDeps() {
  return [`@${this.workspace}/ui`] as const;
}

private get localDevDeps() {
  return [
    `@${this.workspace}/eslint-config`,
    `@${this.workspace}/prettier-config`,
    `@${this.workspace}/tsconfig`,
    `@${this.workspace}/types`,
    `@${this.workspace}/vitest-config`
  ] as const;
}
```

- [ ] **Step 2: `packages/ui.ts`** (target: `exploratory/packages/ui.md`)

```ts
private get deps() {
  return [
    "@radix-ui/react-slot",
    "class-variance-authority",
    "clsx",
    "csstype",
    "tailwind-merge"
  ] as const satisfies readonly CatalogedPkg[];
}

private get peerDeps() {
  return [
    "next",
    "react",
    "react-dom",
    "tailwindcss"
  ] as const satisfies readonly CatalogedPkg[];
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
    "tslib",
    "tsx",
    "tw-animate-css",
    "typescript",
    "typescript-eslint",
    "unplugin-lightningcss",
    "vitest"
  ] as const satisfies readonly CatalogedPkg[];
}

private get localDevDeps() {
  return [
    `@${this.workspace}/eslint-config`,
    `@${this.workspace}/prettier-config`,
    `@${this.workspace}/tsconfig`,
    `@${this.workspace}/vitest-config`
  ] as const;
}
```

- [ ] **Step 3: `root/root-scaffolder.ts`** (target: `exploratory/root/root.md`)

```ts
private get localDeps() {
  return [`@${this.workspace}/prettier-config`] as const;
}

private get devDeps() {
  return [
    "@biomejs/biome",
    "@changesets/cli",
    "@d0paminedriven/turbogen",
    "@types/node",
    "@typescript/native-preview",
    "dotenv",
    "husky",
    "jiti",
    "prettier",
    "tsx",
    "turbo",
    "typescript"
  ] as const satisfies readonly CatalogedPkg[];
}
```

Note the `localDeps` trim: exploratory root declares **only** prettier-config
as a workspace dep (turbo tasks reach the rest) — this also permanently
retires the old dangling `@${workspace}/vitest-config`-before-it-existed
class of bug. Also delete the now-unneeded
`/* eslint-disable @typescript-eslint/await-thenable */` at the top of the
file.

- [ ] **Step 4: `packages/types.ts`** (target: `exploratory/packages/types.md`)

```ts
private get devDeps() {
  return [
    "@types/node",
    "@typescript/native-preview",
    "eslint",
    "jiti",
    "prettier",
    "tsdown",
    "tslib",
    "tsx",
    "typescript",
    "typescript-eslint"
  ] as const satisfies readonly CatalogedPkg[];
}
```

- [ ] **Step 5: `tooling/eslint-scaffold.ts`** (target: `exploratory/tooling/eslint.md`)

```ts
private get deps() {
  return [
    "@eslint/compat",
    "@eslint/config-helpers",
    "@eslint/js",
    "@next/eslint-plugin-next",
    "eslint-plugin-import",
    "eslint-plugin-jsx-a11y",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks",
    "eslint-plugin-turbo",
    "jiti",
    "typescript-eslint"
  ] as const satisfies readonly CatalogedPkg[];
}

private get devDeps() {
  return [
    "@types/node",
    "@typescript/native-preview",
    "eslint",
    "prettier",
    "tsdown",
    "tslib",
    "tsx",
    "typescript"
  ] as const satisfies readonly CatalogedPkg[];
}
```

- [ ] **Step 6: `tooling/prettier-scaffold.ts`** (target: `exploratory/tooling/prettier.md`)

```ts
private get deps() {
  return [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier",
    "prettier-plugin-tailwindcss"
  ] as const satisfies readonly CatalogedPkg[];
}

private get devDeps() {
  return [
    "@types/node",
    "@typescript/native-preview",
    "eslint",
    "jiti",
    "tsdown",
    "tslib",
    "tsx",
    "typescript",
    "typescript-eslint"
  ] as const satisfies readonly CatalogedPkg[];
}

private get localDeps() {
  return [
    `@${this.workspace}/eslint-config`,
    `@${this.workspace}/tsconfig`
  ] as const;
}
```

- [ ] **Step 7: `tooling/vitest-config.ts`** (target: `exploratory/tooling/vitest.md`)

```ts
private get deps() {
  return [
    "@vitejs/plugin-react",
    "@vitest/coverage-istanbul",
    "@vitest/ui",
    "vite",
    "vitest"
  ] as const satisfies readonly CatalogedPkg[];
}

private get devDeps() {
  return [
    "@types/node",
    "@typescript/native-preview",
    "eslint",
    "glob",
    "jiti",
    "nyc",
    "prettier",
    "tsdown",
    "tslib",
    "tsx",
    "typescript",
    "typescript-eslint"
  ] as const satisfies readonly CatalogedPkg[];
}
```

- [ ] **Step 8: de-async the exe methods** — every
  `const pkgJson = await this.handler.resolveAllDeps*(…)` loses the `await`
  (builders are sync now); the `exe*` methods stay `async` (they still
  `Promise.all` the writes). Typecheck + lint: clean.

## Task 6: `RootScaffolder` finishing touches

- [ ] **Step 1:** emission wiring from Task 2 Step 2 is in place
  (`pnpmWorkspaceYaml` getter + `writeTarget` swap).
- [ ] **Step 2 (decisions, one line each):**
  - `engines.pnpm`: exploratory says `>=9`, but named catalogs need ≥9.5 —
    recommend `">=10"` in the root shell (`config/index.ts`,
    `resolveAllDepsRoot`; the `packageManager` field pins the real version
    anyway).
  - `allowBuilds` in `pnpmWorkspaceYamlTemplate` still lists `@swc/core` and
    `esbuild` — both are out of the dep universe now; `sharp` is the only
    survivor worth keeping.
  - The `vscodeSettingsTemplate` missing-comma bug (between the
    `json.schemaDownload.trustedDomains` object and
    `"github.copilot.enable"`, ~line 208–210) still ships invalid JSON —
    2-character fix, do it here.

## Task 7: exports, package.json, ship

- [ ] **Step 1: `src/index.ts`** — follow the existing re-export convention:

```ts
export { CATALOG_REGISTRY } from "@/services/catalog/registry.ts";
export type { CatalogedPkg, CatalogRef } from "@/services/catalog/registry.ts";
export { WORKSPACE_CATALOGS_YAML } from "@/services/catalog/workspace-catalogs.ts";
```

- [ ] **Step 2: `package.json`** — add
  `"./services/catalog/*": "./dist/services/catalog/*.js"` to `exports` and
  mirror in both `typesVersions` blocks
  (`"services/catalog": ["dist/services/catalog/registry.d.ts", "dist/services/catalog/workspace-catalogs.d.ts"]`).
- [ ] **Step 3: full gate** —
  `pnpm --filter @d0paminedriven/turbogen build && pnpm --filter @d0paminedriven/turbogen typecheck && pnpm --filter @d0paminedriven/turbogen lint && pnpm --filter @d0paminedriven/turbogen exec tsx src/test/catalog-validate.ts`
- [ ] **Step 4: smoke scaffold** — in a scratch dir: `ddturbogen init` →
  answer prompts → confirm: `pnpm-workspace.yaml` carries all 37 groups;
  every manifest's dep sections match the exploratory docs (`rg "catalog:"`);
  `pnpm install` resolves — the end-to-end referential-integrity proof.
- [ ] **Step 5: changeset** — major (`9.x` → `10.0.0`): generated output
  switches to the `catalog:` protocol and emits a catalogs section.

---

## Maintenance contract (the whole point)

Adding a dep to generated output = three manual touches, each guarded:

1. **yaml template** (`workspace-catalogs.ts`) — add the member/group. Guard:
   drift test fails if you skip it and reference it.
2. **registry** (`registry.ts`) — add `pkg: "catalog:<group>"`. Guard: the
   scaffolder list won't typecheck without it.
3. **a scaffolder's dep getter** — add the name. Guard: it's the change you
   actually wanted; the other two exist to serve it.

Version bumps = edit the yaml template only. Removing a dep = reverse of the
above; the drift test's headroom listing tells you when a yaml member is no
longer referenced (leave it as menu headroom or prune — your call, it's
informational by design).

## Deferred (unchanged from fable.md, no code here yet)

- **`--latest` refresh** (§5.8): one deduped pass over
  `Object.keys(CATALOG_REGISTRY)`, rewriting version values in the yaml
  template string, `REFRESH_HOLDS` honoring the ts pin. Only worth building
  if snapshot + release cadence proves insufficient.
- Codegen sync from this repo's root yaml: moot in rev 2 — the exploratory
  yaml is hand-authored as its own source of truth.

## Self-review notes

- Dep lists and registry were transcribed from the exploratory manifests; the
  `satisfies readonly CatalogedPkg[]` typing, the drift test, and the smoke
  `pnpm install` triple-check the transcription.
- Known intentional divergences from exploratory docs: `sideEffects` typo
  fixed (ui), `engines.pnpm >=10` recommended (root), `allowBuilds` pruned —
  each flagged inline where it happens.
- Registry entries: ~71 (referenced set only); yaml groups: 37; menu headroom
  members carry no registry entries by design.
