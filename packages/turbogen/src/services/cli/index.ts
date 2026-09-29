import { InquirerService } from "./inquirer.ts";

export interface CliServiceProps {
  i: InquirerService;
}

export function cliService(
  input: typeof import("@inquirer/prompts").input,
  select: typeof import("@inquirer/prompts").select
) {
  return {
    i: new InquirerService(input, select)
  };
}
