export { ConfigHandler } from "@/config/index.ts";
export { exeInquirer } from "@/bin/init.ts";
export { cliService } from "@/services/cli/index.ts";
export { InquirerService } from "@/services/cli/inquirer.ts";
export { EslintScaffolder } from "@/services/scaffold/tooling/eslint-scaffold.ts";
export { PrettierScaffolder } from "@/services/scaffold/tooling/prettier-scaffold.ts";
export { RootScaffolder } from "@/services/scaffold/root/root-scaffolder.ts";
export { scaffoldService } from "@/services/scaffold/index.ts";
export { TsScaffolder } from "@/services/scaffold/tooling/ts-scaffold.ts";
export { UIPackageScaffolder } from "@/services/scaffold/packages/ui.ts";
export { WebAppScaffolder } from "@/services/scaffold/apps/generic-scaffold.ts";
export type { CliServiceProps } from "@/services/cli/index.ts";
export type { ScaffoldServiceProps } from "@/services/scaffold/index.ts";
export type {
  PromptPropsBase,
  NpmLatest,
  ToPascalCase
} from "@/types/index.ts";
declare global {
  interface JSON {
    parse<T = unknown>(
      text: string,
      reviver?: (this: any, key: string, value: any) => any
    ): T;
  }
  interface Body {
    json<T = unknown>(): Promise<T>;
  }
  interface Response {
    json<T = unknown>(): Promise<T>;
  }
  interface ObjectConstructor {
    keys<T = object>(
      o: T
    ): (keyof T extends infer K
      ? K extends string
        ? K
        : K extends number
          ? `${K}`
          : never
      : never)[];
    entries<T = object, V extends keyof T = keyof T>(
      o: T
    ): (V extends infer K
      ? K extends string
        ? [K, T[V]]
        : K extends number
          ? [`${K}`, T[V]]
          : never
      : never)[];
  }
}
