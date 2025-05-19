import type { Config } from "typescript-eslint";
import baseConfig from "@d0paminedriven/eslint-config/base";
import reactConfig from "@d0paminedriven/eslint-config/react";

export default [
  ...baseConfig,
  ...reactConfig,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/require-await": "off",
      "prefer-const": "off"
    },
    ignores: ["dist/**"]
  }
] satisfies Config;
