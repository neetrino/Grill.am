import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

import { requireDatabaseUrl } from "./env";

export type ImportDatabase = NeonHttpDatabase<typeof schema>;

let cachedDb: ImportDatabase | undefined;

/** Script-safe Drizzle client (avoids Next.js server-only getDb()). */
export function getImportDb(): ImportDatabase {
  if (!cachedDb) {
    cachedDb = drizzle(neon(requireDatabaseUrl()), { schema });
  }
  return cachedDb;
}

/** Test helper to clear the cached client. */
export function resetImportDbCache(): void {
  cachedDb = undefined;
}
