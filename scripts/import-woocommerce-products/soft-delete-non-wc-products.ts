import path from "node:path";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, isNull, like, not, sql } from "drizzle-orm";

import * as schema from "../../src/db/schema/index";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "preview";
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const db = drizzle(neon(databaseUrl), { schema });
  const { products } = schema;

  const keep = await db
    .select({
      id: products.id,
      sku: products.sku,
      title: sql<string>`${products.translations}->'hy'->>'title'`,
    })
    .from(products)
    .where(and(isNull(products.deletedAt), like(products.sku, "WC-%")))
    .orderBy(products.sku);

  const candidates = await db
    .select({
      id: products.id,
      sku: products.sku,
      title: sql<string>`coalesce(${products.translations}->'hy'->>'title', ${products.translations}->'en'->>'title', ${products.translations}->'ru'->>'title')`,
      status: products.status,
    })
    .from(products)
    .where(and(isNull(products.deletedAt), not(like(products.sku, "WC-%"))))
    .orderBy(products.sku);

  console.info(
    JSON.stringify(
      {
        mode,
        keepCount: keep.length,
        candidateCount: candidates.length,
        candidates,
      },
      null,
      2,
    ),
  );

  if (mode !== "apply") {
    return;
  }

  if (candidates.length === 0) {
    console.info(JSON.stringify({ updated: 0, message: "Nothing to soft-delete." }));
    return;
  }

  const now = new Date();
  await db
    .update(products)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(isNull(products.deletedAt), not(like(products.sku, "WC-%"))));

  const [remainingNonWc] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(isNull(products.deletedAt), not(like(products.sku, "WC-%"))));

  const [remainingWc] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(isNull(products.deletedAt), like(products.sku, "WC-%")));

  console.info(
    JSON.stringify(
      {
        softDeleted: candidates.length,
        softDeletedSkus: candidates.map((row) => row.sku),
        activeWcProducts: remainingWc?.n ?? 0,
        activeNonWcProducts: remainingNonWc?.n ?? 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      error: error instanceof Error ? error.message : "unknown",
    }),
  );
  process.exitCode = 1;
});
