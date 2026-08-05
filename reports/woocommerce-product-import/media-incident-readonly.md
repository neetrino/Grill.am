# Media incident — read-only investigation

**Generated:** 2026-08-05  
**Scope:** Production symptom — all imported grill.am products appear to show the same image.  
**Constraint:** Phases 0–5 are read-only. No importer re-apply. No product/category deletion.

## Phase 0 — Environment & counts

| Check | Result |
|---|---|
| Database configured | yes (`DATABASE_URL` present; credentials not printed) |
| R2 configured | yes |
| R2 public host | `pub-0a95985e746a4db09dfa6ef180ecaa1f.r2.dev` |
| PostgreSQL backup | **required before any data write** — this incident does **not** need media data writes |

| Metric | Value |
|---|---:|
| Imported products `SKU LIKE 'WC-%'` | 96 |
| Media rows attached | 99 |
| Distinct product IDs with media | 94 |
| Distinct object keys | 99 |
| Primary media rows (`is_primary`) | 94 |
| Primary role rows | 94 |
| Shared object keys (same key, multiple products) | **0** |
| Products without media | 2 (expected: WC-31779, WC-46668) |

Diagnostics artifact: `reports/woocommerce-product-import/media-incident-diagnostics.json`

## Phase 1 — Symptom classification

Sample SKUs inspected: WC-271, WC-459, WC-477, WC-520, WC-37240.

| Product | Distinct object key | Distinct public URL | Distinct R2 SHA-256 |
|---|---|---|---|
| WC-271 | yes | yes | yes |
| WC-459 | yes | yes | yes |
| WC-477 | yes | yes | yes |
| WC-520 | yes | yes | yes |
| WC-37240 | yes (4 media rows) | yes | yes |

Public URL byte probe: **8/8 downloaded hashes unique** for the sample media rows.

### Classification

| Hypothesis | Verdict |
|---|---|
| A. Database association problem | **Ruled out** — correct `product_id`, unique keys, one primary per product |
| B. R2 object overwrite/key collision | **Ruled out** — 99 distinct keys; sample bytes differ |
| C. Media URL generation problem | **Ruled out** — `mediaPublicUrl(objectKey)` yields distinct URLs |
| D. Backend query/join problem | **Ruled out for admin/enrichment** — queries map by `productId` correctly |
| E. Frontend rendering/state problem | **CONFIRMED** |
| F. Next.js / app cache | Not primary — cards never request per-product URLs |
| G. Shared fallback/placeholder | **CONFIRMED mechanism** |
| H. Browser/CDN cache only | Not primary |

## Phase 2 — Evidence in application code

`src/features/products/ui/ProductCard.tsx`:

- Declares `imageUrl` prop
- Renames it to `_imageUrl` and **never uses it**
- Explicit comment: “reserved until per-product media replaces the shared placeholder image”
- Always renders `PRODUCT_CARD_IMAGE` (`/assets/products/product-card.webp` via static asset URL)
- Cart fly animation from the card also passes `PRODUCT_CARD_IMAGE`

`src/features/products/ui/FeaturedProductCard.tsx`:

- Same hardcoded `PRODUCT_CARD_IMAGE`

Contrast:

- Admin (`AdminProductRow`) uses `product.imageUrl` correctly
- PDP `ProductGallery` uses `selected.url || PRODUCT_CARD_IMAGE` — real media when present
- Catalog enrichment / queries attach the correct primary R2 URL to each product

## Phase 3–5 — Data integrity findings

- Importer media associations are consistent with apply report keys.
- Some checksums are shared across products (e.g. 4 products share checksum `9ba8dda34bf7`). That matches WooCommerce **shared source URLs** across rows (`uniqueImageUrls: 87` vs `imagesDiscovered: 99`). Object keys remain distinct per product; this is expected and not the storefront “same image” bug.
- No media row repair, R2 rewrite, or re-import is required for this incident.

## Root cause

**Frontend product cards intentionally ignore per-product `imageUrl` and always render the shared placeholder `PRODUCT_CARD_IMAGE`.**

Database media rows and R2 objects for imported `WC-%` products are correct.

## Planned fix (non-destructive)

1. Use `imageUrl ?? PRODUCT_CARD_IMAGE` in `ProductCard`.
2. Pass/use `imageUrl` in `FeaturedProductCard`.
3. Use the product’s real image for PDP cart fly animation when available.
4. Do **not** mutate DB/R2 for this incident.
5. Keep placeholder as fallback when `imageUrl` is null (products without media).

## Fix applied

- `src/features/products/ui/ProductCard.tsx` — renders `imageUrl` with placeholder fallback
- `src/features/products/ui/FeaturedProductCard.tsx` — accepts and renders `imageUrl`
- `src/features/products/ui/ProductBuyBox.tsx` + `ProductDetailView.tsx` — cart fly uses real product image
- Regression test: `src/features/products/ui/product-card-image.test.ts`

## Validation

- Typecheck passed
- Lint passed on changed UI files
- Unit tests passed
- Read-only DB/R2 probe: 99 distinct keys, sample SHA-256s unique
- **No DB/R2 mutation performed**
- **Importer apply not re-run**

## Apply readiness for data repair

**Not applicable** — no data repair required.
