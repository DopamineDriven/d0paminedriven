export type PromptPropsBase = {
  readonly workspace: string;
  readonly port: string;
};
export type ToPascalCase<S extends string> = string extends S
  ? string
  : S extends `${infer T}-${infer U}`
    ? `${Capitalize<T>}${ToPascalCase<U>}`
    : Capitalize<S>;

export type NpmLatest = {
  name: string;
  version: string;
  keywords: string[];
  [record: string]:
    | string
    | number
    | boolean
    | string[]
    | Record<string, string>;
};
