import path from "node:path";

import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

function emptyToUndefined(value: unknown): unknown {
  return value === "" || value === null || value === undefined
    ? undefined
    : value;
}

const importEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  R2_ACCOUNT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  R2_ACCESS_KEY_ID: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  R2_SECRET_ACCESS_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  R2_BUCKET_NAME: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  R2_PUBLIC_BASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  R2_PUBLIC_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  R2_ENDPOINT: z.preprocess(emptyToUndefined, z.string().url().optional()),
  IMPORT_CONFIRMATION: z.preprocess(
    emptyToUndefined,
    z.string().optional(),
  ),
  WC_IMAGE_USER_AGENT: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  WC_IMAGE_REFERER: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  WC_IMAGE_COOKIE: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
});

export type ImportEnv = z.infer<typeof importEnvSchema>;

/** Loads and validates importer environment (script-safe, no server-only). */
export function getImportEnv(): ImportEnv {
  const parsed = importEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid import environment: ${details}`);
  }
  return parsed.data;
}

export function requireDatabaseUrl(): string {
  return getImportEnv().DATABASE_URL;
}
