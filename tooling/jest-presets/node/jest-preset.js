/**
 * Jest preset for Node + TypeScript workspaces (ESM, CJS, all the things)
 * https://github.com/DopamineDriven/d0paminedriven
 *
 * @type {import("ts-jest").JestConfigWithTsJest}
 */
module.exports = {
  roots: ["<rootDir>"],
  testEnvironment: "node", // Explicit, for clarity and reliability
  transform: {
    "^.+\\.(mjs|cjs|js|jsx|ts|tsx|mts|cts)$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "mts",
    "cts",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "json",
    "node"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/test/__fixtures__",
    "<rootDir>/node_modules",
    "<rootDir>/dist"
  ],
  // Some users prefer <rootDir>/build as well, if you ever use that
  preset: "ts-jest",
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",

  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.json",
      diagnostics: true,
      isolatedModules: true,
      useESM: undefined
    }
  },
  testTimeout: 30000,
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test/__fixtures__/",
    "/dist/"
  ]
};
