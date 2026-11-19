import type { ValidAsciiUnion } from "@/codes.ts";
import type { ValidSymbolUnion } from "@/symbols.ts";
import { asciiToSymbol, isValidAscii, validAscii } from "@/codes.ts";
import { isValidSymbol, symbolToAscii, validSymbol } from "@/symbols.ts";

export type Unenumerate<T> = T extends (infer U)[] | readonly (infer U)[]
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
    ? ((Without<T, U> & U) | (Without<U, T> & T))
    : T | U

// xor from prisma
// type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never; };
// /**
//  * XOR is needed to have a real mutually exclusive union type
//  * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
//  */
// export type XOR<T, U> = T extends object ? U extends object ? ((Without<T, U> & U) | (Without<U, T> & T)) & object : U : T;

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

/**
 * AtLeastOne
 *
 * - every property optional, but at least one of K must be present
 * - By default: K is every key of T
 */
export type AtLeastOne<
  T,
  K extends keyof OnlyOptional<RTC<T>> = keyof OnlyOptional<RTC<T>>
> = {
  [P in K]: CTR<RTC<T>, P>;
}[K];

export type IsExact<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

export type UTR<
  TUnion extends Record<TKey, string>,
  TKey extends string = "kind",
  TExclude extends `strip-${TKey}` | boolean = false
> = {
  [K in TUnion[TKey]]: TExclude extends false
    ? Extract<TUnion, Record<TKey, K>>
    : Rm<Extract<TUnion, Record<TKey, K>>, TKey>;
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
 * Expect that the thing passed to Expect<T> is true.
 *
 * For instance, `Expect<true>` won't error. But
 * `Expect<false>` will error.
 */
export type Expect<T extends true> = T;

/**
 * Checks that X and Y are exactly equal.
 *
 * For instance, `Equal<'a', 'a'>` is true. But
 * `Equal<'a', 'b'>` is false.
 *
 * This also checks for exact intersection equality. So
 * `Equal<{ a: string; b: string  }, { a: string; b: string }>`
 * is true. But `Equal<{ a: string; b: string  }, { a: string; } & { b: string }>`
 * is false.
 */
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

/**
 * Checks that Y is assignable to X.
 *
 * For instance, `Extends<string, 'a'>` is true. This is because
 * 'a' can be passed to a function which expects a string.
 *
 * But `Extends<'a', string>` is false. This is because a string
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
> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rm<T, K> & Record<K, RequireNested<Required<T>[K], Rest>>
    : T
  : Path extends keyof T
    ? Rm<T, Path> & Record<Path, Required<T>[Path]>
    : T;

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

// export type FilterBySelect<Q extends keyof ModelIdToModelDisplayName> = Exclude<
//   Exclude<Q, ProductDataFull>,
//   ProductDataFull
// >;

// export type FilterResults<S extends keyof ProductDataFull> = Rm<
//   ProductDataFull,
//   Exclude<keyof ProductDataFull, FilterBySelect<S>>
// >;
/**
 *
 */

export type NumRange<
  N extends number = number,
  Result extends unknown[] = []
> = Result["length"] extends N
  ? Result
  : NumRange<N, [...Result, Result["length"]]>;

export type NumUnion<A extends number> = Unenumerate<NumRange<A>>;

export type RepeatRO<
  T,
  N extends number,
  Result extends readonly T[] = readonly []
> = N extends N
  ? Result["length"] extends N
    ? Result
    : RepeatRO<T, N, readonly [...Result, T]>
  : never;

export type Repeat<T, N extends number, Result extends T[] = []> = N extends N
  ? Result["length"] extends N
    ? Result
    : Repeat<T, N, [...Result, T]>
  : never;
/**
 * generic args
 *
 * (1) the type &rarr; `T`
 *
 * (2) is readonly (boolean; defaults to false) &rarr; `RO`
 *
 * (3) min (number; defaults to 1) &rarr; `Min`
 *
 * (4) max (number; defaults to 5) &rarr; `Max`
 *
 * `FlexiRepeater<T, RO, Min, Max>`
 */
export type Repeater<
  T,
  RO extends boolean = false,
  Min extends number = 1,
  Max extends number = 5
> = RO extends true
  ? RepeatRO<T, Exclude<NumUnion<Max> | Max, NumUnion<Min>>>
  : Repeat<T, Exclude<NumUnion<Max> | Max, NumUnion<Min>>>;

export type ValidSymbolMap<Q extends string = string> =
  Q extends ValidSymbolUnion
    ? {
        [P in Q]: (typeof symbolToAscii)[P];
      }[Q]
    : never;

export type ValidAsciiMap<Q extends number = number> = Q extends ValidAsciiUnion
  ? {
      [P in Q]: (typeof asciiToSymbol)[P];
    }[Q]
  : never;

export function asciiEpimer<const P extends string = string>(
  s: P
): P extends ValidSymbolUnion ? ValidSymbolMap<P> : never;
export function asciiEpimer<const P extends number = number>(
  s: P
): P extends ValidAsciiUnion ? ValidAsciiMap<P> : never;
export function asciiEpimer(s: string | number) {
  if (typeof s === "string" && isValidSymbol(s)) return symbolToAscii[s];
  else if (typeof s === "number" && isValidAscii(s)) return asciiToSymbol[s];
  else throw new Error(`invalid symbol or code input ${s}`);
}

