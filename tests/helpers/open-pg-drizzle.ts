import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";

import * as schema from "@/db/schema";

export type PgDrizzleDb = ReturnType<typeof drizzlePg<typeof schema>>;

export type OpenPgDrizzleResult = {
  pool: PgPool;
  db: PgDrizzleDb;
  close: () => Promise<void>;
};

/** Opens a TCP `pg` + Drizzle client (for local CI Postgres and scripts). */
export function openPgDrizzle(connectionString: string): OpenPgDrizzleResult {
  const pool = new PgPool({ connectionString });
  const db = drizzlePg({ client: pool, schema });
  return {
    pool,
    db,
    close: async () => {
      await pool.end();
    },
  };
}
