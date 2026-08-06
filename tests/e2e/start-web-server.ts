/**
 * Playwright webServer entry: prepare DB, then start Next with E2E env overrides.
 * Ensures .env.e2e wins over developer .env payment flags.
 */
import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
loadEnv({ path: path.resolve(root, ".env") });
loadEnv({ path: path.resolve(root, ".env.e2e"), override: true });

const port = process.env.E2E_PORT ?? "3100";
process.env.PORT = port;
// Production `next build` leaves `.next` that can make subsequent `next dev`
// serve stale production artifacts (E2E APIs and pages 404 as HTML). Always
// force a clean development server for Playwright.
process.env.NODE_ENV = "development";
process.env.NEXT_PUBLIC_APP_URL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
process.env.E2E_PROVIDER_MODE = "mock";
process.env.E2E_EMAIL_MODE = process.env.E2E_EMAIL_MODE ?? "mock";
process.env.PAYMENT_ENABLE_COD = "true";
process.env.PAYMENT_ENABLE_ARCA = "true";
process.env.PAYMENT_ENABLE_IDRAM = "true";

// Wipe only when a production build contaminated `.next` (required-server-files).
// Keep a warm Turbopack `dev` cache across normal E2E runs.
const nextDir = path.resolve(root, ".next");
const productionMarker = path.join(nextDir, "required-server-files.json");
if (fs.existsSync(productionMarker)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
}

const prepare = spawnSync("pnpm", ["exec", "tsx", "tests/e2e/prepare-db.ts"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
  cwd: root,
});
if (prepare.status !== 0) {
  process.exit(prepare.status ?? 1);
}

const child = spawn(
  "pnpm",
  ["exec", "next", "dev", "--port", port],
  {
    stdio: "inherit",
    env: process.env,
    shell: true,
    cwd: root,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
