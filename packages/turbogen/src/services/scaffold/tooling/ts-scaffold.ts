import type { ConfigHandler } from "@/config/index.ts";
import type { PromptPropsBase } from "@/types/index.ts";

/* eslint-disable @typescript-eslint/await-thenable */

export class TsScaffolder {
  constructor(
    public baseProps: PromptPropsBase,
    protected configHandler: ConfigHandler
  ) {}

  private get workspace() {
    return this.baseProps.workspace;
  }

  private get baseTemplate() {
    // prettier-ignore
    return `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "disableSourceOfProjectReferenceRedirect": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true,
    "lib": [
      "ES2024",
      "ScriptHost",
      "ESNext",
      "ES2018.AsyncGenerator",
      "ES2024.Collection",
      "ES2024.Object",
      "ESNext.Iterator",
      "ESNext.AsyncIterable",
      "ESNext.Collection",
      "ES2018.AsyncIterable"
    ],
    "module": "Preserve",
    "moduleDetection": "auto",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "noUncheckedIndexedAccess": true,
    "preserveWatchOutput": true,
    "resolveJsonModule": true,
    "pretty": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "useUnknownInCatchVariables": true,
    "target": "esnext"
  },
  "exclude": ["node_modules", "build", "dist", ".next"]
}` as const;
  }

  private get nodePkgTemplate() {
    // prettier-ignore
    return `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "allowSyntheticDefaultImports": true,
    "alwaysStrict": true,
    "declaration": true,
    "declarationMap": true,
    "importHelpers": false,
    "incremental": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "noEmit": true,
    "sourceMap": true,
    "target": "ESNext",
    "useDefineForClassFields": true
  }
}
` as const;
  }

  private get nextTemplate() {
    // prettier-ignore
    return `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "alwaysStrict": true,
    "module": "ESNext",
    "target": "ESNext",
    "incremental": true,
    "sourceMap": true,
    "useDefineForClassFields": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "importHelpers": false,
    "lib": ["ESNext", "DOM", "DOM.Iterable", "ScriptHost", "ES2024"]
  }
}` as const;
  }

  private get reactLibTemplate() {
    // prettier-ignore
    return `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "alwaysStrict": true,
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ESNext", "ScriptHost"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ESNext",
    "incremental": false,
    "sourceMap": true,
    "useDefineForClassFields": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "importHelpers": false,
    "noEmit": false
  }
}` as const;
  }

  private get pkgJsonTemplate() {
    // prettier-ignore
    return `{
  "name": "@${this.workspace}/tsconfig",
  "private": true,
  "version": "0.1.0",
  "files": [
    "*.json"
  ]
}
` as const;
  }

  private tsPath<const F extends string>(file: F) {
    return `tooling/typescript/${file}` as const;
  }

  private getPaths() {
    return {
      base: this.tsPath("base.json"),
      next: this.tsPath("next.json"),
      nodePkg: this.tsPath("node-pkg.json"),
      packageJson: this.tsPath("package.json"),
      reactLib: this.tsPath("react-library.json")
    } as const;
  }

  private tsTarget<const V extends keyof ReturnType<typeof this.getPaths>>(
    target: V
  ) {
    return this.getPaths()[target];
  }

  private writeTarget<
    const T extends ReturnType<typeof this.tsTarget>,
    const V extends string
  >(target: T, template: V) {
    return this.configHandler.withWs(target, template);
  }

  public exeTs() {
    return Promise.all([
      this.writeTarget("tooling/typescript/base.json", this.baseTemplate),
      this.writeTarget("tooling/typescript/next.json", this.nextTemplate),
      this.writeTarget(
        "tooling/typescript/node-pkg.json",
        this.nodePkgTemplate
      ),
      this.writeTarget("tooling/typescript/package.json", this.pkgJsonTemplate),
      this.writeTarget(
        "tooling/typescript/react-library.json",
        this.reactLibTemplate
      )
    ]);
  }
}
