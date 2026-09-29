import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

/* eslint-disable @typescript-eslint/await-thenable */

export class TypesPackageScaffolder {
  constructor(
    public baseProps: PromptPropsBase,
    protected handler: ConfigHandler
  ) {}

  private get workspace() {
    return this.baseProps.workspace;
  }

  private get rootUtils() {
    // prettier-ignore
    return `export type Unenumerate<T> = T extends (infer U)[] | readonly (infer U)[]
  ? U
  : T;

export type BigIntKeys<T> = {
  [K in keyof T]: T[K] extends bigint ? K : never;
}[keyof T];

export type SerializeBigInt<T, Serialized extends boolean = boolean> = {
  [K in keyof T]: T[K] extends bigint | null | undefined
    ? Serialized extends true
      ? Exclude<T[K], bigint> | number
      : T[K]
    : T[K];
};

export type NormalizeAndInject<V, Q = object, P extends boolean = boolean> = DX<
  SerializeBigInt<V, P> & Q
>;

/**
 * Superior form of Omit
 */
export type Rm<T, P extends keyof T = keyof T> = {
  [S in keyof T as Exclude<S, P>]: T[S];
};

/**
 * helper workup for use in XOR type below
 * makes properties from U optional and undefined in T, and vice versa
 */
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type Include<T, U extends T> = Exclude<T, Exclude<T, U>>;

/**
 * enforces mutual exclusivity of T | U
 */
// prettier-ignore
export type XOR<T, U> =
  [T, U] extends [object, object]
    ? (Without<T, U> & U) | (Without<U, T> & T)
    : T | U

/**
 * CTR (Conditional to Required)
 *
 * - By default: makes all **optional** properties required.
 * - With K: makes only the specified optional keys required.
 */
export type CTR<
  T,
  K extends keyof OnlyOptional<T> = keyof OnlyOptional<T>
> = Rm<T, K> & {
  [Q in K]-?: T[Q];
};

/**
 * RTC (Required to Conditional)
 *
 * - By default: makes all **required** properties optional.
 * - With K: makes only the specified required keys optional.
 */
export type RTC<
  T,
  K extends keyof OnlyRequired<T> = keyof OnlyRequired<T>
> = Rm<T, K> & {
  [Q in K]?: T[Q];
};
export type IsExact<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

/**
 * UTR (Union to Record)
 *
 * takes in a union of discriminated objects sharing at least one differentiating field (eg, \`type\`)
 * creates a record from the union as follows
 *
 * \`type ComprehensiveRecord = UTR<MyDiscriminatedUnion, "type">;\`
 */
export type UTR<
  TUnion extends Record<TKey, string>,
  TKey extends string = "kind",
  TDiscriminant extends string = TUnion[TKey]
> = {
  [K in TDiscriminant]: Extract<TUnion, Record<TKey, K>>;
};

/**
 * TCN (To Conditionally Never)
 */
export type TCN<T, X extends keyof T = keyof T> = Rm<T, X> & {
  [Q in X]?: XOR<T[Q], never>;
};

export type ArrFieldReplacer<
  T extends unknown[] | readonly unknown[],
  V extends keyof Unenumerate<T>,
  Q extends boolean = false,
  P = unknown
> = T extends (infer U)[] | readonly (infer U)[]
  ? V extends keyof U
    ? Q extends true
      ? P extends Record<infer Y, infer X>
        ? (Rm<U, V> & Record<Y, X>)[]
        : (Rm<U, V> & P)[]
      : Q extends false
        ? Rm<U, V>[]
        : U
    : T
  : T;

export type IsOptional<T, K extends keyof T> = undefined extends T[K]
  ? object extends Pick<T, K>
    ? true
    : false
  : false;

export type OnlyOptional<T> = {
  [K in keyof T as IsOptional<T, K> extends true ? K : never]: T[K];
};

export type OnlyRequired<T> = {
  [K in keyof T as IsOptional<T, K> extends false ? K : never]: T[K];
};

/**
 * workup for next.js dynamic route generate static params handling
 */
export type InferGSPRTWorkup<T> =
  T extends Promise<readonly (infer U)[] | (infer U)[]> ? U : T;

/**
 * infer generate static params return type in next.js dynamic routes
 */
export type InferGSPRT<V extends (...args: any) => any> = {
  params: Promise<InferGSPRTWorkup<ReturnType<V>>>;
};

/**
 * Expect that the thing passed to Expect<T> is true.
 *
 * For instance, \`Expect<true>\` won't error. But
 * \`Expect<false>\` will error.
 */
export type Expect<T extends true> = T;

/**
 * Checks that X and Y are exactly equal.
 *
 * For instance, \`Equal<'a', 'a'>\` is true. But
 * \`Equal<'a', 'b'>\` is false.
 *
 * This also checks for exact intersection equality. So
 * \`Equal<{ a: string; b: string  }, { a: string; b: string }>\`
 * is true. But \`Equal<{ a: string; b: string  }, { a: string; } & { b: string }>\`
 * is false.
 */
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

/**
 * Checks that Y is assignable to X.
 *
 * For instance, \`Extends<string, 'a'>\` is true. This is because
 * 'a' can be passed to a function which expects a string.
 *
 * But \`Extends<'a', string>\` is false. This is because a string
 * CANNOT be passed to a function which expects 'a'.
 */
export type Extends<X, Y> = Y extends X ? true : false;

export type DX<Y> = {
  [P in keyof Y]: Y[P];
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type DeepPartialFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: DeepPartial<T[P]>;
};

// Recursive type replacement
export type DeepReplace<T, From, To> = T extends From
  ? To
  : T extends object
    ? { [K in keyof T]: DeepReplace<T[K], From, To> }
    : T;

// Make certain nested fields required
export type RequireNested<
  T,
  Path extends string
> = Path extends \`\${infer K}.\${infer Rest}\`
  ? K extends keyof T
    ? Rm<T, K> & Record<K, RequireNested<Required<T>[K], Rest>>
    : T
  : Path extends keyof T
    ? Rm<T, Path> & Record<Path, Required<T>[Path]>
    : T;

export type FlexiCase<T extends string> = Lowercase<T> | Uppercase<T>;

export type Signals =
  | "SIGABRT"
  | "SIGALRM"
  | "SIGBREAK"
  | "SIGBUS"
  | "SIGCHLD"
  | "SIGCONT"
  | "SIGFPE"
  | "SIGHUP"
  | "SIGILL"
  | "SIGINFO"
  | "SIGINT"
  | "SIGIO"
  | "SIGIOT"
  | "SIGKILL"
  | "SIGLOST"
  | "SIGPIPE"
  | "SIGPOLL"
  | "SIGPROF"
  | "SIGPWR"
  | "SIGQUIT"
  | "SIGSEGV"
  | "SIGSTKFLT"
  | "SIGSTOP"
  | "SIGSYS"
  | "SIGTERM"
  | "SIGTRAP"
  | "SIGTSTP"
  | "SIGTTIN"
  | "SIGTTOU"
  | "SIGUNUSED"
  | "SIGURG"
  | "SIGUSR1"
  | "SIGUSR2"
  | "SIGVTALRM"
  | "SIGWINCH"
  | "SIGXCPU"
  | "SIGXFSZ";

/**
 * retained to support repos still using it
 */
export type BigIntOrNumber<T extends boolean = false> = T extends true
  ? number
  : bigint;
` as const;
  }

