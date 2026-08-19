import "server-only";

import { z } from "zod";

import { parseCrispWebsiteId } from "@/lib/crisp/website-id";

/** Dotenv empty placeholders (`KEY=`) must not fail optional validators. */
function emptyToUndefined(value: unknown): unknown {
  return value === "" || value === null || value === undefined
    ? undefined
    : value;
}

function optionalNonEmptyString() {
  return z.preprocess(emptyToUndefined, z.string().min(1).optional());
}

function optionalUrl() {
  return z.preprocess(emptyToUndefined, z.string().url().optional());
}

function optionalEmail() {
  return z.preprocess(emptyToUndefined, z.string().email().optional());
}

function optionalBoolean(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") return true;
      if (normalized === "false" || normalized === "0") return false;
    }
    return value;
  }, z.boolean());
}

/**
 * Foundation env contract. Provider secrets become required when the
 * corresponding feature is wired (auth, DB, Redis, R2, email).
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  /**
   * Crisp live-chat website id (public frontend value). Omit to disable the widget.
   */
  NEXT_PUBLIC_CRISP_WEBSITE_ID: z.preprocess((value) => {
    const emptied = emptyToUndefined(value);
    if (emptied === undefined) {
      return undefined;
    }
    return parseCrispWebsiteId(emptied) ?? emptied;
  }, z.string().uuid().optional()),
  AUTH_SECRET: optionalNonEmptyString(),
  DATABASE_URL: optionalNonEmptyString(),
  UPSTASH_REDIS_REST_URL: optionalUrl(),
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmptyString(),
  R2_ACCOUNT_ID: optionalNonEmptyString(),
  R2_ACCESS_KEY_ID: optionalNonEmptyString(),
  R2_SECRET_ACCESS_KEY: optionalNonEmptyString(),
  R2_BUCKET_NAME: optionalNonEmptyString(),
  R2_PUBLIC_BASE_URL: optionalUrl(),
  /** Optional custom S3 API endpoint; defaults to account R2 endpoint. */
  R2_ENDPOINT: optionalUrl(),
  EMAIL_FROM: optionalEmail(),
  RESEND_API_KEY: optionalNonEmptyString(),
  /** Destination for rich admin order notification emails. */
  ADMIN_EMAIL: optionalEmail(),
  /** Cash on delivery — default enabled for development. */
  PAYMENT_ENABLE_COD: optionalBoolean(true),
  /** ARCA card payments — disabled until provider phase. */
  PAYMENT_ENABLE_ARCA: optionalBoolean(false),
  /** iDram wallet payments — disabled until verified. */
  PAYMENT_ENABLE_IDRAM: optionalBoolean(false),
  /**
   * How often the payment reconcile cron should run (minutes).
   * Keep in sync with `vercel.json` crons schedule (default 30 → twice/hour).
   */
  PAYMENT_RECONCILE_INTERVAL_MINUTES: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return 30;
    }
    return value;
  }, z.coerce.number().int().min(5).max(120)),
  /**
   * Local ARCA attempt TTL before abandoned PENDING may be expired (minutes).
   */
  PAYMENT_PENDING_TIMEOUT_MINUTES: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return 60;
    }
    return value;
  }, z.coerce.number().int().min(10).max(1440)),
  /** Bearer secret for `/api/v1/cron/*` (Vercel Cron Authorization header). */
  CRON_SECRET: optionalNonEmptyString(),

  /**
   * ARCA EPG (server-only). Required when PAYMENT_ENABLE_ARCA=true.
   * Administration GUI credentials must never be stored here.
   */
  ARCA_ENVIRONMENT: z.preprocess(
    emptyToUndefined,
    z.enum(["test", "production"]).optional(),
  ),
  /** Explicit API base — do not derive prod from test by string rewrite. */
  ARCA_API_BASE_URL: optionalUrl(),
  ARCA_API_USERNAME: optionalNonEmptyString(),
  ARCA_API_PASSWORD: optionalNonEmptyString(),
  /** Canonical public origin for return URLs (no preview deploy URLs). */
  ARCA_RETURN_BASE_URL: optionalUrl(),
  /** Merchant-configured payment scheme (Merchant Manual §7.1 vs §7.2). */
  ARCA_PAYMENT_MODE: z.preprocess(
    emptyToUndefined,
    z.enum(["one_stage", "two_stage"]).optional(),
  ),
  /** ISO 4217 numeric; AMD = 051 per official manual examples. */
  ARCA_CURRENCY_CODE: optionalNonEmptyString(),
  /** ISO 639-1 language for ARCA messages (A2). */
  ARCA_LANGUAGE: optionalNonEmptyString(),
  /** Comma-separated extra allowlisted formUrl hosts. */
  ARCA_FORM_URL_ALLOWED_HOSTS: optionalNonEmptyString(),

  /**
   * iDram Merchant API (server-only). Required when PAYMENT_ENABLE_IDRAM=true.
   * SECRET_KEY must never use NEXT_PUBLIC_* or appear in form fields.
   */
  IDRAM_REC_ACCOUNT: optionalNonEmptyString(),
  IDRAM_SECRET_KEY: optionalNonEmptyString(),
  IDRAM_PAYMENT_URL: optionalUrl(),
  IDRAM_RESULT_URL: optionalUrl(),
  IDRAM_SUCCESS_URL: optionalUrl(),
  IDRAM_FAIL_URL: optionalUrl(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

/** Clears cached env — for unit tests only. */
export function resetEnvCacheForTests(): void {
  cachedEnv = undefined;
}

function resolvePublicBaseUrl(): string | undefined {
  return (
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_URL ||
    undefined
  );
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CRISP_WEBSITE_ID: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: resolvePublicBaseUrl(),
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    PAYMENT_ENABLE_COD: process.env.PAYMENT_ENABLE_COD,
    PAYMENT_ENABLE_ARCA: process.env.PAYMENT_ENABLE_ARCA,
    PAYMENT_ENABLE_IDRAM: process.env.PAYMENT_ENABLE_IDRAM,
    PAYMENT_RECONCILE_INTERVAL_MINUTES:
      process.env.PAYMENT_RECONCILE_INTERVAL_MINUTES,
    PAYMENT_PENDING_TIMEOUT_MINUTES:
      process.env.PAYMENT_PENDING_TIMEOUT_MINUTES,
    CRON_SECRET: process.env.CRON_SECRET,
    ARCA_ENVIRONMENT:
      process.env.ARCA_ENVIRONMENT ||
      (process.env.ARCA_MODE === "test" ||
      process.env.ARCA_MODE === "production"
        ? process.env.ARCA_MODE
        : undefined),
    ARCA_API_BASE_URL: process.env.ARCA_API_BASE_URL,
    // Prefer explicit API_* names; accept legacy username/password aliases.
    ARCA_API_USERNAME:
      process.env.ARCA_API_USERNAME || process.env.ARCA_USERNAME,
    ARCA_API_PASSWORD:
      process.env.ARCA_API_PASSWORD || process.env.ARCA_PASSWORD,
    ARCA_RETURN_BASE_URL: process.env.ARCA_RETURN_BASE_URL,
    ARCA_PAYMENT_MODE: process.env.ARCA_PAYMENT_MODE,
    ARCA_CURRENCY_CODE: process.env.ARCA_CURRENCY_CODE,
    ARCA_LANGUAGE: process.env.ARCA_LANGUAGE,
    ARCA_FORM_URL_ALLOWED_HOSTS: process.env.ARCA_FORM_URL_ALLOWED_HOSTS,
    IDRAM_REC_ACCOUNT: process.env.IDRAM_REC_ACCOUNT,
    IDRAM_SECRET_KEY: process.env.IDRAM_SECRET_KEY,
    IDRAM_PAYMENT_URL: process.env.IDRAM_PAYMENT_URL,
    IDRAM_RESULT_URL: process.env.IDRAM_RESULT_URL,
    IDRAM_SUCCESS_URL: process.env.IDRAM_SUCCESS_URL,
    IDRAM_FAIL_URL: process.env.IDRAM_FAIL_URL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  if (parsed.data.PAYMENT_ENABLE_ARCA) {
    const missing: string[] = [];
    if (!parsed.data.ARCA_ENVIRONMENT) missing.push("ARCA_ENVIRONMENT");
    if (!parsed.data.ARCA_API_BASE_URL) missing.push("ARCA_API_BASE_URL");
    if (!parsed.data.ARCA_API_USERNAME) missing.push("ARCA_API_USERNAME");
    if (!parsed.data.ARCA_API_PASSWORD) missing.push("ARCA_API_PASSWORD");
    if (!parsed.data.ARCA_PAYMENT_MODE) missing.push("ARCA_PAYMENT_MODE");
    if (missing.length > 0) {
      throw new Error(
        `Invalid environment configuration: PAYMENT_ENABLE_ARCA=true requires ${missing.join(", ")}`,
      );
    }
  }

  if (parsed.data.PAYMENT_ENABLE_IDRAM) {
    const missing: string[] = [];
    if (!parsed.data.IDRAM_REC_ACCOUNT) missing.push("IDRAM_REC_ACCOUNT");
    if (!parsed.data.IDRAM_SECRET_KEY) missing.push("IDRAM_SECRET_KEY");
    if (!parsed.data.IDRAM_PAYMENT_URL) missing.push("IDRAM_PAYMENT_URL");
    if (!parsed.data.IDRAM_RESULT_URL) missing.push("IDRAM_RESULT_URL");
    if (!parsed.data.IDRAM_SUCCESS_URL) missing.push("IDRAM_SUCCESS_URL");
    if (!parsed.data.IDRAM_FAIL_URL) missing.push("IDRAM_FAIL_URL");
    if (missing.length > 0) {
      throw new Error(
        `Invalid environment configuration: PAYMENT_ENABLE_IDRAM=true requires ${missing.join(", ")}`,
      );
    }
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Database URL is required for Drizzle client and migrations. */
export function requireDatabaseUrl(): string {
  const { DATABASE_URL } = getEnv();

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  return DATABASE_URL;
}
