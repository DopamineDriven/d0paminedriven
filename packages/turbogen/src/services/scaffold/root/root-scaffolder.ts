import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";

export class RootScaffolder extends ConfigHandler {
  constructor(
    public override cwd: string,
    public baseProps: PromptPropsBase
  ) {
    super((cwd ??= process.cwd()));
  }

  private get workspace() {
    return this.baseProps.workspace;
  }

  private resolveRootPkgJson() {
    return JSON.parse(this.fileToBuffer("package.json").toString("utf-8")) as
      | {
          repository?: string;
          [record: string]: unknown;
        }
      | {
          repository?: string;
          author?: string | Record<string, string>;
          [record: string]: unknown;
        };
  }

  private get readmeMinimal() {
    // prettier-ignore
    return `### Welcome to the @${this.workspace}/* workspace 👋` as const
  }

  private pkgJsonRepo() {
    return this.resolveRootPkgJson().repository;
  }

  private get packageManager() {
    if (process.env.npm_config_user_agent) {
      return `pnpm@${/pnpm\/([0-9]+.[0-9]+.[0-9]+)/g.exec(process.env.npm_config_user_agent)?.[1]}` as const;
    } else return `pnpm` as const;
  }

  private get localDeps() {
    return [
      `@${this.workspace}/eslint-config`,
      `@${this.workspace}/prettier-config`,
      `@${this.workspace}/tsconfig`
    ] as const;
  }

  private get devDeps() {
    return [
      "@changesets/cli",
      "@d0paminedriven/turbogen",
      "@types/node",
      "dotenv",
      "eslint",
      "husky",
      "prettier",
      "tsx",
      "turbo",
      "typescript"
    ] as const;
  }

  private get eslintTemplate() {
    // prettier-ignore
    return `import baseConfig from "@${this.workspace}/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off"
    },
    ignores: ["**node_modules**"]
  },
  ...baseConfig
];
` as const;
  }

  private get tsconfigTemplate() {
    // prettier-ignore
    return `{
  "extends": "@${this.workspace}/tsconfig/base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "node_modules/.cache/tsbuildinfo.json"
  },
  "include": ["."],
  "exclude": ["node_modules"]
}
`as const;
  }

  private get vscodeExtensionsTemplate() {
    // prettier-ignore
    return `{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "donjayamanne.githistory",
    "eamodio.gitlens",
    "editorconfig.editorconfig",
    "esbenp.prettier-vscode",
    "ghmcadams.lintlens",
    "hilleer.yaml-plus-json",
    "ipatalas.vscode-postfix-ts",
    "meganrogge.template-string-converter",
    "meouwu.css-var-color-decorator",
    "ms-vscode.vscode-typescript-next",
    "pascalreitermann93.vscode-yaml-sort",
    "redhat.vscode-yaml",
    "redis.redis-for-vscode",
    "rvest.vs-code-prettier-eslint",
    "visualstudioexptteam.intellicode-api-usage-examples",
    "visualstudioexptteam.vscodeintellicode",
    "xshrim.txt-syntax",
    "yoavbls.pretty-ts-errors",
    "yutengjing.vscode-versionlens-plus"
  ],
  "unwantedRecommendations": []
}` as const;
  }

  private get vscodeSettingsTemplate() {
    // prettier-ignore
    return `{
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[postcss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "C_Cpp.dimInactiveRegions": false,
  "css.completion.completePropertyWithSemicolon": true,
  "css.format.enable": true,
  "css.format.newlineBetweenSelectors": true,
  "css.hover.documentation": true,
  "css.hover.references": true,
  "editor.bracketPairColorization.enabled": false,
  "svg.preview.autoShow": false,
  "svg.preview.disable": true,
  "svg.preview.mode": "svg",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.suggest.showStatusBar": true,
  "eslint.enable": true,
  "eslint.useFlatConfig": true,
  "eslint.rules.customizations": [
    {
      "rule": "*",
      "severity": "warn"
    }
  ],
  "eslint.workingDirectories": [
    {
      "pattern": "apps/*/"
    },
    {
      "pattern": "packages/*/"
    },
    {
      "pattern": "tooling/*/"
    }
  ],
  "files.autoSave": "afterDelay",
  "javascript.referencesCodeLens.showOnAllFunctions": true,
  "openInDefaultBrowser.run.openWithLocalHttpServer": false,
  "tailwindCSS.experimental.classRegex": [
    [
      "cva\\\\(([^)]*)\\\\)",
      "[\\"'\`]([^\\"'\`]*).*?[\\"'\`]"
    ],
    [
      "cx\\\\(([^)]*)\\\\)",
      "(?:'|\\"|\`)([^']*)(?:'|\\"|\`)"
    ]
  ],
  "tailwindCSS.classAttributes": [
    "class",
    "className",
    "classNames",
    "ngClass",
    "rootClassName",
    ".*Variant.*",
    ".*variant.*",
    ".*Styles.*"
  ],
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.tsserver.web.typeAcquisition.enabled": true,
  "typescript.implementationsCodeLens.enabled": true,
  "typescript.implementationsCodeLens.showOnInterfaceMethods": true,
  "typescript.locale": "en",
  "typescript.referencesCodeLens.enabled": true,
  "typescript.referencesCodeLens.showOnAllFunctions": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "yaml.hover": true,
  "yaml.validate": true,
  "workbench.editor.autoLockGroups": {
    "default": false
  },
  "github.copilot.enable": {
    "*": false,
    "plaintext": false,
    "markdown": false,
    "scminput": false
  }
}` as const;
  }

