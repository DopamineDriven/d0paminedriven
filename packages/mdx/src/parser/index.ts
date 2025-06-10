import { Fs } from "@d0paminedriven/fs";
import { parse as parseYaml } from "yaml";
import type { MdxEntity } from "@/types/index.ts";

export class MdxParser extends Fs {
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
  }

  /**
   * returns only the content portion of the mdx file
   */
  public extractContent<const T extends string>(frontMatter: T) {
    return frontMatter.replace(/^---[\r\n]+([\s\S]*?)[\r\n]+---/g, "");
  }

  public getMdxPaths<const V extends string>(dir: V, recursive = false) {
    if (this.exists(dir) === false) {
      throw new Error(`directory ${dir} does not exist in cwd ${this.cwd}`);
    } else {
      // resolve the full paths relative to the root of the cwd
      return this.readDir(dir, { recursive })
        .filter(path => /\.mdx$/.test(path))
        .map(path => `${dir}/${path}`);
    }
  }

  public readMdxFile<const P extends string>(path: P) {
    return this.fileToBuffer(path).toString("utf-8");
  }

  private extractFrontMatter(fileContent: string) {
    return /^---[\r\n]+([\s\S]*?)[\r\n]+---/m.exec(fileContent)?.[1];
  }

  private parseFrontmatter(fileContent: string) {
    const frontMatterBlock = this.extractFrontMatter(fileContent);

    const content = this.extractContent(fileContent).trimStart();

    const frontMatter = (
      frontMatterBlock ? parseYaml(frontMatterBlock) : {}
    ) as Omit<MdxEntity, "content">;

    return { frontMatter, content };
  }

  public getMdxData<const V extends string>(path: V) {
    if (/\.mdx$/.test(path)) {
      return this.parseFrontmatter(this.readMdxFile(path));
    } else {
      if (this.exists(`${path}.mdx`)) {
        return this.parseFrontmatter(this.readMdxFile(`${path}.mdx`));
      } else {
        throw new Error(
          `${path}.mdx does not exist -- error in getMdxData method`
        );
      }
    }
  }

  public getAllMdxFiles<const T extends string>(
    dir: T,
    recursive = true,
    withPath = false
  ) {
    if (!this.exists(dir)) {
      throw new Error(
        `directory ${dir} does not exist -- error in getAllMdxFiles method`
      );
    } else {
      const getTargted = this.getMdxPaths(dir, recursive);
      if (withPath === true) {
        return getTargted.map(filePath => this.getMdxData(filePath));
      }
      return getTargted.map(filePath => this.getMdxData(filePath));
    }
  }
}

const mdx = new MdxParser(process.cwd());

mdx.getAllMdxFiles("src/test", true).map(output => {
  // if ("technologies" in output.frontMatter) {
  //   console.log({ technologies: output.frontMatter.technologies });
  // }
  // if ("tags" in output.frontMatter) {
  //   console.log({ tags: output.frontMatter.tags });
  // }
  console.log(output.frontMatter);
  return output;
});

console.log(mdx.getMdxPaths("src/test/__content__", true));
