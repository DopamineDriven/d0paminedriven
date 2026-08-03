import { baseConfig } from "@d0paminedriven/eslint-config/base";
import { reactConfig } from "@d0paminedriven/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/require-await": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/prefer-string-starts-ends-with": "off",
      "@typescript-eslint/no-empty-object-type": "off"
    },
    ignores: ["dist/**"]
  },
  baseConfig(process.cwd()),
  reactConfig
);
