export type Unenumerate<T> = T extends (infer U)[] | readonly (infer U)[]
  ? U
  : T;

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
export type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

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

export type Include<T, U extends T> = Exclude<T, Exclude<T, U>>;

export type CommonDiscriminants =
  | "type"
  | "kind"
  | "event"
  | "tag"
  | "_tag"
  | "__typename";
// type CommonDiscriminantObj<T extends CommonDiscriminants = CommonDiscriminants> = readonly [Include<CommonDiscriminants,T>,string];

// const O =(props: CommonDiscriminantObj<"type">)=>({[props[0]]: props[1]})

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

export type NumRange<
  N extends number = number,
  Result extends unknown[] = []
> = Result["length"] extends N
  ? Result
  : NumRange<N, [...Result, Result["length"]]>;

export type NumUnion<A extends number> = Unenumerate<NumRange<A>>;

// type ComputeRange<
//   N extends number,
//   Result extends unknown[] = []
// > = Result["length"] extends N
//   ? Result
//   : ComputeRange<N, [...Result, Result["length"]]>;

//   type Add<A extends number, B extends number> =
//     [...ComputeRange<A>, ...ComputeRange<B>]["length"]
// type BuildArray<
//   Length extends number,
//   Arr extends unknown[] = []
// > = Arr["length"] extends Length ? Arr : BuildArray<Length, [...Arr, unknown]>;

// // A helper type that maps every element of a tuple T to a value U
// type MapArray<T extends unknown[], U> = T extends [infer First, ...infer Rest]
//   ? [U, ...MapArray<Rest, U>]
//   : [];

// // The Flatten helper recursively concatenates an array of arrays into one array
// type Flatten<T extends unknown[][]> = T extends [
//   infer Head extends unknown[],
//   ...infer Tail extends unknown[][]
// ]
//   ? [...Head, ...Flatten<Tail>]
//   : [];

// // Multiply by mapping each element of a BuildArray<B> to ComputeRange<A>, then flattening.
// type Multiply<A extends number, B extends number> =
//   // @ts-expect-error excessive stack depth
//   Flatten<MapArray<BuildArray<B>, ComputeRange<A>>>["length"];

// // Multiplty<8,5> = 40; Multiplty<8,6> = 48; etc
// type Test = Multiply<8, 5>;

// // For example, Multiply<8,5> === 40.
// type TestMultiply = Multiply<8, 5>;

// //
// // New Helpers for Division
// //

// // Subtract: Given two numbers A and B (with A >= B), compute A - B.
// type Subtract<A extends number, B extends number> =
//   BuildArray<A> extends [...BuildArray<B>, ...infer R] ? R["length"] : never;

// // DivideInteger: Computes the integer (floor) quotient by repeatedly subtracting D from N.
// type DivideInteger<
//   N extends number,
//   D extends number,
//   Count extends unknown[] = []
// > =
//   BuildArray<N> extends [...BuildArray<D>, ...infer R]
//     ? DivideInteger<R["length"], D, [...Count, unknown]>
//     : Count["length"];

// // DivideFraction: Recursively computes the decimal (fraction) digits.
// // It multiplies the remainder by 10, finds the next digit via integer division,
// // subtracts digit*D, and continues until Precision is 0 or the remainder becomes 0.
// type DivideFraction<
//   R extends number, // current remainder
//   D extends number, // divisor
//   Precision extends number = PrecisionVals, // remaining decimal places to compute
//   Digits extends string = ""
// > = Precision extends 0
//   ? Digits
//   : R extends 0
//     ? Digits
//     : Multiply<R, 10> extends infer T
//       ? T extends number
//         ? DivideInteger<T, D> extends infer Digit
//           ? Digit extends number
//             ? Multiply<Digit, D> extends infer Prod
//               ? Prod extends number
//                 ? Subtract<T, Prod> extends infer NewR
//                   ? NewR extends number
//                     ? DivideFraction<
//                         NewR,
//                         D,
//                         Subtract<Precision, 1>,
//                         `${Digits}${Digit}`
//                       >
//                     : never
//                   : never
//                 : never
//               : never
//             : never
//           : never
//         : never
//       : never;

// // Divide: Combines the integer and fractional parts. If there’s no remainder,
// // it simply returns the integer part. Otherwise, it returns a template literal
// // combining the integer part and the fractional digits.
// type PrecisionVals = Exclude<NumUnion<22>, 0>;

// type Divide<
//   N extends number,
//   D extends number,
//   Precision extends PrecisionVals = 21
// > =
//   DivideInteger<N, D> extends infer I
//     ? I extends number
//       ? Multiply<I, D> extends infer Prod
//         ? Prod extends number
//           ? Subtract<N, Prod> extends infer R
//             ? R extends number
//               ? R extends 0
//                 ? I
//                 : `${I}.${DivideFraction<R, D, Precision>}`
//               : never
//             : never
//           : never
//         : never
//       : never
//     : never;

// type InferFloat<T> = T extends `${infer U}` ? U : T;

// // Test: Divide 4 by 3 should be inferred as "1.3333"
// type TestDivision = Divide<4, 3, 21>;

// const x = <
//   const V extends number,
//   const Z extends number,
//   const P extends PrecisionVals = 21
// >([v, z, p]: readonly [V, Z, P]) => {
//   return (v / z).toPrecision(p) as Divide<V, Z, P>;
// };

// const y = x([4, 3, 2]);
// type PDFRange = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// export type PDFVersions =
// `1.${PDFRange}`
//   | "2.0";
// // Hovering over TestDivision shows: "1.3333"
// type ParseFloatResult<T extends `${number}.${number}`> =
//   T extends `${infer N extends number}.${infer U extends number}`
//     ?  Divide<U, 10, 1>
//     : number;

//     type TEST = ParseFloatResult<PDFVersions>;


