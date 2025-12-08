import type { BufferEncodingUnion } from "@/types/index.ts";
import { default as Fs } from "@/fs/index.ts";

type Opts = {
  encoding?: BufferEncodingUnion | null | undefined;
  withFileTypes?: false | undefined;
  recursive?: boolean | undefined;
};

type Targets =
  | "root"
  | "src/fs"
  | "src/types"
  | "src/mime"
  | "src/index"
  | "src/url"
  | "src/utils";

class OutputMd extends Fs {
  constructor(public override cwd: string) {
    super((cwd ??= process.cwd()));
  }

  private getTargetedDirs<const T extends Targets>(
    target: T,
    options = {
      encoding: "utf-8",
      recursive: true,
      withFileTypes: false
    } satisfies Opts
  ) {
    if (target === "root") {
      const { recursive: re = false, ...opts } = options;
      return (
        this.readDir(target, { recursive: re, ...opts })
          .filter(
            file =>
              /(?:(public|dist|patches|node_modules|\.(next|git|vscode|husky|changeset|github|turbo|gitignore|env)|pnpm-lock\.yaml))/g.test(
                file
              ) === false
          ).filter((file) => /(?:(src\/test))/g.test(file) === false)
          // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
          .filter(file => /\./g.test(file) && !/\.md$/g.test(file))
      );
    } else if (target === "src/index") {
      const { recursive: re = false, ...opts } = options;
      return this.readDir("src", { recursive: re, ...opts })
        .filter(file => /(?:(test))/g.test(file) === false)
        .filter(v => /\./g.test(v))
        .map(v => {
          return v;
        });
    } else
      return this.readDir(target, options)
        .filter(v => /\./g.test(v))
        .map(v => {
          return v;
        });
  }

  private getTargetedPaths<const T extends Targets>(
    tp: T,
    options = {
      encoding: "utf-8",
      recursive: true,
      withFileTypes: false
    } satisfies Opts
  ) {
    return this.getTargetedDirs(tp, options);
  }

  private fileExt(file: string) {
    return !file.startsWith(".")
      ? (file.split(/\./)?.reverse()?.[0] ?? "txt")
      : file.split(/\./gim)?.reverse()?.[0];
  }
  private commentRegex =
    /(?:(?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:(?<!\:|\\\|\')\/\/.*))/gm;

  private handleComments<const T extends Targets>(
    target: T,
    file: string,
    removeComments = true
  ) {
    if (target === "root") {
      return file;
    } else if (!removeComments) {
      return file.trim();
    } else {
      return file.replace(this.commentRegex, "");
    }
  }

  public getRawFiles<const T extends Targets>(
    target: T,
    removeComments = true
  ) {
    const arr = Array.of<string>();
    try {
      return this.getTargetedPaths(target).map(file => {
        const handleInjectedTarget =
          target === "root"
            ? file
            : target === "src/index"
              ? `src/${file}`
              : `${target}/${file}`;
        const fileExtension = this.fileExt(file);
        const fileContent =
          this.fileToBuffer(handleInjectedTarget).toString("utf-8");

        // prettier-ignore
        const toInject = `**File:** \`${handleInjectedTarget}\`

For more details, [visit the raw version of this file](https://raw.githubusercontent.com/DopamineDriven/d0paminedriven/refs/heads/master/packages/fs/${handleInjectedTarget}).

\`\`\`${fileExtension}

${this.handleComments(target, fileContent, removeComments)}

\`\`\`


**Related Resources:**
  - Raw file URL: https://raw.githubusercontent.com/DopamineDriven/d0paminedriven/refs/heads/master/packages/fs/${handleInjectedTarget}


---

`
        arr.push(toInject);
        return toInject;
      });
    } catch (err) {
      console.error(err);
    } finally {
      return arr;
    }
  }
  public incomingArgs(argv: string[]) {
    const omitComments = argv[4]?.includes("false") ? false : true;
    // prettier-ignore
    const msg = `must provide an argv3 command, \n\n index | root | url | types | mime | utils | fs \n\n eg, \n\n \`\`\`bash \npnpm tsx src/test/output-md.ts --target fs\n \`\`\``;

    if (argv[3] && argv[3].length > 1) {
      if (argv[3]?.includes("url")) {
        this.withWs(
          "src/test/__out__/url.md",
          this.getRawFiles("src/url", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("types")) {
        this.withWs(
          "src/test/__out__/types.md",
          this.getRawFiles("src/types", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("fs")) {
        this.withWs(
          "src/test/__out__/fs.md",
          this.getRawFiles("src/fs", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("index")) {
        this.withWs(
          "src/test/__out__/index.md",
          this.getRawFiles("src/index", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("utils")) {
        this.withWs(
          "src/test/__out__/utils.md",
          this.getRawFiles("src/utils", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("mime")) {
        this.withWs(
          "src/test/__out__/mime.md",
          this.getRawFiles("src/mime", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("root")) {
        this.withWs(
          "src/test/__out__/root.md",
          this.getRawFiles("root", omitComments).join("\n")
        );
      } else if (argv[3]?.includes("help")) {
        console.log(msg);
      } else {
        console.log(
          `argv[3] must be a valid value -- index | root | url | types | mime | utils | fs`
        );
      }
    } else {
      console.log(msg);
    }
  }
}
const fs = new OutputMd(process.cwd());

fs.incomingArgs(process.argv);
