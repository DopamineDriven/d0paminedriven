import type { WithImplicitCoercion } from "buffer";

export type BufferEncodingUnion =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "base64url"
  | "latin1"
  | "binary"
  | "hex"
  | "utf-16le";

export interface Dict<T> {
  [key: string]: T | undefined;
}

export interface ProcessEnv extends Dict<string> {
  readonly VERCEL_ENV: typeof process.env.VERCEL_ENV;
  readonly NODE_ENV: typeof process.env.NODE_ENV;
  /**
   * Can be used to change the default timezone at runtime
   */
  TZ?: string;
}

export interface ProcessEnvOptions {
  uid?: number | undefined;
  gid?: number | undefined;
  cwd?: string | URL | undefined;
  env?: ProcessEnv | undefined;
}

export interface CommonOptions extends ProcessEnvOptions {
  /**
   * @default false
   */
  windowsHide?: boolean | undefined;
  /**
   * @default 0
   */
  timeout?: number | undefined;
}

export type TypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | BigUint64Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

export type Signals =
  | "SIGABRT"
  | "SIGALRM"
  | "SIGBUS"
  | "SIGCHLD"
  | "SIGCONT"
  | "SIGFPE"
  | "SIGHUP"
  | "SIGILL"
  | "SIGINT"
  | "SIGIO"
  | "SIGIOT"
  | "SIGKILL"
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
  | "SIGXFSZ"
  | "SIGBREAK"
  | "SIGLOST"
  | "SIGINFO";

export type ArrayBufferView = DataView | TypedArray;

export type IOType = "overlapped" | "pipe" | "ignore" | "inherit";

export type StdioOptions =
  | IOType
  | (IOType | "ipc" | import("stream").Stream | number | null | undefined)[];

export interface CommonExecOptions extends CommonOptions {
  input?: string | ArrayBufferView | undefined;
  /**
   * Can be set to 'pipe', 'inherit, or 'ignore', or an array of these strings.
   * If passed as an array, the first element is used for `stdin`, the second for
   * `stdout`, and the third for `stderr`. A fourth element can be used to
   * specify the `stdio` behavior beyond the standard streams.
   *
   * @default 'pipe'
   */
  stdio?: StdioOptions | undefined;
  killSignal?: Signals | number | undefined;
  maxBuffer?: number | undefined;
  encoding?: BufferEncoding | "buffer" | null | undefined;
}

export interface ExecSyncOptions extends CommonExecOptions {
  shell?: string | undefined;
}
export interface ExecSyncOptionsWithStringEncoding extends ExecSyncOptions {
  encoding: BufferEncoding;
}
export interface ExecSyncOptionsWithBufferEncoding extends ExecSyncOptions {
  encoding?: "buffer" | null | undefined;
}

export interface ObjEncodingOptions {
  encoding?: BufferEncodingUnion | null | undefined;
}
export type OpenMode = string | number;

export interface Abortable {
  /**
   * When provided the corresponding `AbortController` can be used to cancel an asynchronous action.
   */
  signal?: AbortSignal | undefined;
}

export type Mode = string | number;

export interface MkDirOptions {
  /**
   * Indicates whether parent folders should be created.
   * If a folder was created, the path to the first created folder will be returned.
   * @default false
   */
  recursive?: boolean | undefined;
  /**
   * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
   * @default 0o777
   */
  mode?: Mode | undefined;
}

export type BashEnv = "development" | "production" | "test" | undefined;

export type CoercionUnion = string | Uint8Array | readonly number[];

export type WriteStreamDataShape =
  | WithImplicitCoercion<CoercionUnion>
  | CoercionUnion;

export type WriteStreamProps<T extends string = string> = {
  data: WithImplicitCoercion<CoercionUnion>;
  cwd: string;
  path: T;
};

export type WriteStreamOptions =
  | BufferEncodingUnion
  | {
      encoding?: BufferEncodingUnion;
      autoClose?: boolean;
      emitClose?: boolean;
      start?: number;
      highWaterMark?: number;
      flush?: boolean;
    };

export type WriteFileAsyncDataUnion =
  | WithImplicitCoercion<string>
  | { [Symbol.toPrimitive](hint: "string"): string }
  | string;

export interface ReadDirOptionsEntity extends ObjEncodingOptions {
  withFileTypes?: false | undefined;
  recursive?: boolean | undefined;
}

export type ReadDirOptions = {
  [P in keyof ReadDirOptionsEntity]: ReadDirOptionsEntity[P];
};

export type WriteFileAsyncOptions =
 ( | (ObjEncodingOptions & {
      mode?: Mode | undefined;
      flag?: OpenMode | undefined;
    } & Abortable)
  | BufferEncodingUnion
  | null);

export type WriteFileAsyncProps<T extends string = string> = {
  path: T;
  cwd: string;
  data: WriteFileAsyncDataUnion;
  options?:
    | (ObjEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
      } & Abortable)
    | BufferEncodingUnion
    | null;
};

