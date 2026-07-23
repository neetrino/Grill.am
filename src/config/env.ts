import "server-only";

import { z } from "zod";

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

/**
 * Foundation env contract. Provider secrets become required when the
 * corresponding feature is wired (auth, DB, Redis, R2, email).
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
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
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

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
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
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
