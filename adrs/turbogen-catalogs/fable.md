# ADR: Catalog-First Dependency Population for Turbogen

- **Status:** Proposed (POA — awaiting Andrew's review)
- **Date:** 2026-08-02
- **Author:** Claude (Fable 5), surveyed against `packages/turbogen@8.0.0` on branch `dev`
- **Decision area:** How generated turborepos receive their dependency versions
- **Decision log:**
  - 2026-08-02 (Andrew): Generated `tooling/*` packages adopt this repo's
    `tooling/` dir **verbatim** (post-refactor: dist-built, `tsdown` for
    everything). `packages/ui` builds with `tsdown` + `@tsdown/css` (see
    `packages/ui/tsdown.config.ts` — css entry via the postcss transformer,
    `unbundle: true`, `dts: { tsgo: true }`). Dropped from the dep surface:
    `tsup`, `@microsoft/api-extractor`, `lucide-react`, `terser`, `webpack`,
    `urlpattern-polyfill` — and with the tsup pipeline gone, `@swc/core`,
    `@swc/helpers`, `chokidar` go with it (§6 table revised accordingly by
    Andrew). A vitest-config scaffolder is now in scope (resolves §8.6/§9.1).
  - 2026-08-02 (Andrew, follow-up): generated tooling dep lists mirror the
    **actual `dependencies`/`devDependencies`** of `tooling/eslint`,
    `tooling/prettier`, and `tooling/vitest` — nothing more. Consequently
    `eslint-config-turbo` and `eslint-plugin-react-compiler` drop entirely
    (resolves §8.7); `babel-plugin-react-compiler` stays (web's
    `reactCompiler: true` needs the babel plugin, not the eslint one).
  - 2026-08-02 (Andrew): **`typescript` is a deliberate version hold at
    `^6.0.3`** — the only one-off that needs manual management for now.
    TypeScript 7.0.2 is npm-latest but breaks eslint (typescript-eslint relies
    on an internal API that 7.0.x doesn't expose yet); 7.1.0 is expected to
    add it. Lift the hold when 7.1.0 ships. Any `--latest` refresh must
    respect holds (§5.8).

---

## 1. Context — how deps population works today

The flow, end to end:

```
bin/init.ts ("init")
  └─ InquirerService → { workspace, port }
      └─ scaffoldService(promptBase, ConfigHandler)
          ├─ EslintScaffolder.exeEslint()     ──┐
          ├─ PrettierScaffolder.exePrettier()   │  each calls a ConfigHandler
          ├─ TsScaffolder.exeTs()               ├─ resolveAllDeps* method, which
          ├─ RootScaffolder.exeRoot()           │  fetches npm "latest" per package
          ├─ UIPackageScaffolder.exeUIPkg()     │  and interpolates ^<version>
          └─ WebAppScaffolder.exeWebApp()     ──┘  into a package.json shell
              └─ rm pnpm-lock.yaml → pnpm install
```

Division of responsibility (as it stands):

- **`src/config/index.ts` (`ConfigHandler`) is the main service.** It owns every
  package.json *shell* (name, scripts, exports, engines, etc.) and performs version
  resolution: `fetchLatestVersion` (`config/index.ts:92`) hits
  `https://registry.npmjs.org/<pkg>/latest` once per package, and the five
  `resolveAllDeps*` methods (`resolveAllDeps`, `resolveAllDepsRoot`,
  `resolveAllDepsEslint`, `resolveAllDepsPrettier`, `resolveAllDepsUIPkg`) map each
  dep list to `[pkg, "^${version}"]` entries via `Promise.all`.
- **Each scaffolder template file owns its dep name lists** as `as const` getters
  (`deps` / `devDeps` / `localDeps` / `localDevDeps` / `peerDeps`) plus all file
  templates. Local workspace deps become `workspace:*`; UI peers become
  `>=${version}` (`config/index.ts:328-333`).
- **`RootScaffolder.pnpmWorkspaceYamlTemplate`** (`root-scaffolder.ts:289`) emits a
  static workspace yaml with **no catalogs section**.
- `TsScaffolder` is the outlier: fully static package.json, no resolution.

### Dependency inventory (current)

| Target | deps | devDeps | peers | local | npm fetches |
|---|---|---|---|---|---|
| `apps/web` (generic-scaffold.ts:390-444) | 12 | 22 | — | 4 | 34 |
| `packages/ui` (ui.ts:854-903) | 5 | 24 | 4 | 3 | 33 |
| root (root-scaffolder.ts:46-69) | — | 11 | — | 4 | 11 |
| `tooling/eslint` (eslint-scaffold.ts:13-44) | 12 | 5 | — | 2 | 17 |
| `tooling/prettier` (prettier-scaffold.ts:64-78) | 3 | 2 | — | 1 | 5 |
| `tooling/typescript` | — | — | — | — | 0 |
| **Total** | | | | | **100 fetches / 60 unique packages** |

*(Pre-restructure snapshot — the tooling-verbatim decision in the log above
shrinks and reshapes these lists; final counts land with the restructure.)*

## 2. Problems with npm-latest-per-package

1. **Version scatter.** The same version string lands in five separate
   package.json files. Bumping anything in a generated repo means hunting through
   every manifest — exactly what catalogs exist to solve.
2. **Redundant, unbounded network work.** 100 concurrent registry calls for 60
   unique packages, zero dedup (`typescript` is fetched 5×; within a single
   `resolveAllDepsUIPkg` call, `next`/`react`/`react-dom`/`tailwindcss` are each
   fetched twice — once for devDeps, once for peers). No retry, no timeout, no
   caching.
3. **Latent failure path (never observed in practice).** `fetchLatestVersion`
   logs on `!res.ok` and *keeps going* (`config/index.ts:95-100`), so a 404/5xx
   body parsed as `NpmLatest` would yield `"pkg": "^undefined"`. Andrew has
   never hit this — the dep lists are all well-known, long-lived packages — so
   this is a hardening note, not a motivating problem. If a guard is ever
   wanted on the dynamic path, falling back to the `latest` dist-tag closes it
   in one line (bare `"latest"` — `^` can't prefix a dist-tag, so `"^latest"`
   isn't a valid spec).
4. **Incoherent version sets.** "Latest of each package independently" cannot
   guarantee a mutually compatible set (`react` 19.x vs `@types/react`, `next`
   vs `@next/eslint-plugin-next`, `tailwindcss` vs `@tailwindcss/postcss`).
   The output has never been tested as a *set* — it's whatever npm had that
   hour. **Live example (2026-08-02):** npm-latest `typescript` is 7.0.2,
   which breaks eslint (typescript-eslint needs an internal API 7.0.x lacks —
   expected in 7.1.0). The current fetch-latest path would scaffold that broken
   pairing today; the catalog snapshot deliberately holds `^6.0.3`.
5. **Non-reproducible output.** Two runs of the same turbogen version produce
   different repos. Bug reports against turbogen aren't reproducible either.
6. **Offline/air-gapped scaffolding is impossible**, and scaffold latency is
   gated on the slowest of ~100 requests.

## 3. Goal

Generated repos should look like this monorepo does: a `pnpm-workspace.yaml`
with **named catalogs** as the single version source, and every generated
package.json referencing `catalog:<group>` — mirroring the root
`pnpm-workspace.yaml` here (which is exactly what
`src/test/__out__/catalog-example.yaml` snapshots, and what
`src/test/catalog.ts` already parses with `yaml`).

## 4. Options considered

### Option A — Static catalog snapshot baked into turbogen (no network)

Turbogen ships a typed catalog constant (versions captured at turbogen
build/publish time). Scaffolding emits the catalogs section into
`pnpm-workspace.yaml` and `catalog:` refs into manifests. Zero registry calls.

- ✅ Deterministic, offline, fast; versions are a *curated, known-good set*
  (this repo builds against them).
- ✅ `resolveAllDeps*` become synchronous — the async plumbing and its failure
  modes disappear.
- ➖ Freshness is bounded by turbogen's release cadence (mitigated: publishing
  turbogen is cheap, and a generated repo can `pnpm update` catalog-wide).

### Option B — Keep dynamic npm resolution, but write catalogs

Same fetch-latest behavior, but versions land once in the catalogs section;
manifests always say `catalog:<group>`.

- ✅ Freshness preserved; maintainability of the *generated* repo solved.
- ➖ All the network fragility (problems 2–4) remains and must be hardened
  (dedup, retry, fallback) to be shippable.

### Option C — Snapshot by default, opt-in `--latest` refresh (**recommended**)

Option A is the default path. An explicit flag/prompt runs a *single deduped
refresh pass* over the package union, overriding snapshot ranges where the
registry answers, falling back to the snapshot (with a warning) where it
doesn't. Because manifests only ever contain `catalog:` refs, dynamic mode
touches **exactly one file** — the workspace yaml.

- ✅ Deterministic default, freshness on demand, and the freshness feature
  stops being in tension with maintainability.
- ✅ The hardened fetch path is small and isolated (one module, one pass).

**Recommendation: Option C**, with Phase 3 (the `--latest` pass) explicitly
deferrable — Phases 1–2 alone deliver Option A and are independently shippable.

## 5. Proposed architecture

New domain: `src/services/catalog/` (explicit-path imports, no barrels).

### 5.1 `definition.ts` — the typed snapshot

```ts
export interface CatalogShape {
  readonly [group: string]: { readonly [pkg: string]: string };
}

export const CATALOG = {
  babel: { "babel-plugin-react-compiler": "^1.0.0" },
  bui: { "@base-ui/react": "^1.6.0" },
  // ... every group in §6 ...
  webpack: { webpack: "^5.x.x" }
} as const satisfies CatalogShape;

export type CatalogName = keyof typeof CATALOG;
export type CatalogedPkg = {
  [K in CatalogName]: keyof (typeof CATALOG)[K] & string;
}[CatalogName];
```

### 5.2 `mapping.ts` — package → group, exhaustive at compile time

```ts
export const PKG_TO_CATALOG = {
  "@base-ui/react": "bui",
  "babel-plugin-react-compiler": "babel",
  // ... every cataloged package ...
} as const satisfies Record<CatalogedPkg, CatalogName>;

export function catalogRef<const P extends CatalogedPkg>(pkg: P) {
  return `catalog:${PKG_TO_CATALOG[pkg]}` as const;
}
```

`satisfies Record<CatalogedPkg, CatalogName>` makes the mapping total: add a
package to `CATALOG` and forget the mapping (or vice versa) → compile error.

### 5.3 Dep lists move into `dep-lists.ts` (centralization)

Today the lists live per-scaffolder. Recommended inversion: one module holds the
per-target lists, typed against the catalog —

```ts
export const WEB_DEPS = [
  "@base-ui/react", "class-variance-authority", /* ... */
] as const satisfies readonly CatalogedPkg[];
```

— and scaffolders import their lists from it. Rationale: (a) an uncataloged dep
is a **compile error**, not a runtime `^undefined`; (b) the union needed for the
root yaml's catalogs section is a static, trivially computed value — no runtime
coordination between scaffolders; (c) "edit deps + versions in one place" is
precisely the maintainability being bought. Templates stay where they are.

*(Alternative, if you prefer domain-locality: keep lists in scaffolders typed as
`readonly CatalogedPkg[]` and aggregate the union in `scaffoldService` → passed
to `RootScaffolder`. Same type safety, more plumbing.)*

### 5.4 `ConfigHandler` builders go synchronous

Each `resolveAllDeps*` keeps its shell but swaps the fetch loops for:

```ts
const entries = packages.map(pkg => [pkg, catalogRef(pkg)] as const);
```

No `async`, no `Promise.all`, no `NpmLatest` on the default path. Local deps
stay `workspace:*`. Method names could honestly become `buildPkgJson*` since
nothing is "resolved" anymore — optional rename, same call sites.

### 5.5 Root yaml emission

`RootScaffolder` composes the existing settings template with an emitted
catalogs section, using the `yaml` package (already a dependency, already used
by `src/test/catalog.ts`) so `@`-scoped keys get quoted correctly:

```ts
import { stringify } from "yaml";

const catalogs = Object.fromEntries(
  usedGroups.map(g => [g, pruneToUsed(CATALOG[g])] as const)
);
const workspaceYaml = `${this.pnpmWorkspaceYamlTemplate}\n\n${stringify({ catalogs })}`;
```

Recommended default: **emit only the members actually referenced** by generated
manifests so generated repos carry no dead entries. (Open question §8.1 covers
shipping the full curated catalog instead.)

### 5.6 Peer dependencies

pnpm supports `catalog:` in `peerDependencies`. Recommend using `catalogRef`
there too for consistency (the generated `packages/ui` is workspace-consumed, so
the practical difference from today's `>=${latest}` floors is nil). If loose
floors matter to you for eventual publishing, keeping `>=` peers sourced from
the catalog's minimum is the one place a static transform (`^x.y.z` → `>=x.y.z`)
would be justified — decision flagged in §8.3.

### 5.7 Snapshot maintenance — this monorepo *is* the catalog

A build-time codegen script (`tsx`, wired as turbogen `prebuild`) reads the repo
root `../../pnpm-workspace.yaml`, merges a small hand-maintained supplemental
map for whatever this repo doesn't itself catalog — after the tooling-verbatim
restructure that's exactly one package: `@d0paminedriven/turbogen` itself — and
writes `definition.ts`. The same codegen can read `tooling/*/package.json` to
emit the tooling dep lists (they're the declared source of truth per the
decision log), eliminating drift there too. Published turbogen therefore
snapshots
whatever this repo — a building, typechecking consumer of those exact ranges —
pinned at publish time. Zero double-entry.

*(Phase-able: hand-write `definition.ts` first, add codegen after.)*

### 5.8 `--latest` refresh (Phase 3, optional)

`refresh.ts`: one pass over `Object.keys(PKG_TO_CATALOG)` (already unique),
bounded concurrency, per-package retry, and a **hard rule**: any failure keeps
the snapshot range and warns — `^undefined` becomes impossible. Fix
`fetchLatestVersion` to actually return a discriminated result
(`{ ok: true, version } | { ok: false }`) instead of falling through on
`!res.ok`. Wire-up: a `--latest` argv flag on `bin/init.ts` (or a third inquirer
prompt).

**Version holds.** Refresh must never override a deliberate pin. Holds are a
typed map with the reason inline; held packages keep the snapshot range and log
why:

```ts
export const REFRESH_HOLDS = {
  typescript:
    "ts 7.0.x lacks the internal API typescript-eslint relies on; lift at 7.1.0"
} as const satisfies Partial<Record<CatalogedPkg, string>>;
```

(Current sole entry: `typescript` held at `^6.0.3` — see decision log.)

## 6. Catalog group mapping (revised — tooling-verbatim)

Groups and ranges align with this repo's root `pnpm-workspace.yaml`; **(new)**
marks members absent from it, needing supplemental pins. (Table revised by
Andrew 2026-08-02: supplemental groups for the retired tsup pipeline and web
extras removed per the decision log.)

| Group | Members (generated-repo subset) |
|---|---|
| `babel` | babel-plugin-react-compiler |
| `bui` | @base-ui/react |
| `clsx` | clsx |
| `csstype` | csstype |
| `cva` | class-variance-authority |
| `dd` | @d0paminedriven/fs, @d0paminedriven/turbogen **(new member)** |
| `dotenv` | dotenv |
| `eslint` | @eslint/compat, @eslint/config-helpers, @eslint/js, eslint, eslint-plugin-import, eslint-plugin-jsx-a11y, eslint-plugin-react, eslint-plugin-react-hooks |
| `jiti` | jiti |
| `motion` | motion, motion-dom, motion-utils |
| `next` | next, next-themes, @next/eslint-plugin-next |
| `node` | @types/node |
| `prettier` | @ianvs/prettier-plugin-sort-imports, prettier, prettier-plugin-tailwindcss |
| `radix` | @radix-ui/react-slot |
| `react` | @types/react, @types/react-dom, react, react-dom |
| `sharp` | sharp |
| `styles` | autoprefixer, postcss |
| `test` | @playwright/test |
| `ts` | typescript |
| `tseslint` | typescript-eslint |
| `tsgo` | @typescript/native-preview |
| `tslib` | tslib |
| `tsx` | tsx |
| `turbo` | turbo, eslint-plugin-turbo |
| `tw` | @tailwindcss/postcss, tailwind-merge, tailwindcss, tailwindcss-motion, tw-animate-css |
| `utils` | @changesets/cli, husky |

Additions implied by the tooling-verbatim decision (all already present in this
repo's root catalogs — no supplemental pins needed):

| Group | Members (via tooling-verbatim / tsdown switch) |
|---|---|
| `tsdown` | tsdown, @tsdown/css |
| `vitest` | vitest, @vitest/coverage-istanbul, @vitest/ui |
| `vite` | vite, @vitejs/plugin-react |
| `glob` | glob |
| `nyc` | nyc |

**Source of truth for tooling rows:** the actual `dependencies`/
`devDependencies` of `tooling/eslint/package.json`,
`tooling/prettier/package.json`, and `tooling/vitest/package.json` — verbatim,
nothing more (per decision log). The rows above already reflect this:
`@eslint/config-helpers` in; `eslint-config-turbo` and
`eslint-plugin-react-compiler` out.

Local `workspace:*` deps are untouched by catalogs, as today (in the verbatim
manifests these are the `@d0paminedriven/*` config refs, re-scoped to
`@${workspace}/*` at generation).

## 7. Implementation plan (phased)

**Phase 1 — catalog module (no behavior change yet)**
1. `src/services/catalog/definition.ts` — `CATALOG` + types (hand-written first pass, seeded from root yaml + one-time latest lookups for the 11 supplemental pins).
2. `src/services/catalog/mapping.ts` — `PKG_TO_CATALOG`, `catalogRef`.
3. `src/services/catalog/dep-lists.ts` — per-target lists moved from scaffolders, `satisfies readonly CatalogedPkg[]`.
4. Tests (extend `src/test/catalog.ts`): yaml round-trip (build → `stringify` → `parse` → deep-equal); every dep-list member maps to an emitted group; exhaustiveness is already compile-time.

**Phase 2 — wire it in (the actual switch)**
5. `ConfigHandler`: swap fetch loops for `catalogRef` entries; drop `async` from the five builders; peers per §8.3 decision.
6. Scaffolders: import lists from `dep-lists.ts`; `exe*` methods lose the `await` on manifest builds.
7. `RootScaffolder`: append emitted `catalogs:` section to `pnpm-workspaceYamlTemplate` output; bump generated `engines.pnpm` to `>=10` (named catalogs require ≥9.5).

**Phase 2b — tooling-verbatim template refresh (per 2026-08-02 decision)**
8. Regenerate `EslintScaffolder`/`PrettierScaffolder` from this repo's `tooling/eslint` and `tooling/prettier`. Dep lists mirror the manifests' `dependencies`/`devDependencies` **exactly** (decided — see decision log); whether template bodies also go full-verbatim (dist-built tsdown packages, TS sources replacing the flat `.mjs` files) is §8.8.
9. **New `VitestScaffolder`** emitting `tooling/vitest` verbatim; register in `scaffoldService` (resolves §9.1 — root's `@${workspace}/vitest-config` ref finally resolves).
10. `UIPackageScaffolder`: build swap tsup → tsdown + `@tsdown/css`, config modeled on `packages/ui/tsdown.config.ts` (css entry, postcss transformer, `unbundle: true`, `dts: { tsgo: true }`); the `postbuild` "use client" flag-check service is **retained** (this repo still runs it under tsdown). devDeps drop `tsup`, `@microsoft/api-extractor`, `terser`, `@swc/core`, `@swc/helpers`, `chokidar`; add `tsdown`, `@tsdown/css`.
11. `WebAppScaffolder`: prune `lucide-react` (icons come from `@${workspace}/ui`), `webpack`, `urlpattern-polyfill`.
12. Changeset: **major** (`@d0paminedriven/turbogen` 8 → 9) — generated output shape changes.

**Phase 3 — `--latest` (optional, deferrable)**
13. `refresh.ts` + hardened `fetchLatestVersion` (discriminated result, retry, dedup is free via `PKG_TO_CATALOG` keys); `--latest` flag in `bin/init.ts`.

**Phase 4 — codegen + cleanups**
14. `prebuild` codegen of `definition.ts` from root `pnpm-workspace.yaml` + supplemental map (§5.7).
15. Cleanups from §9 as approved.

Estimated blast radius: `config/index.ts`, all scaffolder files plus a new `VitestScaffolder`, `bin/init.ts`, new `services/catalog/*`, tests. With Phase 2b, templates are *not* untouched — the tooling scaffolders' template bodies regenerate from `tooling/*` and the ui build config swaps to tsdown; the catalog switch itself (Phases 1–2) only touches the workspace yaml.

## 8. Open questions for Andrew

1. **Emit pruned (used-members-only) catalogs, or ship the full curated catalog** from this repo into every generated workspace yaml? Pruned recommended (no dead entries); full gives scaffolded repos a ready version menu (your `catalog-example.yaml` mirrors the full one, so flagging rather than assuming).
2. **Named catalogs vs the single default `catalog:`** — I've assumed named (matches your repo's aesthetic and self-documents groupings). Confirm.
3. **Peers:** `catalog:` refs (consistent) vs preserving `>=` floors in `packages/ui`?
4. **Dep-list centralization** (§5.3 recommended) vs keeping lists in each scaffolder with typed aggregation?
5. **Is Phase 3 (`--latest`) wanted at all**, or does snapshot + turbogen release cadence cover your freshness needs?
6. ~~`@${workspace}/vitest-config` (§9.1): scaffold a vitest tooling package, or drop the ref?~~ **Resolved 2026-08-02:** scaffold `tooling/vitest` verbatim (Phase 2b, item 9).
7. ~~**`eslint-plugin-react-compiler` / `eslint-config-turbo` retention?**~~ **Resolved 2026-08-02:** the three tooling manifests' actual deps/devDeps are the guide — both drop; `babel-plugin-react-compiler` stays for web.
8. **How literal is template-verbatim for tooling?** The refactored `tooling/eslint`/`tooling/prettier` are dist-built packages (TS sources + tsdown + `exports: dist/*`), not the flat `.mjs` configs turbogen currently emits. Assuming full-verbatim (shells *and* templates, Phase 2b item 8) — confirm, since it's the largest template-refresh chunk of the work.

## 9. Adjacent findings surfaced during survey (not in scope, but load-bearing)

1. **Generated root references a package that is never scaffolded.**
   `RootScaffolder.localDeps` includes `@${workspace}/vitest-config`
   (`root-scaffolder.ts:51`), but `scaffoldService` creates no vitest tooling
   package — `workspace:*` then fails resolution and the generated repo's
   `pnpm install` errors. This repo has `tooling/vitest` to model a scaffolder
   on, or the ref should be dropped. **Resolved 2026-08-02:** `VitestScaffolder`
   emitting `tooling/vitest` verbatim is in scope (Phase 2b, item 9).
2. **`vscodeSettingsTemplate` emits invalid JSON** — missing comma between the
   `json.schemaDownload.trustedDomains` object and `github.copilot.enable`
   (`root-scaffolder.ts:211-212`).
3. **`sideEffecs` typo** in `resolveAllDepsUIPkg`'s shell
   (`config/index.ts:342`) — the generated `packages/ui` manifest carries a
   meaningless key while `sideEffects` is absent.
4. **`js-yaml: ^5.2.3` was added alongside `yaml`** in turbogen's package.json
   (`packages/turbogen/package.json:119`), as a direct semver (the only
   non-catalog external dep). `src/test/catalog.ts` uses `yaml`; recommend
   dropping `js-yaml` and standardizing on `yaml` for emission too.
5. **Latent `^undefined` path** in `fetchLatestVersion`
   (`config/index.ts:95-102`) — see §2.3; never observed in practice. Cheapest
   guard is a `latest` dist-tag fallback; Phase 3's discriminated result — or
   the snapshot path itself, which keeps the pinned range and stays
   deterministic — moots it entirely.

## 10. Consequences

- Generated repos gain single-point version maintenance, coherent known-good
  version sets, and Renovate's native pnpm-catalog support.
- Scaffolding becomes deterministic, offline-capable, and ~100 registry calls
  cheaper; turbogen's default path sheds its async resolution plumbing.
- Freshness moves from "whatever npm had at scaffold time" to "what turbogen
  shipped" — governed by publish cadence, with `--latest` as the escape hatch.
- One-time cost: catalog module + mapping upkeep, made compile-time-checked and
  (Phase 4) codegen'd from this repo's own workspace yaml.
