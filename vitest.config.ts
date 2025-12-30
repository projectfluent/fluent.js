import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      "@fluent/bundle": "/fluent-bundle/src/index.ts",
      "@fluent/dedent": "/fluent-dedent/src/index.ts",
      "@fluent/sequence": "/fluent-sequence/src/index.ts",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "common",
          include: ["fluent-*/test/*_test.js"],
          exclude: ["fluent-dom/", "fluent-react/"],
          globals: true,
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          include: ["fluent-dom/test/*_test.js"],
          globals: true,
          environment: "jsdom",
        },
      },
      {
        extends: true,
        test: {
          name: "react",
          include: ["fluent-react/test/*.test.jsx"],
          globals: true,
          environment: "jsdom",
        },
      },
    ],
  },
});
