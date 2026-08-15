/**
 * Backfills EN/RU catalog copy so admin locale tabs and storefront
 * are not stuck with Armenian-only (or Armenian copied into EN) titles.
 *
 * Usage:
 *   pnpm exec tsx scripts/fill-catalog-translations.ts
 *
 * Keeps existing HY copy and product slugs. Skips SKUs listed in the data file.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

type LocaleCopy = {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  seoDescription?: string;
  composition?: string;
};

type CatalogTranslationsFile = {
  categories: Record<string, { en: LocaleCopy; ru: LocaleCopy }>;
  skipSkus: string[];
  products: Record<string, { en: LocaleCopy; ru: LocaleCopy }>;
};

type TranslationRow = {
  hy?: LocaleCopy;
  en?: LocaleCopy;
  ru?: LocaleCopy;
};

function loadData(): CatalogTranslationsFile {
  const filePath = path.resolve(
    process.cwd(),
    "scripts/data/catalog-translations.json",
  );
  return JSON.parse(readFileSync(filePath, "utf8")) as CatalogTranslationsFile;
}

function withSharedSlug(
  hy: LocaleCopy | undefined,
  copy: LocaleCopy,
): LocaleCopy {
  const slug = hy?.slug?.trim();
  if (!slug) {
    throw new Error("Missing HY slug for shared product URL.");
  }
  return { ...copy, slug };
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in .env");
  }

  const data = loadData();
  const sql = neon(databaseUrl);
  const skip = new Set(data.skipSkus);

  const categories = await sql.query(
    "SELECT id, translations FROM categories WHERE deleted_at IS NULL",
  );
  let categoriesUpdated = 0;
  for (const row of categories) {
    const patch = data.categories[row.id];
    if (!patch) {
      console.warn(`No category translations for ${row.id}`);
      continue;
    }
    const current = row.translations as TranslationRow;
    const next: TranslationRow = {
      ...current,
      hy: current.hy,
      en: { ...patch.en },
      ru: { ...patch.ru },
    };
    await sql.query(
      "UPDATE categories SET translations = $1::jsonb, updated_at = now() WHERE id = $2::uuid",
      [JSON.stringify(next), row.id],
    );
    categoriesUpdated += 1;
  }

  const products = await sql.query(
    "SELECT id, sku, translations FROM products WHERE deleted_at IS NULL",
  );
  let productsUpdated = 0;
  let productsSkipped = 0;
  const unmatchedSkus: string[] = [];

  for (const row of products) {
    if (skip.has(row.sku)) {
      productsSkipped += 1;
      continue;
    }
    const patch = data.products[row.sku];
    if (!patch) {
      unmatchedSkus.push(row.sku);
      continue;
    }
    const current = row.translations as TranslationRow;
    const hy = current.hy;
    if (!hy?.title?.trim() || !hy.slug?.trim()) {
      throw new Error(`Product ${row.sku} is missing HY title/slug.`);
    }
    const next: TranslationRow = {
      ...current,
      hy,
      en: withSharedSlug(hy, patch.en),
      ru: withSharedSlug(hy, patch.ru),
    };
    await sql.query(
      "UPDATE products SET translations = $1::jsonb, updated_at = now() WHERE id = $2::uuid",
      [JSON.stringify(next), row.id],
    );
    productsUpdated += 1;
  }

  const unusedSkus = Object.keys(data.products).filter((sku) => {
    return !products.some((row) => row.sku === sku);
  });

  console.log(
    JSON.stringify(
      {
        categoriesUpdated,
        productsUpdated,
        productsSkipped,
        unmatchedSkus,
        unusedSkus,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
