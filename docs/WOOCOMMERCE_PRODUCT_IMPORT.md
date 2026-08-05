# WooCommerce product import

Production-safe, idempotent importer for the WooCommerce CSV export into grill.am (Drizzle ORM, Cloudflare R2).

## Purpose

Migrate simple WooCommerce products into the existing grill.am catalog without redesigning product architecture.

CSV source (default):

`wc-product-export-5-8-2026-1785923568934.csv`

## Required environment variables

Always required for dry-run / apply / verify (read-only DB checks included):

- `DATABASE_URL`

Required for apply-mode image uploads to real R2 (otherwise the local stub storage adapter is used):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL` (or `R2_PUBLIC_URL`)
- `R2_ENDPOINT` (optional)

Apply confirmation alternatives:

- CLI flag `--confirm-import`
- or `IMPORT_CONFIRMATION=YES`

## Commands

```bash
pnpm products:wc-import:dry
pnpm products:wc-import:apply -- --confirm-import
pnpm products:wc-import:verify
```

Useful options:

```bash
pnpm products:wc-import:dry -- --skip-image-check
pnpm products:wc-import:dry -- --allow-image-failures
pnpm products:wc-import:dry -- --csv path/to/export.csv
pnpm products:wc-import:apply -- --confirm-import --force-stock
pnpm products:wc-import:apply -- --confirm-import --image-concurrency 3
```

Optional image request env (never logged):

- `WC_IMAGE_USER_AGENT`
- `WC_IMAGE_REFERER`
- `WC_IMAGE_COOKIE`

### Dry-run

- Parses and validates the CSV
- Skips WooCommerce ID `677`
- Generates SKUs / unique slugs / category / image plans
- Performs **read-only** database conflict checks
- **GET**-downloads each unique image URL with browser-compatible headers, validates magic bytes / MIME / size
- Does **not** upload to R2
- Treats inaccessible source images as **blocking** unless `--allow-image-failures`
- Writes reports including **Apply readiness**
- Performs **zero** database writes and **zero** R2 writes

### Apply

- Requires `--confirm-import` or `IMPORT_CONFIRMATION=YES`
- Validates the full CSV first (including image GET validation) and aborts when apply-ready is false
- Refuses to start if duplicate final slugs remain
- Upserts categories and products
- Syncs category links
- Sets initial stock to `999` with a non-duplicated `IMPORT` stock movement
- Downloads images and uploads them to R2
- Creates `media_assets` rows with deterministic object keys

### Verify

- Read-only comparison of the CSV plan against current DB/media state

## Fixed migration rules

| Rule | Value |
|---|---|
| Skipped ID | `677` (always) |
| SKU | `WC-{woocommerceId}` (primary idempotency key) |
| Stock | `stockOnHand = 999` on first import |
| lowStockThreshold | database default (`5`) |
| Status | `Опубликован=1` → `ACTIVE`, else `DRAFT` |
| Locale | Armenian only (`translations.hy`) |
| compareAtAmount | always `null` for this CSV |
| Featured | `Рекомендуемый?=1` → true |

### Slug generation

1. Deterministic Armenian → Latin transliteration
2. ASCII normalize via existing `normalizeProductSlug`
3. Fallback: `product-{woocommerceId}`
4. On conflict with another SKU: append `-{woocommerceId}`
5. Shared slug written into every populated locale object

Do not change application product slug validation rules.

### Categories

- Parse WooCommerce `Категории` with escaped commas (`\,`) kept inside names
- First listed category is primary
- Upsert by normalized Armenian title and/or category slug
- Category slugs may contain Unicode (existing category slugify)

### Images → Cloudflare R2

Old WordPress URLs are **source URLs only**. They must not remain as production image references.

Flow:

1. Parse / dedupe URLs
2. Download with redirects + timeouts
3. Validate MIME (magic bytes) and size (existing 5MB / JPEG|PNG|WebP|GIF rules)
4. Upload via the existing R2 storage adapter
5. Create `media_assets`
6. First successful image becomes primary

Deterministic object key pattern:

`uploads/products/{productId}/woocommerce-{woocommerceId}-{index}-{sourceHash}.{ext}`

Image failures become row warnings; the product still imports.

## Idempotency guarantees

- Same WooCommerce ID → same SKU forever
- Existing SKU → update/reuse, never duplicate product
- Categories matched before create
- Media object keys deterministic; existing keys reused
- Stock movement correlation id: `wc-import:{sku}` (no duplicate IMPORT rows on re-run)
- Re-run apply converges to the same catalog state

## Reports

Directory:

`reports/woocommerce-product-import/`

Files:

- `dry-run-report.md` / `.json`
- `apply-report.md` / `.json`
- `verify-report.md` / `.json`

Reports never include secrets, database URLs, R2 tokens, or signed URLs.

## Known limitations

- No English/Russian translations are generated
- No real WooCommerce stock quantities exist in this CSV (temporary `999`)
- Sale prices are ignored (`compareAtAmount = null`)
- Composition is not invented
- Unsupported WooCommerce metadata is ignored
- Neon HTTP client is used for script DB access (same pattern as seed)

## Rollback procedure

Identify imported products:

```sql
SELECT id, sku, stock_on_hand, status
FROM products
WHERE deleted_at IS NULL
  AND sku LIKE 'WC-%';
```

Identify related media:

```sql
SELECT m.id, m.object_key, m.product_id
FROM media_assets m
JOIN products p ON p.id = m.product_id
WHERE p.sku LIKE 'WC-%';
```

Identify import stock movements:

```sql
SELECT *
FROM stock_movements
WHERE reason = 'IMPORT'
  AND correlation_id LIKE 'wc-import:%';
```

Safe rollback strategy:

1. Export the SKU list / IDs first
2. Delete `product_categories` for those product IDs
3. Delete `media_assets` for those product IDs and remove matching R2 objects
4. Delete `stock_movements` for those product IDs (or only `IMPORT` rows)
5. Soft-delete or hard-delete the products (`sku LIKE 'WC-%'`) only after confirming no orders reference them

Do **not** run a destructive rollback command without:

- dry-run mode
- explicit confirmation
- exact imported-product scope (`WC-%` only)
- protection against deleting manually created products
- R2 cleanup reporting

## Warning

WordPress image URLs in the CSV are migration sources only. Production storefront media must use grill.am R2 object keys / public media URLs.
