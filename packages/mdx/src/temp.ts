import { Fs } from "@d0paminedriven/fs";

const fs = new Fs(process.cwd());

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

export const omitFrontMatter = <const T extends string>(frontMatter: T) => {
  return frontMatter.replace(/^---[\r\n]+([\s\S]*?)[\r\n]+---/g, "");
};

export function getMdxPaths<const V extends string>(dir: V, recursive = false) {
  const readResult = fs
    .readDir(dir, { recursive })
    .filter(path => /\.mdx$/.test(path));
  return readResult;
}

export function readMdxFile<const P extends string>(path: P) {
  return fs.fileToBuffer(path).toString("utf-8");
}

export function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---/g;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match?.[1] ?? "";
  const content = omitFrontMatter(fileContent).trimStart();
  const metadata: Record<string, string | string[]> = {};
  let currentKey: string | null = null;
  const lines = frontMatterBlock.split(/\r?\n/);
  for (const line of lines) {
    const keyValMatch = /^([\w-]+)\s*:\s*(.*)?$/.exec(line);

    if (keyValMatch) {
      const [_e, rawKey, rawVal] = keyValMatch;
      const key = rawKey?.trim() ?? "";
      const val = (rawVal ?? "").trim();

      if (!val) {
        metadata[key] = [];
        currentKey = key;
      } else {
        metadata[key] = val.replace(/^['"](.*)['"]$/, "$1");
        currentKey = null;
      }
    } else {
      const arrayItemMatch = /^-\s*(.*)$/.exec(line.trim());
      if (arrayItemMatch) {
        const itemValue = arrayItemMatch[1] ?? "";
        // clean assertion in next step
        (metadata[currentKey ?? ""] as string[]).push(itemValue);
      }
    }
  }
  const frontMatterCleanup = Object.entries(metadata).map(([key, val]) => {
    if (Array.isArray(val)) {
      // clean asserted array items
      const cleanedArray = val.map(item =>
        item.replace(/^['"](.*)['"]$/, "$1")
      );
      return [key, cleanedArray];
    } else {
      const cleanedString = val.replace(/^['"](.*)['"]$/, "$1");
      return [key, cleanedString];
    }
  });

  const toCleanFrontMatterObj = Object.fromEntries(
    frontMatterCleanup as [string, string | string[]][]
  ) as Omit<MdxEntity, "content">;

  return { frontMatter: toCleanFrontMatterObj, content };
}


export function getMdxData<const V extends string>(path: V) {
  if (/\.mdx$/.test(path)) {
    return parseFrontmatter(readMdxFile(path));
  } else {
    return parseFrontmatter(readMdxFile(`${path}.mdx`));
  }
}

function getAllTestMdxFiles<const T extends string>(
  targetDir: T,
  recursive = false
) {
  if (fs.exists(targetDir) === false)
    throw new Error(`directory ${targetDir} does not exist`);
  const getTargted = getMdxPaths(targetDir, recursive);
  return getTargted.map(filePath => {
    return getMdxData(`${targetDir}/${filePath}`);
  });
}

getAllTestMdxFiles("src/test", true).map(output => {
  if ("technologies" in output.frontMatter) {
    console.log({ technologies: output.frontMatter.technologies });
  }
  if ("tags" in output.frontMatter) {
    console.log({ tags: output.frontMatter.tags });
  }
  return output;
});
