import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "tests/unit/**/*.test.ts",
      "scripts/**/*.test.ts",
    ],
  },
  resolve: {
    alias: [
      {
        find: "server-only",
        replacement: path.resolve(
          __dirname,
          "./tests/integration/helpers/empty-module.ts",
        ),
      },
      {
        find: "@/locales",
        replacement: path.resolve(__dirname, "./locales"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
});
