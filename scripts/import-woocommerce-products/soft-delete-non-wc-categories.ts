import path from "node:path";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, isNull, sql } from "drizzle-orm";

import * as schema from "../../src/db/schema/index";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

/** Armenian titles created by the WooCommerce importer. */
const WC_CATEGORY_TITLES = new Set([
  "Ալկոհոլային ըմպելիքներ",
  "Աղցան",
  "Ըմպելիքներ",
  "Խորոված",
  "Կոմբո առաջարկներ, ակցիաներ",
  "Հավի գրիլ",
  "Նախուտեստ, սոուս",
  "Շաուրմա",
  "Քաբաբ",
]);

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "preview";
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const db = drizzle(neon(databaseUrl), { schema });
  const { categories } = schema;

  const rows = await db.execute(sql`
    SELECT
      c.id,
      c.status,
      c.deleted_at,
      coalesce(
        c.translations->'hy'->>'title',
        c.translations->'en'->>'title',
        c.translations->'ru'->>'title'
      ) AS title,
      coalesce(
        c.translations->'hy'->>'slug',
        c.translations->'en'->>'slug',
        c.translations->'ru'->>'slug'
      ) AS slug,
      COUNT(pc.id) FILTER (
        WHERE p.deleted_at IS NULL AND p.sku LIKE 'WC-%'
      )::int AS active_wc_links,
      COUNT(pc.id) FILTER (
        WHERE p.deleted_at IS NULL AND p.sku NOT LIKE 'WC-%'
      )::int AS active_non_wc_links,
      COUNT(pc.id)::int AS total_links
    FROM categories c
    LEFT JOIN product_categories pc ON pc.category_id = c.id
    LEFT JOIN products p ON p.id = pc.product_id
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY title
  `);

  type Row = {
    id: string;
    status: string;
    deleted_at: string | null;
    title: string | null;
    slug: string | null;
    active_wc_links: number;
    active_non_wc_links: number;
    total_links: number;
  };

  const list = (rows.rows ?? rows) as Row[];
  const keep = list.filter(
    (row) => row.title != null && WC_CATEGORY_TITLES.has(row.title),
  );
  const candidates = list.filter(
    (row) => row.title == null || !WC_CATEGORY_TITLES.has(row.title),
  );

  // Safety: never soft-delete a category that still has active WC products.
  const unsafe = candidates.filter((row) => row.active_wc_links > 0);
  const safe = candidates.filter((row) => row.active_wc_links === 0);

  console.info(
    JSON.stringify(
      {
        mode,
        keepCount: keep.length,
        keepTitles: keep.map((row) => row.title),
        candidateCount: candidates.length,
        candidates: safe,
        blockedBecauseLinkedToWc: unsafe,
      },
      null,
      2,
    ),
  );

  if (mode !== "apply") return;

  if (safe.length === 0) {
    console.info(JSON.stringify({ softDeleted: 0 }));
    return;
  }

  const now = new Date();
  for (const row of safe) {
    await db
      .update(categories)
      .set({ deletedAt: now, updatedAt: now, status: "ARCHIVED" })
      .where(and(isNull(categories.deletedAt), sql`${categories.id} = ${row.id}`));
  }

  const remaining = await db.execute(sql`
    SELECT
      coalesce(
        c.translations->'hy'->>'title',
        c.translations->'en'->>'title',
        c.translations->'ru'->>'title'
      ) AS title
    FROM categories c
    WHERE c.deleted_at IS NULL
    ORDER BY title
  `);

  console.info(
    JSON.stringify(
      {
        softDeleted: safe.length,
        softDeletedTitles: safe.map((row) => row.title),
        activeCategories: (remaining.rows ?? remaining).map(
          (row: { title: string | null }) => row.title,
        ),
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
