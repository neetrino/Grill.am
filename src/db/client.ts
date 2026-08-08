import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";

import { requireDatabaseUrl } from "@/config/env";
import { isLocalDatabaseUrl } from "@/db/is-local-database-url";
import * as schema from "@/db/schema";

export type Database = NeonHttpDatabase<typeof schema>;

let cachedDb: Database | undefined;

/**
 * Shared Drizzle client for server-side queries.
 * Local CI Postgres uses `pg` (TCP); Neon hosts keep the HTTP driver.
 */
export function getDb(): Database {
  if (cachedDb) {
    return cachedDb;
  }

  const connectionString = requireDatabaseUrl();

  if (isLocalDatabaseUrl(connectionString)) {
    const pool = new PgPool({ connectionString });
    // Query API is compatible; cast preserves existing call-site typings.
    cachedDb = drizzlePg({
      client: pool,
      schema,
    }) as unknown as Database;
    return cachedDb;
  }

  const sql = neon(connectionString);
  cachedDb = drizzle(sql, { schema });
  return cachedDb;
}
