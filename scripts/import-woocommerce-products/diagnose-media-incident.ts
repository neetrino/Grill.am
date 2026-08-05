import { createHash } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, isNull, like, sql } from "drizzle-orm";

import * as schema from "../../src/db/schema/index";
import { isR2Configured } from "../../src/lib/r2/is-configured";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

const SAMPLE_SKUS = ["WC-271", "WC-459", "WC-477", "WC-520", "WC-37240"] as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const db = drizzle(neon(databaseUrl), { schema });
  const { products } = schema;

  const [productCountRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(products)
    .where(and(like(products.sku, "WC-%"), isNull(products.deletedAt)));

  const mediaStats = await db.execute(sql`
    SELECT
      COUNT(m.id)::int AS media_rows,
      COUNT(DISTINCT m.product_id)::int AS distinct_product_ids,
      COUNT(DISTINCT m.object_key)::int AS distinct_object_keys,
      COUNT(*) FILTER (WHERE m.is_primary)::int AS primary_rows,
      COUNT(*) FILTER (WHERE m.role = 'PRIMARY')::int AS primary_role_rows
    FROM products p
    LEFT JOIN media_assets m ON m.product_id = p.id
    WHERE p.deleted_at IS NULL AND p.sku LIKE 'WC-%'
  `);

  const sample = await db.execute(sql`
    SELECT
      p.sku,
      p.id AS product_id,
      (p.translations->'hy'->>'title') AS title,
      (p.translations->'hy'->>'slug') AS slug,
      m.id AS media_id,
      m.object_key,
      m.is_primary,
      m.sort_order,
      m.mime_type,
      m.byte_size,
      m.checksum,
      m.role,
      m.upload_status
    FROM products p
    LEFT JOIN media_assets m ON m.product_id = p.id
    WHERE p.deleted_at IS NULL
      AND p.sku IN ('WC-271','WC-459','WC-477','WC-520','WC-37240')
    ORDER BY p.sku, m.sort_order NULLS LAST
  `);

  const sharedKeys = await db.execute(sql`
    SELECT
      object_key,
      COUNT(*)::int AS n,
      COUNT(DISTINCT product_id)::int AS products
    FROM media_assets
    WHERE product_id IN (
      SELECT id FROM products WHERE sku LIKE 'WC-%' AND deleted_at IS NULL
    )
    GROUP BY object_key
    HAVING COUNT(*) > 1 OR COUNT(DISTINCT product_id) > 1
    ORDER BY n DESC
    LIMIT 20
  `);

  const sameChecksum = await db.execute(sql`
    SELECT
      checksum,
      COUNT(*)::int AS n,
      COUNT(DISTINCT product_id)::int AS products,
      COUNT(DISTINCT object_key)::int AS keys,
      MIN(byte_size)::int AS byte_size
    FROM media_assets
    WHERE product_id IN (
      SELECT id FROM products WHERE sku LIKE 'WC-%' AND deleted_at IS NULL
    )
      AND checksum IS NOT NULL
    GROUP BY checksum
    ORDER BY products DESC, n DESC
    LIMIT 15
  `);

  const sameSize = await db.execute(sql`
    SELECT
      byte_size,
      mime_type,
      COUNT(*)::int AS n,
      COUNT(DISTINCT product_id)::int AS products,
      COUNT(DISTINCT object_key)::int AS keys
    FROM media_assets
    WHERE product_id IN (
      SELECT id FROM products WHERE sku LIKE 'WC-%' AND deleted_at IS NULL
    )
    GROUP BY byte_size, mime_type
    ORDER BY n DESC
    LIMIT 15
  `);

  const primaryDupes = await db.execute(sql`
    SELECT product_id, COUNT(*)::int AS primary_count
    FROM media_assets
    WHERE product_id IN (
      SELECT id FROM products WHERE sku LIKE 'WC-%' AND deleted_at IS NULL
    )
      AND is_primary = true
    GROUP BY product_id
    HAVING COUNT(*) > 1
  `);

  const productsWithoutMedia = await db.execute(sql`
    SELECT p.sku, p.id
    FROM products p
    LEFT JOIN media_assets m ON m.product_id = p.id
    WHERE p.deleted_at IS NULL AND p.sku LIKE 'WC-%'
    GROUP BY p.sku, p.id
    HAVING COUNT(m.id) = 0
    ORDER BY p.sku
  `);

  const publicBase = (
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.R2_PUBLIC_URL ||
    ""
  ).replace(/\/$/, "");

  type SampleRow = {
    sku: string;
    product_id: string;
    title: string | null;
    slug: string | null;
    media_id: string | null;
    object_key: string | null;
    is_primary: boolean | null;
    sort_order: number | null;
    mime_type: string | null;
    byte_size: number | null;
    checksum: string | null;
    role: string | null;
    upload_status: string | null;
  };

  const sampleRows = (sample.rows ?? sample) as SampleRow[];
  const byteHashes: Array<Record<string, unknown>> = [];

  const r2 = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicBaseUrl: publicBase || undefined,
  };

  if (isR2Configured(r2) && publicBase) {
    for (const row of sampleRows) {
      if (!row.object_key) continue;
      const publicUrl = `${publicBase}/${row.object_key}`;
      try {
        const response = await fetch(publicUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "image/*,*/*;q=0.8",
            Referer: "https://grill.am/",
          },
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        const sha256 = createHash("sha256").update(buffer).digest("hex");
        byteHashes.push({
          sku: row.sku,
          objectKey: row.object_key,
          publicUrl,
          httpStatus: response.status,
          contentType: response.headers.get("content-type"),
          downloadedBytes: buffer.byteLength,
          dbByteSize: row.byte_size,
          sha256,
          mimeDb: row.mime_type,
        });
      } catch (error) {
        byteHashes.push({
          sku: row.sku,
          objectKey: row.object_key,
          publicUrl,
          error: error instanceof Error ? error.message : "fetch failed",
        });
      }
    }
  }

  const uniquePublicHashes = new Set(
    byteHashes
      .map((row) => row.sha256)
      .filter((value): value is string => typeof value === "string"),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    environment: {
      databaseConfigured: true,
      r2Configured: isR2Configured(r2),
      publicBaseConfigured: Boolean(publicBase),
      // Never print secrets or full URLs with tokens.
      publicBaseHost: publicBase ? new URL(publicBase).host : null,
    },
    counts: {
      importedProducts: productCountRow?.n ?? 0,
      media: (mediaStats.rows ?? mediaStats)[0] ?? mediaStats,
    },
    sampleSkus: SAMPLE_SKUS,
    sampleRows,
    sharedObjectKeys: sharedKeys.rows ?? sharedKeys,
    checksumGroups: sameChecksum.rows ?? sameChecksum,
    byteSizeGroups: sameSize.rows ?? sameSize,
    primaryDupes: primaryDupes.rows ?? primaryDupes,
    productsWithoutMedia: productsWithoutMedia.rows ?? productsWithoutMedia,
    publicByteProbe: byteHashes,
    uniqueDownloadedSha256Count: uniquePublicHashes.size,
  };

  const outDir = path.resolve(
    process.cwd(),
    "reports/woocommerce-product-import",
  );
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "media-incident-diagnostics.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.info(
    JSON.stringify(
      {
        importedProducts: report.counts.importedProducts,
        media: report.counts.media,
        sampleCount: sampleRows.length,
        sharedObjectKeys: (report.sharedObjectKeys as unknown[]).length,
        uniqueDownloadedSha256Count: report.uniqueDownloadedSha256Count,
        byteProbeCount: byteHashes.length,
        productsWithoutMedia: (report.productsWithoutMedia as unknown[])
          .length,
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