export type RmDirOptions = {
  /**
   * If an `EBUSY`, `EMFILE`, `ENFILE`, `ENOTEMPTY`, or
   * `EPERM` error is encountered, Node.js will retry the operation with a linear
   * backoff wait of `retryDelay` ms longer on each try. This option represents the
   * number of retries. This option is ignored if the `recursive` option is not
   * `true`.
   * @default 0
   */
  maxRetries?: number | undefined;
  /**
   * @deprecated since v14.14.0 In future versions of Node.js and will trigger a warning
   * `fs.rmdir(path, { recursive: true })` will throw if `path` does not exist or is a file.
   * Use `fs.rm(path, { recursive: true, force: true })` instead.
   *
   * If `true`, perform a recursive directory removal. In
   * recursive mode, operations are retried on failure.
   * @default false
   */
  recursive?: boolean | undefined;
  /**
   * The amount of time in milliseconds to wait between retries.
   * This option is ignored if the `recursive` option is not `true`.
   * @default 100
   */
  retryDelay?: number | undefined;
};

export type RmDirProps = {
  options?: RmDirOptions;
}["options"];

export type ReadDirProps<T extends string> = {
  path: T;
  options?: ReadDirOptions;
};

export type MkDirSyncOptions =
  | Mode
  | (MkDirOptions & {
      recursive?: boolean | undefined;
    })
  | null
  | undefined;

export type MkDirSyncProps<T extends string> = {
  cwd: string;
  path: T;
  options?:
    | Mode
    | (MkDirOptions & { recursive?: boolean | undefined })
    | null
    | undefined;
};

export interface ExecuteCommandProps<T extends string>
  extends ExecSyncOptionsWithBufferEncoding {
  command: T;
}

export type ConditionalPromise<T> = T | Promise<T>;

export type UnwrapPromise<T> = T extends Promise<infer U> | PromiseLike<infer U>
  ? U
  : T;

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
export type XOR<T, U> =
  [T, U] extends [object, object]
    ? (Without<T, U> & U) | (Without<U, T> & T)
    : T | U

/**
 * Conditional to Required
 */
export type CTR<
  T,
  K extends keyof OnlyOptional<T> = keyof OnlyOptional<T>
> = Rm<T, K> & {
  [Q in K]-?: T[Q];
};

/**
 * Required to Conditional
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
 * To Conditionally never
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

export type RemoveFields<T, P extends keyof T = keyof T> = {
  [S in keyof T as Exclude<S, P>]: T[S];
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

export type ConditionalToRequired<T, Z extends keyof T = keyof T> = Rm<T, Z> & {
  [Q in Z]-?: T[Q];
};

export type RequiredToConditional<T, X extends keyof T = keyof T> = Rm<T, X> & {
  [Q in X]?: T[Q];
};

export type FieldToConditionallyNever<T, X extends keyof T = keyof T> = Rm<
  T,
  X
> & { [Q in X]?: XOR<T[Q], never> };

export type ExcludeFieldEnumerable<T, K extends keyof T> = Rm<T, K>;

export type ArrayOrReadOnlyArray<T> = T[] | readonly T[];

export type Depth<
  Y extends { [record: string | symbol | number]: unknown },
  X extends keyof Y = keyof Y
> = {
  [H in keyof Y[X]]: Y[X][H][keyof Y[X][H]];
};

export type InferDepth<T> = T extends Depth<infer U, infer X> ? U[X] : T;

export type OmitSrc<T> = T extends `src/${infer U}` ? U : T;

export type InjectScriptsProps<T> = {
  content: {
    scripts: {
      [record: string]: string;
    };
  } & {
    [record: string]:
      | string
      | number
      | boolean
      | {
          [record: string]: string;
        };
  };
  tuplesToInject: T;
};

export type ParsedUrlInfo = {
  href: string;
  protocol: string;
  baseUrl: string;
  host: string;
  pathname: string;
  search: string;
  hash: string;
};

export const unitsObj = {
  PB: 5,
  TB: 4,
  GB: 3,
  MB: 2,
  KB: 1,
  B: 0
} as const;

export type Unit = keyof typeof unitsObj;

export type SizeOpts = { decimals?: number; includeUnits?: boolean };

export interface ImageSpecs {
  width: number;
  height: number;
  format: "png" | "jpeg" | "gif" | "bmp" | "webp" | "avif" | "unknown";
  frames: number;
  animated: boolean;
  hasAlpha: boolean | null;
  orientation: number | null; // EXIF orientation (1-8) or null
  aspectRatio: number;
  colorSpace:
    | "rgb"
    | "rgba"
    | "grayscale"
    | "grayscale-alpha"
    | "indexed"
    | "cmyk"
    | "ycbcr"
    | "ycck"
    | "unknown";
  iccProfile: string | null; // Profile name/description if available, or 'embedded' if present but unnamed, null otherwise
  exifDateTimeOriginal: string | null; // ISO-like string or null
}

// Helper for AVIF box finding
export interface BoxInfo {
  pos: number;
  size: number;
}
