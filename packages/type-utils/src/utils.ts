export type Unenumerate<T> = T extends (infer U)[] | readonly (infer U)[]
  ? U
  : T;

export type BigIntKeys<T> = {
  [K in keyof T]: T[K] extends bigint ? K : never;
}[keyof T];

export type SerializeBigInts<T, Serialized extends boolean = false> = DX<{
  [K in keyof T]: T[K] extends bigint
    ? Serialized extends true
      ? number
      : bigint
    : T[K];
}>;

// precision (field-level) targeting
export type PrecisionSerializeBigIntField<
  T,
  Field extends keyof T = BigIntKeys<T>,
  Serialized extends boolean = false
> = DX<{
  [K in keyof T]: K extends Field
    ? Serialized extends true
      ? number
      : bigint
    : T[K];
}>;
/**
 * opposite of Exclude with better intellisense/validation
 */
export type Include<T, U extends T> = Exclude<T, Exclude<T, U>>;

/**
 * An enhanced version of Omit
 */
export type Rm<T, P extends keyof T = keyof T> = {
  [S in keyof T as Exclude<S, P>]: T[S];
};

/**
 * helper workup for use in XOR type below
 * makes properties from U optional and undefined in T, and vice versa
 */
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

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
export type CTR<T, K extends keyof OnlyOpt<T> = keyof OnlyOpt<T>> = Rm<T, K> & {
  [Q in K]-?: T[Q];
};

/**
 * RTC (Required to Conditional)
 *
 * - By default: makes all **required** properties optional.
 * - With K: makes only the specified required keys optional.
 */
export type RTC<T, K extends keyof OnlyReq<T> = keyof OnlyReq<T>> = Rm<T, K> & {
  [Q in K]?: T[Q];
};
export type IsExact<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;

/**
 * TCN (To Conditionally Never)
 */
export type TCN<T, X extends keyof T = keyof T> = Rm<T, X> & {
  [Q in X]?: XOR<T[Q], never>;
};

export type IsOptional<T, K extends keyof T> = undefined extends T[K]
  ? object extends Pick<T, K>
    ? true
    : false
  : false;

export type OnlyOpt<T> = {
  [K in keyof T as IsOptional<T, K> extends true ? K : never]: T[K];
};

export type OnlyReq<T> = {
  [K in keyof T as IsOptional<T, K> extends false ? K : never]: T[K];
};

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

export type DX<Y> = {
  [P in keyof Y]: Y[P];
};

// useful for mixins
export type Constructor<A extends any[] = any[], I = object> = new (
  ...args: A
) => I;

export type CommonDiscriminants =
  | "type"
  | "kind"
  | "event"
  | "tag"
  | "_tag"
  | "__typename";

export type LiteralUnion<TKnown extends string> = TKnown | string;

export type DiscriminatedUnionToRecord<
  TUnion extends Record<TKey, string>,
  TKey extends LiteralUnion<CommonDiscriminants> =
    LiteralUnion<CommonDiscriminants>
> = TKey extends keyof TUnion
  ? { [K in TUnion[TKey] & string]: Extract<TUnion, Record<TKey, K>> }
  : never;

export type UnionToRecord<
  TUnion extends Record<"type", string>,
  TDiscriminant extends string = TUnion["type"]
> = {
  [K in TDiscriminant]: Extract<TUnion, { type: K }>;
};
