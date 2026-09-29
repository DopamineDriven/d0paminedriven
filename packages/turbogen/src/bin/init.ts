#!/usr/bin/env node
import { spawn } from "node:child_process";
import type { IOType } from "node:child_process";
import { ConfigHandler } from "@/config/index.ts";
import { cliService } from "@/services/cli/index.ts";
import { scaffoldService } from "@/services/scaffold/index.ts";
import * as inquirer from "@inquirer/prompts";

export async function exeInquirer() {
  const { i } = cliService(inquirer.input, inquirer.select);
  return i.executeInquirer();
}

function installDeps() {
  return new Promise((resolve, reject) => {
    const proc = spawn("pnpm", ["install"], {
      stdio: "inherit" as IOType,
      shell: process.platform === "win32"
    });

    proc.on("exit", code => {
      if (code === 0) {
        resolve({});
      } else {
        reject(new Error(`pnpm install failed with exit code ${code}`));
      }
    });
  });
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
  const handler = new ConfigHandler(process.cwd());
  void handler.resolveCentralCatalog();
  Promise.all([
    exeInquirer().then(async v => {
      const { eslint, prettier, root, typescript, ui, web, vitest, types } =
        scaffoldService(v, handler);
      eslint.exeEslint();
      prettier.exePrettier();
      typescript.exeTs();
      vitest.exeVitest();
      root.exeRoot();
      ui.exeUIPkg();
      types.exeTypesPkg();
      web.exeWebApp();
      return v;
    })
  ]).then(() => {
    return handler.wait(2000).then(() => {
      try {
        if (handler.exists("pnpm-lock.yaml")) {
          handler.executeCommand({ command: "rm -rf pnpm-lock.yaml" });
        }
      } catch (err) {
        console.error(err);
      } finally {
        handler.executeCommand({ command: "echo 'testing'" });
        console.log(
          "\nInstalling dependencies... (this may take a few seconds)\n"
        );
        installDeps()
          .then(() => {
            console.log(
              "\n✅ All dependencies installed!\n\nNext steps:\n run `pnpm run:web` to fire up apps/web!\n"
            );
          })
          .catch(err => {
            console.error(
              "\n❌ Failed to install dependencies. Please run 'pnpm install' manually.\n",
              err
            );
          });
      }
    });
  });
}
