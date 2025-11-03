import type { Config } from "typescript-eslint";
import baseConfig from "@d0paminedriven/eslint-config/base";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/require-await": "off",
      "prefer-const": "off",
      "no-useless-escape": "off",
      "@typescript-eslint/prefer-regexp-exec": "off"
    },
    ignores: ["dist/**"]
  }
] satisfies Config;
