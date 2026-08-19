import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env.e2e"), override: true });

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

/**
 * Controlled payment E2E. Never calls real ARCA/iDram or sends real email.
 */
export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `pnpm exec tsx tests/e2e/start-web-server.ts`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: !process.env.CI && process.env.E2E_REUSE_SERVER === "true",
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          NODE_ENV: "development",
          PORT: String(PORT),
          NEXT_PUBLIC_APP_URL: BASE_URL,
          NEXT_PUBLIC_CRISP_WEBSITE_ID: "",
          E2E_PROVIDER_MODE: "mock",
          E2E_EMAIL_MODE: process.env.E2E_EMAIL_MODE ?? "mock",
          PAYMENT_ENABLE_COD: "true",
          PAYMENT_ENABLE_ARCA: "true",
          PAYMENT_ENABLE_IDRAM: "true",
          ARCA_ENVIRONMENT: process.env.ARCA_ENVIRONMENT ?? "test",
          ARCA_PAYMENT_MODE: process.env.ARCA_PAYMENT_MODE ?? "one_stage",
          ARCA_API_BASE_URL:
            process.env.ARCA_API_BASE_URL ?? "https://mock.arca.local",
          ARCA_API_USERNAME: process.env.ARCA_API_USERNAME ?? "e2e-user",
          ARCA_API_PASSWORD: process.env.ARCA_API_PASSWORD ?? "e2e-pass",
          ARCA_RETURN_BASE_URL: process.env.ARCA_RETURN_BASE_URL ?? BASE_URL,
          ARCA_CURRENCY_CODE: process.env.ARCA_CURRENCY_CODE ?? "051",
          ARCA_LANGUAGE: process.env.ARCA_LANGUAGE ?? "en",
          ARCA_FORM_URL_ALLOWED_HOSTS:
            process.env.ARCA_FORM_URL_ALLOWED_HOSTS ??
            "127.0.0.1,localhost,mock.arca.local",
          E2E_ARCA_FORM_URL_BASE:
            process.env.E2E_ARCA_FORM_URL_BASE ??
            `${BASE_URL}/api/e2e/arca-form`,
          IDRAM_REC_ACCOUNT: process.env.IDRAM_REC_ACCOUNT ?? "100000000",
          IDRAM_SECRET_KEY: process.env.IDRAM_SECRET_KEY ?? "e2e-idram-secret",
          IDRAM_PAYMENT_URL:
            process.env.IDRAM_PAYMENT_URL ??
            `${BASE_URL}/api/e2e/idram-payment`,
          IDRAM_RESULT_URL: `${BASE_URL}/api/v1/payments/idram/result`,
          IDRAM_SUCCESS_URL: `${BASE_URL}/api/v1/payments/idram/success`,
          IDRAM_FAIL_URL: `${BASE_URL}/api/v1/payments/idram/fail`,
          OPS_ALERT_EMAIL: process.env.OPS_ALERT_EMAIL ?? "ops-e2e@example.com",
        },
      },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "**/payment-smoke.mobile.spec.ts",
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: "**/payment-smoke.mobile.spec.ts",
    },
  ],
});
