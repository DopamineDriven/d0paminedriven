# @d0pamiedriven/mdx

---

### Providing a "Sans Coercion" VFile class via Augmentation

While the official [README.md](https://github.com/vfile/vfile/blob/main/readme.md) of the `vfile` package instructs consumers to augment the `DataMap` interface to inject known attributes (field keys and their corresponding types) into the `data` field of the instantiated `VFile` class: 

```ts
/**
 * This map registers the type of the `data` key of a `VFile`.
 *
 * This type can be augmented to register custom `data` types.
 *
 * @example
 * declare module 'vfile' {
 *   interface DataMap {
 *     // `file.data.name` is typed as `string`
 *     name: string
 *   }
 * }
 */
export interface DataMap {
  [emptyObjectSymbol]?: never
}

```

There remains a key issue with how it's implemented that unnecessarily introduces Type Coercion of the conditionally undefined variety:


```ts

/**
 * Custom info.
 *
 * Known attributes can be added to {@linkcode DataMap}
 */
export type Data = Record<string, unknown> & Partial<DataMap>


```

So while augmenting the `DataMap` interface with your attributes and their corresponding types will inject the `data` field of an instantiated VFile class ***it will also coerce every single field into being conditionally undefined for no discernible reason*** 

How?

```ts
export type Data = Record<string, unknown> & Partial<DataMap>
```

when using the `Partial<T>` wrapper you coerce all fields of `T` into being conditionally undefined

```ts
type Partial<T> = {
  [P in keyof T]?: T[P];
}
```

#### The Solution 
The simplest way to remedy this issue is by augmenting the `vFile` module directly by adding a new class that extends the core `VFile` class (thereby inheriting its class properties) so that the data field can be redefined to avoid type coercion:

```ts
declare module "vfile" {
/**
 * a VFile class that doesn't result in conditionally undefined type coerceion
 */
  class VFileSansCoercion<
    TData extends { [P in keyof DataMap]: DataMap[P] }
  > extends VFile {
    data: TData;
  }
}

```

let's augment the DataMap interface as follows:

```ts
declare module "vfile" {
  interface DataMap {
    postTags: string[];
    postId: number;
    postTitle: string;
    postDescription?: string;
  }
}
```

if using the `VFile` class you'll find that `postTags`, `postId`, and `postTitle` are all conditionally undefined when keying-into the `data` field which flies in the face of how the attribute types are defined; if using the `VFileSansCoercion` class instead these attributes and their type definitions are preserved exactly how they're written

Once the `vfile` module has been augmented with the `VFileSansCoercion` class it can be imported directly from the `vfile` package throughout your repository  

```ts
import { VFile } from "vfile"; // ↩ don't use this 🚫 it introduces type coercion
import { VFileSansCoercion } from "vfile"; // ↩ use this ✅ it preserves types as they're defined
```
#### Summary

The `VFileSansCoercion` class serves as an exact 1:1 drop-in replacement for `VFile` and preserves the integrity of any `DataMap`-injected attribute type definitions. coercion)
