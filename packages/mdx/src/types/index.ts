export type FrontMatterValue =
  | string
  | number
  | boolean
  | null
  | FrontMatterValue[]
  | { [key: string]: FrontMatterValue };

export type FrontMatter = { [key: string]: FrontMatterValue };

export interface MdxEntity extends FrontMatter {
  content: string;
}
