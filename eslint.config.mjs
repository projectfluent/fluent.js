import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import mochaPlugin from "eslint-plugin-mocha";
import globals from "globals";

import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/",
      "*/coverage/",
      "*/dist/",
      "*/esm/",
      "*/vendor/",
      "fluent-*/index.js",
      "html/",
      "tools/",
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "module",
    },
  },

  // Config files
  {
    files: ["**/*.mjs"],
    languageOptions: { ecmaVersion: 2020 },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { globals: { ...globals.node } },
  },

  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs", "*/src/*.ts"],
    rules: {
      "consistent-return": "warn",
      "dot-notation": "error",
      eqeqeq: "error",
      "max-depth": ["error", 6],
      "no-caller": "error",
      "no-console": "warn",
      "no-constant-condition": ["warn", { checkLoops: false }],
      "no-duplicate-imports": "error",
      "no-else-return": "error",
      "no-empty": "warn",
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-implicit-globals": "error",
      "no-implied-eval": "error",
      "no-iterator": "error",
      "no-loop-func": "error",
      "no-multi-str": "error",
      "no-nested-ternary": "error",
      "no-proto": "error",
      "no-sequences": "error",
      "no-shadow": "error",
      "no-undef-init": "error",
      "no-unneeded-ternary": "error",
      "no-unreachable": "warn",
      "no-unused-vars": "warn",
      "no-use-before-define": ["error", { functions: false, classes: false }],
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-return": "error",
      "prefer-arrow-callback": "warn",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      "spaced-comment": ["error", "always"],
      strict: ["error", "global"],
    },
  },

  // TypeScript
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    files: ["**/*.ts"],
  })),
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      complexity: "off",
      "prefer-const": "off",
      "no-undef": "off",
      "no-unused-vars": ["error", { args: "none" }],
      "no-use-before-define": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/explicit-function-return-type": "error",
    },
  },
  eslintConfigPrettier,

  // Test suites
  {
    files: ["*/test/**"],
    languageOptions: {
      globals: { ...globals.mocha, ...globals.node },
      ecmaVersion: 2020,
    },
    plugins: { mocha: mochaPlugin },
    rules: {
      "mocha/no-exclusive-tests": "error",
      "mocha/no-identical-title": "error",
      "no-console": "off",
      "prefer-arrow-callback": "off",
    },
  },
  {
    files: ["fluent-dom/test/*"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ["fluent-react/test/**"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.jest },
      ecmaVersion: 2020,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { mocha: mochaPlugin },
    rules: {
      "mocha/no-exclusive-tests": "error",
      "mocha/no-identical-title": "error",
      "no-unused-vars": "off",
    },
  },
];
