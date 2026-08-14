import path from "node:path";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

/**
 * Grill.am storefront menu order: signature BBQ/kebab/grill food first,
 * supporting food next, drinks last.
 */
const MENU_ORDER_BY_HY_TITLE = [
  "Խորոված",
  "Քաբաբ",
  "Հավի գրիլ",
  "Շաուրմա",
  "Կոմբո առաջարկներ, ակցիաներ",
  "Աղցան",
  "Նախուտեստ, սոուս",
  "Ըմպելիքներ",
  "Ալկոհոլային ըմպելիքներ",
] as const;

type CategoryRow = {
  id: string;
  sort_order: number;
  title: string | null;
};

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "preview";
  if (mode !== "preview" && mode !== "apply") {
    throw new Error("Usage: pnpm exec tsx scripts/reorder-storefront-categories.ts [preview|apply]");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const db = drizzle(neon(databaseUrl));
  const rows = await db.execute(sql`
    SELECT
      id,
      sort_order,
      coalesce(
        translations->'hy'->>'title',
        translations->'en'->>'title',
        translations->'ru'->>'title'
      ) AS title
    FROM categories
    WHERE deleted_at IS NULL
    ORDER BY sort_order ASC, created_at ASC
  `);

  const list = (rows.rows ?? rows) as CategoryRow[];
  const byTitle = new Map(
    list
      .filter((row): row is CategoryRow & { title: string } => row.title != null)
      .map((row) => [row.title, row]),
  );

  const orderedIds: string[] = [];
  for (const title of MENU_ORDER_BY_HY_TITLE) {
    const row = byTitle.get(title);
    if (!row) {
      console.warn(`Missing category title: ${title}`);
      continue;
    }
    orderedIds.push(row.id);
  }

  const known = new Set(MENU_ORDER_BY_HY_TITLE);
  for (const row of list) {
    if (row.title == null || !known.has(row.title as (typeof MENU_ORDER_BY_HY_TITLE)[number])) {
      orderedIds.push(row.id);
    }
  }

  console.log("Current → target sort_order:");
  for (const [index, id] of orderedIds.entries()) {
    const row = list.find((entry) => entry.id === id);
    const target = index + 1;
    const changed = row?.sort_order !== target ? " *" : "";
    console.log(
      `  ${String(target).padStart(2, " ")}. ${row?.title ?? id} (${row?.sort_order} → ${target})${changed}`,
    );
  }

  if (mode === "preview") {
    console.log("\nPreview only. Re-run with `apply` to persist.");
    return;
  }

  const now = new Date().toISOString();
  for (const [index, id] of orderedIds.entries()) {
    await db.execute(sql`
      UPDATE categories
      SET sort_order = ${index + 1}, updated_at = ${now}::timestamptz
      WHERE id = ${id}::uuid
    `);
  }

  console.log(`\nUpdated ${orderedIds.length} categories.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
