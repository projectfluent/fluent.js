import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "common",
          include: ["fluent-*/test/*_test.js"],
          exclude: ["fluent-dom/", "fluent-react/"],
          globals: true,
          environment: "node",
        },
      },
      {
        test: {
          name: "dom",
          include: ["fluent-dom/test/*_test.js"],
          globals: true,
          environment: "jsdom",
        },
      },
      {
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
