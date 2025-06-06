import type { ParsedUrlInfo } from "@/types/index.ts";

export type HandleQueryParamsOrHash<T> = T extends `${infer X}?${string}`
  ? X
  : T extends `${infer X}#${string}`
    ? X
    : T;
export type SplitForwardSlash<S extends string> =
  S extends `${infer First}/${infer Rest}`
    ? [First, ...SplitForwardSlash<Rest>]
    : S extends ""
      ? []
      : [S];

export type LastSegment<T extends unknown[]> = T extends [...infer _, infer L]
  ? L
  : never;

export type InferExtensionIfPresent<L> = L extends `${string}.${infer F}`
  ? F
  : "NO_EXTENSION";

/**
 * usage
 *
 * ```ts
 * type FileExtExample = UrlFileExt<"https://raw.githubusercontent.com/mrdoob/three.js/refs/heads/dev/examples/models/gltf/collision-world.glb"> // "glb"
 * type NoFileExtExample = UrlFileExt<"https://raw.githubusercontent.com/mrdoob/three.js/refs/heads/dev/examples/models/gltf/collision-world"> // "NO_EXTENSION"
 *
 * ```
 */

export type UrlFileExt<S extends string> = InferExtensionIfPresent<
  LastSegment<SplitForwardSlash<HandleQueryParamsOrHash<S>>>
>;

export class UrlService {
  private URL_REGEX =
    /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
  public parseUrl(url: string) {
    const parsed = this.URL_REGEX.exec(url);
    if (parsed) {
      return {
        href: parsed[0],
        protocol: parsed[1] ?? "",
        baseUrl: `${parsed[1]}${parsed[3]}`,
        host: parsed[4] ?? "",
        pathname: parsed[5] ?? "",
        search: parsed[6] ?? "",
        hash: parsed[8] ?? ""
      } satisfies ParsedUrlInfo;
    } else return null;
  }
}