  private get editorConfigTemplate() {
    // prettier-ignore
    return `[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
tab_width = 4
max_line_length = 80
trim_trailing_whitespace = true

[*.md]
max_line_length = 0
trim_trailing_whitespace = false

[COMMIT_EDITMSG]
max_line_length = 0

[{*.c,*.cc,*.h,*.hh,*.cpp,*.hpp,*.m,*.mm,*.mpp,*.js,*.cjs,*.mjs,*.mts,*.cts,*.java,*.go,*.rs,*.php,*.ng,*.jsx,*.ts,*.tsx,*.d,*.cs,*.swift}]
curly_bracket_next_line = false
spaces_around_operators = true
spaces_around_brackets = outside

# close enough to 1TB
indent_brace_style = K&R

[*.module.css]
max_line_length = 40
` as const;
  }

  private get turboJsonTemplate() {
    // prettier-ignore
    return `{
  "$schema": "https://turborepo.org/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": []
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  },
  "ui": "stream",
  "globalEnv": [
    "COREPACK_ENABLE_STRICT",
    "NODE_ENV",
    "VERCEL_ENV"
  ]
}
` as const;
  }

  private get pnpmWorkspaceYamlTemplate() {
    // prettier-ignore
    return `packages:
  - apps/*
  - packages/*
  - tooling/*` as const;
  }

  private get gitignoreTemplate() {
    // prettier-ignore
    return `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/
build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
# turbo
.turbo
.vercel
.npmrc

.idea
dist
notes.md` as const;
  }

  private get prettierignoreTemplate() {
    //prettier-ignore
    return `node_modules/*
.next
dist
.changeset
generated
*.md
pnpm-lock.yaml
.tsup
` as const;
  }

  private getPaths() {
    return {
      editorConfig: `.editorconfig`,
      eslint: `eslint.config.mjs`,
      gitignore: ".gitignore",
      packageJson: "package.json",
      pnpmWorkspaceYaml: "pnpm-workspace.yaml",
      prettierignore: ".prettierignore",
      tsconfig: `tsconfig.json`,
      turboJson: `turbo.json`,
      readme: "README.md",
      vscodeExtensions: ".vscode/extensions.json",
      vscodeSettings: `.vscode/settings.json`
    } as const;
  }

  private rootTarget<const V extends keyof ReturnType<typeof this.getPaths>>(
    target: V
  ) {
    return this.getPaths()[target];
  }

  private writeTarget<
    const T extends ReturnType<typeof this.rootTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.withWs(target, template);
  }

  public async exeRoot() {
    const pkgJson = await this.resolveAllDepsRoot(
      this.devDeps,
      this.localDeps,
      this.workspace,
      this.packageManager,
      this.pkgJsonRepo()
    );
    return Promise.all([
      this.handleNpmrc(),
      this.writeTarget(".prettierignore", this.prettierignoreTemplate),
      this.writeTarget(
        ".vscode/extensions.json",
        this.vscodeExtensionsTemplate
      ),
      this.writeTarget(".vscode/settings.json", this.vscodeSettingsTemplate),
      this.writeTarget(".editorconfig", this.editorConfigTemplate),
      this.writeTarget(".gitignore", this.gitignoreTemplate),
      this.writeTarget("eslint.config.mjs", this.eslintTemplate),
      this.writeTarget("package.json", JSON.stringify(pkgJson, null, 2)),
      this.writeTarget("pnpm-workspace.yaml", this.pnpmWorkspaceYamlTemplate),
      this.writeTarget("tsconfig.json", this.tsconfigTemplate),
      this.writeTarget("turbo.json", this.turboJsonTemplate),
      this.writeTarget("README.md", this.readmeMinimal)
    ]);
  }
}
