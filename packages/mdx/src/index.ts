import { VFile } from "vfile";
import YAML, {
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions
} from "yaml";

export {} from "@/temp";

// The type for YAML parser options.
export type YamlOptions = DocumentOptions &
  ParseOptions &
  SchemaOptions &
  ToJSOptions;

export type MatterOptions = {
  /**
   * If true, remove the YAML front matter from the file body.
   * Default: false.
   */
  strip?: boolean;
  /**
   * Options passed to the YAML parser.
   */
  yaml?: Partial<{ [P in keyof YamlOptions]: YamlOptions[P] }>;
};

// Matches YAML front matter at the top of the document.
const FRONT_MATTER_REGEX =
  /^---(?:\r?\n|\r)(?:([\s\S]*?)(?:\r?\n|\r))?---(?:\r?\n|\r|$)/;

export function matter(file: VFile, options?: MatterOptions): void {
  const { strip = false, yaml: yamlOptions = {} } = options ?? {};
  let document =
    typeof file.value === "string"
      ? file.value
      : new TextDecoder().decode(file.value as Uint8Array);

  const match = FRONT_MATTER_REGEX.exec(document);

  if (match) {
    // Parse the YAML front matter, assign to file.data.matter
    file.data.matter = YAML.parse(match[1] ?? "", yamlOptions) ?? {};

    if (strip) {
      document = document.slice(match[0].length);
      if (file.value instanceof Uint8Array) {
        file.value = new TextEncoder().encode(document);
      } else {
        file.value = document;
      }
    }
  } else {
    file.data.matter = {};
  }
}

export interface DataMapInternals {
  postTags: string[];
  postId: number;
  postTitle: string;
  postDescription?: string;
}

declare module "vfile" {
  interface DataMap extends DataMapInternals {
    myCustomField: string[];
  }
  /**
   * a VFile class without conditionally undefined Type Coerceion in the `data` field
   */
  class VFileSansCoercion<
    TData extends { [P in keyof DataMap]: DataMap[P] }
  > extends VFile {
    data: TData;
  }
}
