import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 90_000,
    hookTimeout: 90_000,
    fileParallelism: false,
    maxWorkers: 1,
    pool: "forks",
    sequence: {
      concurrent: false,
    },
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
