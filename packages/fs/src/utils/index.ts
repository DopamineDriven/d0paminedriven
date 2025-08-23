import type { RemoveFields, Unenumerate } from "@/types/index.ts";
import { LevenshteinDistance } from "@/ld/index.ts";

export class UtilsService extends LevenshteinDistance {
  public chunkArray<T extends number>(
    arr: string[],
    maxChunkLength: T
  ): string[][] {
    const chunks = Array.of<string[]>();
    let currentChunkLength = 0;
    let currentChunk = Array.of<string>();

    for (const [index, val] of arr.entries()) {
      if (val.length + currentChunkLength >= maxChunkLength) {
        if (currentChunk.length) {
          chunks.push(currentChunk);
        }
        currentChunkLength = val.length;
        currentChunk = [val];
      } else {
        currentChunk.push(val);
        currentChunkLength += val.length + 1; // for comma
      }

      if (arr.length === index + 1) {
        chunks.push(currentChunk);
      }
    }
    return chunks.length ? chunks : [arr];
  }

  public b64ToBlob<const T extends string>(b64Data: T) {
    {
      const sliceSize = 512;
      const typeMatch =
        /^data:((?:image|application|haptics|video|text|font|model|audio|multipart)\/[A-Za-z0-9+-.]+(?:;[^,]+)*);base64,(.+)$/i.exec(
          b64Data
        );

      if (!typeMatch) {
        throw new Error(`${b64Data} is not a valid data Url`);
      }

      const type = typeMatch[1];
      const base64Data = typeMatch?.[2] ?? "";
      const byteCharacters = Buffer.from(base64Data, "base64").toString(
        "binary"
      );
      const byteArrays = Array.of<Uint8Array>();

      for (
        let offset = 0;
        offset < byteCharacters.length;
        offset += sliceSize
      ) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays as BlobPart[], { type });
      // const file = new File([blob], `someblob.fileextension`);
      return blob;
    }
  }

  public arrToArrOfArrs = <const T, const N extends number>({
    arrToFragment = Array.of<T>(),
    arrOfArrsAggregator = Array.of<T[]>(),
    interval
  }: {
    arrToFragment: T[];
    arrOfArrsAggregator: T[][];
    interval: N;
  }) =>
    new Promise((resolve, _reject) =>
      resolve(
        ((interval: number) => {
          for (let i = 0; i <= arrToFragment.length; i++) {
            if ((i % interval === 0 || i === 0) && i <= arrToFragment.length) {
              let segment = arrToFragment.slice(i, i + interval);
              arrOfArrsAggregator.push(segment);
            }
          }
        })(interval)
      )
    ).then(_ => arrOfArrsAggregator);

  public extractTuple<
    const T extends
      | Record<string | number | symbol, unknown>
      | Enumerator<unknown>,
    const V extends keyof T
  >(obj: T, props: V) {
    return [props, obj[props]] as const satisfies readonly [V, T[V]];
  }

  public sort<
    const S extends
      | Record<string | number | symbol, unknown>
      | Enumerator<unknown>,
    const K extends "ASC" | "DESC" | undefined
  >(obj: S, order?: K) {
    return Object.fromEntries(
      Object.entries(obj).sort(([a, _aa], [b, _bb]) =>
        order === "DESC"
          ? b.localeCompare(a) - a.localeCompare(b)
          : a.localeCompare(b) - b.localeCompare(a)
      )
    ) as S;
  }

  public excludeTargeted = <
    const T extends
      | Record<string | number | symbol, unknown>
      | Enumerator<unknown>,
    const V extends keyof T,
    const S extends Parameters<typeof this.sort>["1"]
  >(
    obj: T,
    props: V[],
    sort?: S
  ) => {
    const resolve = Object.fromEntries(
      Object.entries(obj)
        .map(([key, val]) => {
          if (props.includes(key as V)) {
            return ["omit", "omit"] as const;
          } else return [key, val] as const;
        })
        .filter(([t, _v]) => /omit/.test(t) === false)
    );
    return (
      typeof sort !== "undefined" ? this.sort(resolve, sort) : resolve
    ) as RemoveFields<T, Unenumerate<typeof props>>;
  };

  public includeTargeted = <
    const T extends
      | Record<string | number | symbol, unknown>
      | Enumerator<unknown>,
    const V extends keyof T,
    const S extends Parameters<typeof this.sort>["1"]
  >(
    obj: T,
    props: V[],
    sort?: S
  ) => {
    const resolve = Object.fromEntries(
      props.map(val => this.extractTuple(obj, val))
    );
    return (
      typeof sort !== "undefined" ? this.sort(resolve, sort) : resolve
    ) as Pick<T, Unenumerate<typeof props>>;
  };

  public countsSorter = <const T extends object>(
    counter: T,
    keySort: "ASC" | "DESC" = "ASC",
    valSort: "DESC" | "ASC" = "DESC"
  ) =>
    Object.fromEntries(
      Array.from(Object.entries(counter))
        .sort(([aStr, _aNum], [bStr, _bNum]) =>
          keySort === "DESC"
            ? bStr.localeCompare(aStr) - aStr.localeCompare(bStr)
            : aStr.localeCompare(bStr) - bStr.localeCompare(aStr)
        )
        .sort(([aStr, aNum], [bStr, bNum]) => {
          if (typeof (aNum && bNum) === "number") {
            return valSort === "ASC" ? aNum - bNum : bNum - aNum;
          } else if (typeof (aNum && bNum) === "string") {
            return valSort === "ASC"
              ? aStr.localeCompare(bStr) - bStr.localeCompare(aStr)
              : bStr.localeCompare(aStr) - aStr.localeCompare(bStr);
          } else
            throw new Error(
              "only Record<string, string> and Record<string,number> types supported"
            );
        })
    );

  public range(from: number, to: number): number[] {
    const values = Array.of<number>();
    for (let i = from; i < to; i++) {
      values.push(i);
    }
    return values;
  }

  public isPrimeNumber = <const T extends number>(n: T) => {
    for (let i = 2; n > i; i++) {
      if (n % i === 0) {
        return false;
      }
    }
    return n > 1;
  };

  public acceptor = (num: number) =>
    [...Array(num !== 0 ? num : this.range((num = -101), (num = 101))).keys()]
      .reverse()
      .filter(this.isPrimeNumber);
}
