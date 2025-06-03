#!/usr/bin/env node
import * as inquirer from "@inquirer/prompts";
import { ConfigHandler } from "@/config/index.ts";
import { cliService } from "@/services/cli/index.ts";
import { scaffoldService } from "@/services/scaffold/index.ts";

export async function testInquirer() {
  const { i } = cliService(inquirer.input);
  return i.executeInquirer();
}

export async function testArgs(argv: string[]) {
  const handler = new ConfigHandler(process.cwd());
  const userAgent = process.env.npm_config_user_agent;

  const fileSize = handler.fileSizeMb(argv[3] ?? "./package.json");
  const templated = `file ${argv[3]} is ${fileSize} mb. your package manager is ${userAgent}`;

  console.log(templated);
  return;
}

if (process.argv[2] === "test") {
  Promise.all([testArgs(process.argv)]);
}

if (process.argv[2] === "init") {
  Promise.all([
    testInquirer().then(async v => {
      const { eslint, jest, prettier, root, typescript, ui, web } =
        scaffoldService(process.cwd(), v);
      eslint.exeEslint();
      jest.exeJestPresets();
      prettier.exePrettier();
      typescript.exeTs();
      root.exeRoot();
      ui.exeUIPkg();
      web.exeWebApp();
      return v;
    })
  ]);
}
