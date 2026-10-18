import "server-only";

import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";

import { requireDatabaseUrl } from "@/config/env";
import { isLocalDatabaseUrl } from "@/db/is-local-database-url";
import * as schema from "@/db/schema";
import { logger } from "@/lib/observability/logger";

type TransactionPool = {
  end(): Promise<void>;
  on(event: "error", listener: (error: Error) => void): unknown;
};

neonConfig.webSocketConstructor = ws;

type TransactionCallback = Parameters<
  ReturnType<typeof drizzle<typeof schema>>["transaction"]
>[0];

/** Drizzle transaction handle used by commerce payment/order services. */
export type DatabaseTransaction = Parameters<TransactionCallback>[0];

/** Executes a critical commerce mutation in a PostgreSQL transaction. */
export async function withTransaction<T>(
  operation: (tx: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  const connectionString = requireDatabaseUrl();

  if (isLocalDatabaseUrl(connectionString)) {
    const pool = new PgPool({ connectionString });
    watchPool(pool);
    const db = drizzlePg({ client: pool, schema });
    try {
      return await db.transaction(async (tx) =>
        operation(tx as unknown as DatabaseTransaction),
      );
    } finally {
      await closePool(pool);
    }
  }

  const pool = new NeonPool({ connectionString });
  watchPool(pool);
  const db = drizzle({ client: pool, schema });
  try {
    return await db.transaction(operation);
  } finally {
    await closePool(pool);
  }
}

function watchPool(pool: TransactionPool): void {
  pool.on("error", (error) => {
    logger.warn("db.transaction_pool_error", {
      name: error instanceof Error ? error.name : "Error",
    });
  });
}

/** Close the pool without hiding the transaction result or throwing during cleanup. */
async function closePool(pool: TransactionPool): Promise<void> {
  try {
    await pool.end();
  } catch (error) {
    logger.warn("db.transaction_pool_close_failed", {
      name: error instanceof Error ? error.name : "Error",
    });
  }
}
