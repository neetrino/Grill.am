import { config as loadEnv } from "dotenv";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/db/schema";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env.test"), override: true });

neonConfig.webSocketConstructor = ws;

type Db = ReturnType<typeof drizzle<typeof schema>>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type IntegrationDb = {
  db: Db;
  pool: Pool;
  withTx: <T>(operation: (tx: Tx) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
};

/**
 * Resolves and validates a non-production test database URL.
 * Never prints the URL.
 */
export function resolveTestDatabaseUrl(): string {
  const url =
    process.env.TEST_DATABASE_URL?.trim() ||
    (process.env.PAYMENT_INTEGRATION_ALLOW_DEV_DB === "true"
      ? process.env.DATABASE_URL?.trim()
      : undefined);

  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is required for payment integration tests (or set PAYMENT_INTEGRATION_ALLOW_DEV_DB=true with DATABASE_URL for local/dev only).",
    );
  }

  const lower = url.toLowerCase();
  if (
    (lower.includes("prod") || lower.includes("production")) &&
    !lower.includes("test")
  ) {
    throw new Error(
      "Refusing to run payment integration tests against a production-looking database URL.",
    );
  }

  if (
    process.env.PAYMENT_INTEGRATION_ALLOW_DEV_DB !== "true" &&
    !/test/i.test(url)
  ) {
    throw new Error(
      "TEST_DATABASE_URL must contain 'test', or set PAYMENT_INTEGRATION_ALLOW_DEV_DB=true for an explicit local/dev exception.",
    );
  }

  return url;
}

export async function openIntegrationDb(): Promise<IntegrationDb> {
  const connectionString = resolveTestDatabaseUrl();
  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema });

  return {
    db,
    pool,
    withTx: async (operation) => db.transaction(operation),
    close: async () => {
      await pool.end();
    },
  };
}
