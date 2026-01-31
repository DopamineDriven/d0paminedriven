import type { Config } from "typescript-eslint";
import baseConfig from "@d0paminedriven/eslint-config/base";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-useless-escape": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-namespace": "off"
    },
    ignores: ["dist/**"]
  }
] satisfies Config;
