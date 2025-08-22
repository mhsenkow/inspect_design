import globals from "globals";

import jsPlugin from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

import tseslint from "typescript-eslint";
import typescriptParser from "@typescript-eslint/parser";

import jestPlugin from "eslint-plugin-jest";

import nextPlugin from "@next/eslint-plugin-next";

import playwrightPlugin from "eslint-plugin-playwright";

export default [
  // global recommended configs
  jsPlugin.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  // global settings
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // global files: all typescript files
  {
    files: ["**/*.{ts,tsx}"],
  },
  // global ignores
  {
    ignores: [
      "node_modules/",
      ".next/",
      "ecosystem.config.cjs",
      "next.config.js",
      "public/",
      "coverage/",
      "src/scripts/",
    ],
  },
  // global plugins
  {
    plugins: {
      js: jsPlugin,
      "@typescript-eslint": tseslint.plugin,
    },
  },
  // global language options
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          enableJsx: false,
        },
      },
    },
  },
  // global rules
  {
    rules: {
      ...jsPlugin.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      "no-unused-vars": "off",
      "no-undef": "error",

      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // playwright e2e test config
  {
    files: ["src/e2e-tests/*.spec.ts"],
    plugins: {
      playwright: playwrightPlugin,
    },
    rules: {
      ...playwrightPlugin.configs["flat/recommended"].rules,

      "@typescript-eslint/no-floating-promises": "error", // bc playwright's missing await rule doesn't work on everything

      "playwright/no-standalone-expect": "off", // does not support additionalTestBlockFunctions
      "playwright/expect-expect": "off", // does not support assertions in called functions
    },
  },
  // jest unit test config
  {
    ...reactPlugin.configs.flat.recommended,
    ...jestPlugin.configs["flat/recommended"],
    files: ["**/*.test.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      jest: jestPlugin,
    },
    rules: {
      ...jsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...jestPlugin.configs["flat/recommended"].rules,

      "react/prop-types": "error",
      "react/display-name": "off",

      "@typescript-eslint/no-explicit-any": "off",
    },
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
  // next app config
  {
    ...reactPlugin.configs.flat.recommended,
    ignores: ["**/*.test.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,

      "react/prop-types": "error",
      "react/display-name": "off",

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      "@next/next/no-img-element": "error",
    },
  },
];
