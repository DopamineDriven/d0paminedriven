import type { PromptPropsBase } from "@/types/index.ts";
import { ConfigHandler } from "@/config/index.ts";
import { WebAppScaffolder } from "@/services/scaffold/apps/generic-scaffold.ts";
import { UIPackageScaffolder } from "@/services/scaffold/packages/ui.ts";
import { RootScaffolder } from "@/services/scaffold/root/root-scaffolder.ts";
import { EslintScaffolder } from "@/services/scaffold/tooling/eslint-scaffold.ts";
import { PrettierScaffolder } from "@/services/scaffold/tooling/prettier-scaffold.ts";
import { TsScaffolder } from "@/services/scaffold/tooling/ts-scaffold.ts";

export interface ScaffoldServiceProps {
  eslint: EslintScaffolder;
  prettier: PrettierScaffolder;
  root: RootScaffolder;
  typescript: TsScaffolder;
  ui: UIPackageScaffolder;
  web: WebAppScaffolder;
}

export function scaffoldService(
  promptBase: PromptPropsBase,
  configHandler: ConfigHandler
) {
  return {
    eslint: new EslintScaffolder(promptBase, configHandler),
    prettier: new PrettierScaffolder(promptBase, configHandler),
    root: new RootScaffolder(promptBase, configHandler),
    typescript: new TsScaffolder(promptBase, configHandler),
    ui: new UIPackageScaffolder(promptBase, configHandler),
    web: new WebAppScaffolder(promptBase, configHandler)
  };
}