  private get srcRootIndex() {
    // prettier-ignore
    return `export type {
  ArrFieldReplacer,
  BigIntOrNumber,
  BigIntKeys,
  CTR,
  DeepPartial,
  DeepPartialFields,
  DeepReplace,
  DX,
  Equal,
  Expect,
  Extends,
  FlexiCase,
  InferGSPRT,
  InferGSPRTWorkup,
  Include,
  IsExact,
  IsOptional,
  NormalizeAndInject,
  OnlyOptional,
  OnlyRequired,
  RequireNested,
  RTC,
  Rm,
  SerializeBigInt,
  Signals,
  TCN,
  UTR,
  Unenumerate,
  Without,
  XOR
} from "@/utils.ts";

declare global {
  interface JSON {
    parse<T = unknown>(
      text: string,
      reviver?: (this: any, key: string, value: any) => any
    ): T;
  }
  interface Body {
    json<T = unknown>(): Promise<T>;
  }
  interface ObjectConstructor {
    // PropertyKey -> string and number allowed, symbol disallowed (symbol can't be enumerable)
    keys<T = object>(
      o: T
    ): (keyof T extends infer K
      ? K extends string
        ? K
        : K extends number
          ? \`\${K}\`
          : never
      : never)[];
  }
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

  private get tsConfigTemplate() {
    // prettier-ignore
    return `{
  "extends": "@${this.workspace}/tsconfig/node-pkg.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    },
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json",
    "types": ["*"]
  },
  "include": ["**/*.ts", "src/**/*.ts", "**/*.preset.ts"],
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
    ] as const;
  }

  private get localDevDeps() {
    return [
      `@${this.workspace}/eslint-config`,
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`
    ] as const;
  }

  private pkgPath<const F extends string>(file: F) {
    return `packages/types/${file}` as const;
  }

  private get pkgPaths() {
    return {
      turbojson: this.pkgPath("turbo.json"),
      packageJson: this.pkgPath("package.json"),
      eslint: this.pkgPath("eslint.config.ts"),
      tsdown: this.pkgPath("tsdown.config.ts"),
      tsconfig: this.pkgPath("tsconfig.json"),
      rootIndex: this.pkgPath("src/index.ts"),
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

  public async exeTypesPkg() {
    const pkgJson = await this.handler.resolveAllDepsTypesPkg(
      this.devDeps,
      this.localDevDeps,
      this.workspace
    );
    return Promise.all([
      this.wt("packages/types/eslint.config.ts", this.eslintConfigTs),
      this.wt("packages/types/package.json", JSON.stringify(pkgJson, null, 2)),
      this.wt("packages/types/src/index.ts", this.srcRootIndex),
      this.wt("packages/types/tsconfig.json", this.tsConfigTemplate),
      this.wt("packages/types/tsdown.config.ts", this.tsdownConfigTemplate),
      this.wt("packages/types/turbo.json", this.turboJson),
      this.wt("packages/types/src/utils.ts", this.rootUtils)
    ]);
  }
}
