# Product CSV Migration Analysis — WooCommerce → grill.am

**Date:** 2026-08-05  
**Scope:** Analysis only (no code changes, no DB writes, no import).  
**CSV source:** `wc-product-export-5-8-2026-1785923568934.csv` (repo root)  
**ORM note:** grill.am uses **Drizzle ORM** (`src/db/schema/*`), not Prisma / TypeORM / Sequelize.

---

## 1. Executive summary

The WooCommerce export contains **97 simple products**, no variable/variation rows, and **no SKUs**. grill.am requires a unique `sku`, a shared **ASCII-only** product slug, multilingual `translations` JSON (`hy`/`en`/`ru`), integer AMD prices, and optional categories/media/customization.

| Verdict | Detail |
|---|---|
| Automatic import with zero transforms | **0% ready** — every row lacks SKU; 55 names produce empty ASCII slugs |
| Import after agreed transforms | **96 / 97 ≈ 99.0%** — exclude WC ID `677` (unpublished, no price/category/image) |
| Hard blockers | Empty SKUs; Armenian→ASCII slug policy; categories absent in grill.am; stock qty empty while cart uses `stockOnHand` |
| Soft gaps | Only Armenian copy in CSV; no `en`/`ru`; no composition field; no WC sale prices; images are remote WP URLs |

**Recommendation:** Do not import yet. First decide SKU strategy, Armenian transliteration + uniqueness for slugs, default stock policy, and whether to upsert categories from CSV names. Then build a dry-run importer.

---

## 2. Product architecture in grill.am

### 2.1 Core tables

| Entity | Table | Code |
|---|---|---|
| Product | `products` | `src/db/schema/catalog.ts` L71–115 |
| Category | `categories` | `src/db/schema/catalog.ts` L117–144 |
| Product↔Category | `product_categories` | `src/db/schema/catalog.ts` L146–170 |
| Shared modifiers | `modifier_catalog` | `src/db/schema/catalog.ts` L179–198 |
| Images | `media_assets` | `src/db/schema/media.ts` L23–80 |
| Stock ledger | `stock_movements` | `src/db/schema/inventory.ts` L15–41 |
| Automatic discounts | `promotions` (+ product/category FK) | `src/db/schema/pricing.ts`; resolved in `src/features/promotions/application/resolve-product-prices.ts` |

### 2.2 What does **not** exist

| Concept | Finding |
|---|---|
| Brand | No brand model/table (docs/code search negative) |
| ProductVariant / attributes table | No variants; OPEN-007 deferred — options live in `customization` JSONB (`docs/03-DATA-MODEL.md` §6.1; `catalog.ts` L43–69) |
| Product tags | No product tag taxonomy |
| Prisma models | N/A — Drizzle |
| WooCommerce / CSV importer | No existing import/export scripts |

### 2.3 Product row shape (`products`)

From `src/db/schema/catalog.ts` L71–115 and `docs/03-DATA-MODEL.md` §6.1:

| Column | Type | Default / constraints |
|---|---|---|
| `id` | uuid PK | app-generated (`createId`) |
| `sku` | text NOT NULL | **UNIQUE** (`products_sku_uidx`) |
| `translations` | jsonb NOT NULL | `TranslationsJson`: partial `hy`/`en`/`ru` |
| `price_amount` | int NOT NULL | `>= 0` check; **whole AMD dram** (`docs/03-DATA-MODEL.md` L24, L150) |
| `compare_at_amount` | int NULL | `>= 0` if set |
| `stock_on_hand` | int NOT NULL | default `0`; `>= 0` |
| `low_stock_threshold` | int NOT NULL | default `5` |
| `version` | int NOT NULL | default `0` |
| `status` | enum | `DRAFT` \| `ACTIVE` \| `ARCHIVED` (`enums.ts` L11–15); default `DRAFT` |
| `is_featured` | bool | default `false` |
| `is_upcoming` | bool | default `false` |
| `badge_translations` / `badge_style` / `badge_position` | jsonb/text | optional |
| `customization` | jsonb NULL | optionGroups + addons + exclusions |
| `created_at` / `updated_at` / `deleted_at` | timestamptz | soft delete |

**Locale translation object** (`catalog.ts` L27–37):

- Required-in-practice: `title`, `slug`
- Optional: `description`, `shortDescription`, `composition`, `seoTitle`, `seoDescription`
- **One shared slug** across filled locales (`product-slug.ts` L30–46; unique expression indexes per locale L99–107)

### 2.4 Admin create/edit path (source of truth for “required”)

`productUpsertSchema` in `src/features/products/application/upsert-product.ts` L40–65:

| Field | Validation | Notes |
|---|---|---|
| `sku` | string trim min 1 max 120 | **Required** |
| `slug` | string min 1 max 200; must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` after normalize (`product-slug.ts` L4–17) | **Required**; ASCII only |
| `localeCopies.*.title` | min 1 max 200 | At least one locale title (`L51–55`) |
| `description` | max 5000 optional | |
| `shortDescription` | max 500 optional | |
| `composition` | max 2000 optional | Admin UI field; used on PDP chips |
| `priceAmount` | int ≥ 0 | **Required** |
| `compareAtAmount` | int ≥ 0 or null | If set, must be **≥** `priceAmount` (`L196–204`) |
| `stockOnHand` | int ≥ 0 | **Required** in payload |
| `categoryIds` | uuid[] | May be **empty**; invalid IDs rejected (`L143–160`) |
| `status` | DRAFT/ACTIVE/ARCHIVED | Create path defaults drawer to `DRAFT` (`ProductDrawer.tsx` L497–500) |
| `customization` | optional Zod schema | Synced to `modifier_catalog` |
| Images | via FormData files | Max 12; JPEG/PNG/WebP/GIF; ≤5MB (`persist-product-media.ts` L15; `image-file.ts` L1–28) |

**Not set by current admin upsert** (but present on DB type): `seoTitle`, `seoDescription`, `lowStockThreshold`, `isUpcoming`, badges.  
`isFeatured` is toggled separately (`admin-product-actions.ts` L80–114), not in drawer upsert.

### 2.5 Frontend / cart usage

| Surface | Uses |
|---|---|
| Catalog / PDP | title, slug, short/full description, composition chips, price + compare-at (after automatic promotions), primary/gallery images, categories, customization, featured “HIT” (`ProductDetailView.tsx`, `catalog-enrichment.ts`) |
| Cart / buy box | `stockOnHand` caps quantity (`ProductBuyBox.tsx` L118; `cart.ts` L146–152) — **stock 0 ⇒ not purchasable** |
| Reviews | Separate engagement feature; not product CSV fields |

### 2.6 Seed baseline

`src/db/seed/run.ts` seeds apparel demo products/categories only — **not** grill.am restaurant categories. All WooCommerce categories must be created or mapped.

---

## 3. Required product fields

For a successful **application-level** create (admin/import mirroring upsert):

| Field | Required? | Evidence |
|---|---|---|
| `id` | Yes (generate UUID) | insert `upsert-product.ts` L218–219 |
| `sku` | **Yes** | schema NOT NULL + unique; Zod min 1; UI required (`ProductDrawer.tsx` L679–682) |
| `translations` with ≥1 locale `title` + shared `slug` | **Yes** | Zod refine + slug validators |
| `priceAmount` | **Yes** | Zod + NOT NULL |
| `stockOnHand` | **Yes** (payload); DB default 0 | Zod; cart depends on it |
| `status` | Yes (can default DRAFT/ACTIVE by policy) | enum |

**Operationally required for a sellable storefront product:**

| Field | Why |
|---|---|
| `status = ACTIVE` | Catalog filters `ACTIVE` + `deletedAt IS NULL` (`queries.ts` L490–494) |
| `stockOnHand > 0` | Buy box `maxQty = stockOnHand` |
| Valid unique slug | PDP route `/{locale}/products/{slug}` |
| Prefer ≥1 image | Optional technically; UX expects gallery |
| Prefer ≥1 category | Optional in upsert; related products / filters suffer without |

---

## 4. Optional product fields

| Field | Optional | Admin editable | Storefront |
|---|---|---|---|
| `compareAtAmount` | Yes | Yes | Sale display + promo baseline |
| `shortDescription` / `description` / `composition` | Yes | Yes | PDP |
| `seoTitle` / `seoDescription` | Yes | **Not in current drawer** | Types support; import can set |
| `categoryIds` | Yes (empty OK) | Yes | Filters, related |
| Images | Yes | Yes | Cards/PDP |
| `customization` | Yes | Yes | Configurator / cart modifiers |
| `isFeatured` | Yes (default false) | Toggle action | Home featured / HIT badge |
| `isUpcoming`, badges, `lowStockThreshold`, `version` | Yes | Partial / defaults | Admin list low-stock uses threshold |

---

## 5. CSV overview

| Property | Value |
|---|---|
| Path | `C:\AI\Grill.am\wc-product-export-5-8-2026-1785923568934.csv` |
| Encoding | UTF-8 **with BOM** |
| Delimiter | `,` |
| Quote | `"` (standard CSV); category commas escaped as `\,` |
| Headers | **60** |
| Data rows | **97** |
| Product types | `simple` = **97** (100%) |
| Variable / variation / grouped | **0** |
| Parent links | column empty for all |
| Language of content | Armenian (hy) product names/descriptions; some RU/EN brand words inside names; **no separate locale columns** |
| Currency | Not present; prices are integer AMD (matches grill.am whole-dram model) |

---

## 6. Complete CSV column inventory

Legend: **WC** = standard WooCommerce export; **Meta** = custom/`meta:` plugin/theme.

| # | Column | Type (detected) | Filled | Empty | Unique (non-empty) | Examples | Class | Notes |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | `ID` | int | 97 | 0 | 97 | `271`, `459` | WC | WooCommerce product ID; not UUID |
| 2 | `Тип` | enum string | 97 | 0 | 1 | `simple` | WC | All simple |
| 3 | `Артикул` | string | **0** | **97** | 0 | — | WC | **All empty** |
| 4 | `Имя` | string | 97 | 0 | 97 | `BOOM առաջարկ`, `Գրիլ ապարատի` | WC | Armenian titles |
| 5 | `Опубликован` | int-like | 97 | 0 | 2 | `1`, `-1` | WC | 96×`1`, 1×`-1` |
| 6 | `Рекомендуемый?` | 0/1 | 97 | 0 | 1 | `0` | WC | All not featured |
| 7 | `Видимость в каталоге` | string | 97 | 0 | 1 | `visible` | WC | |
| 8 | `Краткое описание` | text | 55 | 42 | 46 | Armenian blurb; some `\n` | WC | 2 rows contain HTML tags |
| 9 | `Описание` | text | 13 | 84 | 13 | Long Armenian text | WC | 1 row HTML; no shortcodes detected |
| 10–11 | Sale date start/end | — | 0 | 97 | 0 | — | WC | Empty |
| 12 | `Статус налога` | string | 97 | 0 | 1 | `taxable` | WC | Unused by grill.am |
| 13 | `Налоговый класс` | — | 0 | 97 | 0 | — | WC | Empty |
| 14 | `Наличие` | 0/1 | 97 | 0 | 1 | `1` | WC | In-stock flag; **no qty** |
| 15 | `Запасы` | — | **0** | **97** | 0 | — | WC | Empty |
| 16 | `Величина малых запасов` | — | 0 | 97 | 0 | — | WC | Empty |
| 17–18 | Backorder / sold individually | 0/1 | 97 | 0 | 1 | `0` | WC | Unused |
| 19–22 | Weight / dimensions | — | 0 | 97 | 0 | — | WC | Empty |
| 23 | Allow reviews | 0/1 | 97 | 0 | 1 | `0` | WC | Unused (grill reviews are separate) |
| 24 | Purchase note | — | 0 | 97 | 0 | — | WC | Empty |
| 25 | `Акционная цена` | — | **0** | **97** | 0 | — | WC | No sale prices |
| 26 | `Базовая цена` | int string | **96** | **1** | 49 | `9700`, `3500` | WC | min 50, max 20700; all integers |
| 27 | `Категории` | string | 96 | 1 | 11 raw | `Հավի գրիլ`; `Կոմբո առաջարկներ\, ակցիաներ` | WC | `\,` = literal comma inside name |
| 28 | `Метки` | string | 2 | 95 | 2 | ingredients / vodka tag | WC | No grill product-tag target |
| 29 | Shipping class | — | 0 | 97 | 0 | — | WC | Empty |
| 30 | `Изображения` | URL list | 94 | 3 | 83 | `https://grill.am/wp-content/uploads/...` | WC | Absolute HTTPS URLs; comma-separated |
| 31–32 | Download limits | — | 0 | 97 | 0 | — | WC | Empty |
| 33 | `Родительский` | — | 0 | 97 | 0 | — | WC | No parents |
| 34–36 | Grouped / upsells / cross-sells | — | 0 | 97 | 0 | — | WC | Empty |
| 37–38 | External URL / button | — | 0 | 97 | 0 | — | WC | Empty |
| 39 | `Позиция` | int | 97 | 0 | 1 | `0` | WC | Menu order unused |
| 40 | `Мета: _wp_page_template` | string | 96 | 1 | 1 | `default` | Meta | Unused |
| 41 | `Мета: _yoast_wpseo_estimated-reading-time-minutes` | int | 80 | 17 | 2 | `0`,`1` | Meta/Yoast | Unused |
| 42 | `Мета: custom_text_field_title` | string | 1 | 96 | 1 | `fsdfsdf` | Meta | Noise |
| 43 | `Мета: _havelum` | string | 30 | 67 | 1 | ACF field key | Meta | Unused |
| 44–48 | `Мета: main_product_*_quantity_to_all` | string | 68 | 29 | 1 | `no` | Meta/plugin | Qty rules; no grill equivalent |
| 49 | `Мета: _yoast_wpseo_primary_product_cat` | int | 94 | 3 | 9 | `23` | Meta/Yoast | WP term ID, not title |
| 50 | `Мета: _yoast_wpseo_wordproof_timestamp` | — | 0 | 97 | 0 | — | Meta | Empty |
| 51 | `Мета: _yoast_wpseo_content_score` | int | 25 | 72 | 2 | `60` | Meta | Unused |
| 52 | `Мета: havelum` | — | 0 | 97 | 0 | — | Meta | Empty |
| 53–56 | Elementor meta | string | 1 | 96 | 1 | builder / versions | Meta | Unused |
| 57 | `Мета: _yoast_wpseo_metadesc` | text | 18 | 79 | 17 | Armenian SEO blurbs | Meta | Candidate → `seoDescription` |
| 58 | `Мета: _last_editor_used_jetpack` | string | 1 | 96 | 1 | `classic-editor` | Meta | Unused |
| 59 | `Мета: _yoast_wpseo_focuskw` | string | 9 | 88 | 9 | Armenian keywords | Meta | No focus-kw field in grill |
| 60 | `Мета: _yoast_wpseo_linkdex` | int | 9 | 88 | 7 | `43`,`45` | Meta | Unused |

### CSV checklist answers

| Question | Answer |
|---|---|
| Product ID | Yes — `ID` |
| Type | Yes — all `simple` |
| SKU | Column present, **all empty** |
| GTIN/EAN/barcode | No |
| Name | Yes — `Имя` |
| Slug | **No** |
| Published | Yes — `Опубликован` |
| Short / full description | Yes (partial fill) |
| Regular / sale price | Regular yes; sale **all empty** |
| Currency | No (assume AMD) |
| Tax | Status only |
| Stock qty / manage stock | Qty empty; `Наличие=1` for all |
| Categories / tags | Categories yes; tags sparse |
| Brands | No |
| Images / gallery | Absolute WP URLs; 14 rows multi-URL (only **3** with distinct URLs; 11 duplicate the same URL) |
| Parent / grouped / variations | No data |
| Attributes / defaults | No attribute columns |
| Weight / dimensions / shipping | Empty |
| Upsells / cross-sells | Empty |
| SEO title | No dedicated column |
| SEO description | Partial via Yoast metadesc |
| Multilingual columns | **No** — single-language export |
| Serialized PHP | Not detected in descriptions |

---

## 7. grill.am → CSV mapping table

| grill.am field | Code/database location | Required | CSV column | Mapping status | Transformation needed | Notes |
|---|---|---|---|---|---|---|
| `products.id` | `catalog.ts` L74 | Yes (gen) | `ID` | Match with transformation | Map WC ID → new UUID; keep WC ID in import report / optional metadata | Do not reuse numeric WC IDs as UUIDs |
| `products.sku` | L75; unique | **Yes** | `Артикул` | **Missing in CSV** (column empty) | Generate e.g. `WC-{ID}` or transliterated code | Business decision required |
| `translations.hy.title` | jsonb | **Yes** (≥1 locale) | `Имя` | Direct match | Trim; max 200 | All 97 unique names |
| `translations.en.title` / `ru.title` | jsonb | Optional (DEC-017) | — | Missing in CSV | Leave empty or machine-translate later | Fallback uses hy (`resolve-translation.ts`) |
| `translations.*.slug` (shared) | jsonb + indexes | **Yes** | — | Missing in CSV | Transliterate Armenian → ASCII; uniquify | Naive ASCII strip: **55 empty**, **7 collision groups** |
| `translations.*.shortDescription` | jsonb | Optional | `Краткое описание` | Match with transformation | Strip/sanitize HTML (2 rows); `\n` → newlines; max 500 | 55 filled |
| `translations.*.description` | jsonb | Optional | `Описание` | Match with transformation | Sanitize HTML (1 row); max 5000 | Only 13 filled |
| `translations.*.composition` | jsonb | Optional | — / maybe tags | Unclear and requires decision | Possibly derive from `Метки` for pickles product only | Admin expects composition for chips |
| `translations.*.seoTitle` | jsonb | Optional | — | Missing in CSV | — | Not in admin upsert today |
| `translations.*.seoDescription` | jsonb | Optional | `Мета: _yoast_wpseo_metadesc` | Match with transformation | Copy when present (18 rows) | |
| `priceAmount` | int AMD | **Yes** | `Базовая цена` | Direct match | Parse int; whole dram | 96/97; no decimals |
| `compareAtAmount` | int? | Optional | `Акционная цена` + `Базовая цена` | Present in CSV but unused (sale empty) | If sale filled later: selling=`sale`, compareAt=`regular` (≥ price) | Invert WC regular/sale semantics |
| `stockOnHand` | int | **Yes** | `Запасы` / `Наличие` | Missing in CSV (qty) | Policy: default N, or “unlimited” sentinel | Qty empty; flag=1; stock 0 blocks cart |
| `lowStockThreshold` | int | Optional | `Величина малых запасов` | Missing in CSV | Keep default `5` | |
| `status` | enum | Yes | `Опубликован` | Match with transformation | `1`→`ACTIVE`; `-1`/0→`DRAFT` or skip | 96 published, 1 draft-like |
| `isFeatured` | bool | Optional | `Рекомендуемый?` | Direct match | `1`→true else false | All `0` in CSV |
| `isUpcoming` | bool | Optional | — | Missing in CSV | default false | |
| badges | jsonb/text | Optional | — | Missing in CSV | — | |
| `customization` | jsonb | Optional | — | Missing in CSV | Manual later | No WC attributes/variations |
| `product_categories` | join | Optional | `Категории` | Match with transformation | Parse `\,`; upsert categories by hy title; set primary = first | 9 logical categories |
| `media_assets` | media.ts | Optional | `Изображения` | Match with transformation | Download HTTPS URLs → object storage; first = primary; dedupe identical URLs | 3 products no image; max 12 |
| `modifier_catalog` | catalog | Optional | — | Missing in CSV | — | |
| `stock_movements` | inventory | On stock>0 | — | N/A | Emit `IMPORT` reason (`enums.ts` L43–48) | |
| `version` / timestamps / `deletedAt` | columns | System | — | N/A | Defaults | |
| Brand | — | N/A | — | Present in CSV but unused by grill.am | — | No brand entity |
| Variants | — | N/A | Тип/Родительский | Present in CSV but unused | All simple; ignore | |

---

## 8. CSV → grill.am reverse mapping

| CSV column | Meaning | Destination in grill.am | Will be imported | Reason |
|---|---|---|---|---|
| `ID` | WC product id | External key / report only (not PK) | Yes (as mapping key) | Needed for idempotent re-import |
| `Тип` | Product type | — | Validate only | Must be `simple` |
| `Артикул` | SKU | `products.sku` | **Generate** | Source empty |
| `Имя` | Name | `translations.hy.title` (+ slug source) | Yes | Core |
| `Опубликован` | Publish flag | `products.status` | Yes | Map 1→ACTIVE |
| `Рекомендуемый?` | Featured | `isFeatured` | Yes | All false today |
| `Видимость в каталоге` | Visibility | — | No | Always `visible` |
| `Краткое описание` | Short desc | `translations.hy.shortDescription` | Yes | |
| `Описание` | Long desc | `translations.hy.description` | Yes | Sparse |
| Sale dates | Schedule | — | No | Empty; grill uses promotions separately |
| Tax fields | Tax | — | No | Not in product model |
| `Наличие` | In stock flag | Informs stock policy | Decision | No qty |
| `Запасы` | Qty | `stockOnHand` | Decision / default | Empty |
| Low stock meta | Threshold | `lowStockThreshold` | No (default) | Empty |
| Backorder / sold individually | Flags | — | No | Unsupported / unused |
| Weight / dimensions | Shipping | — | No | Empty; no product shipping dims |
| Reviews allowed | WC reviews | — | No | Separate review system |
| Purchase note | Note | — | No | Empty |
| `Акционная цена` | Sale price | `priceAmount`/`compareAtAmount` | N/A now | All empty |
| `Базовая цена` | Regular price | `priceAmount` | Yes | Missing on 1 row |
| `Категории` | Categories | `categories` + `product_categories` | Yes | Create/map first |
| `Метки` | Tags | Unclear (`composition`?) | Decision | Only 2 rows; no tag model |
| Shipping class | Shipping | — | No | Empty |
| `Изображения` | Image URLs | `media_assets` + storage | Yes | Download pipeline |
| Download / external / grouped / upsell / cross-sell / parent | WC commerce extras | — | No | Empty / unsupported |
| `Позиция` | Menu order | — | No | Always 0 |
| Yoast metadesc | SEO | `seoDescription` hy | Optional yes | 18 rows |
| Yoast focuskw / scores / primary cat id | SEO/plugin | — | No | No targets / WP IDs |
| Elementor / havelum / quantity metas | Plugin junk | — | No | Not in grill model |

---

## 9. Product type and variation analysis

| Metric | Count | Notes |
|---|---|---|
| Total CSV rows | 97 | Each row = one WC product |
| Simple products | 97 | `Тип=simple` |
| Variable products | 0 | |
| Variations | 0 | `Родительский` empty |
| Grouped / external | 0 | |
| Parent products | 0 | |

**Variation counting rule used:** a variation would be a row with `Тип=variation` (or non-empty parent SKU/ID). None present — **every row is an independent product**, not a variation.

---

## 10. Category mapping analysis

### 10.1 CSV categories (after unescaping `\,`)

| Category title (hy) | Product links (approx) |
|---|---:|
| Ալկոհոլային ըմպելիքներ | 12 |
| Աղցան | 7 |
| Ըմպելիքներ | 21 |
| Խորոված | 19 |
| Կոմբո առաջարկներ, ակցիաներ | 17 |
| Հավի գրիլ | 4 |
| Նախուտեստ, սոուս | 7 |
| Շաուրմա | 10 |
| Քաբաբ | 3 |

**Important:** `Կոմբո առաջարկներ\, ակցիաներ` and `Նախուտեստ\, սոուս` are **single** category names containing commas — not two categories.

Some products list multiple categories (e.g. combo + Շաուրմա). First listed → `is_primary=true` is a reasonable default (`product_categories` L156–158).

### 10.2 grill.am side

- Seed only has demo apparel category (`seed/run.ts`).
- Category slugify allows Unicode letters (`categories/domain/slugify.ts` L1–13) — **unlike** product slug ASCII restriction.
- **All 9 WC categories are missing** in grill.am until created.

### 10.3 Special row

WC ID `677` name `Ալկոհոլային ըմպելիքներ` looks like a **category placeholder product** (unpublished `-1`, no price/cat/image) — recommend **exclude**.

---

## 11. Brand mapping analysis

**No brand entity** in grill.am schema, admin, or docs product model. CSV has no brand column.  
**Status:** N/A — nothing to map.

---

## 12. Image migration analysis

| Metric | Value |
|---|---|
| Rows with ≥1 image URL | 94 |
| Rows without images | **3** — IDs `677`, `31779` (Տարա գրիլի համար), `46668` (Գառան խառը խորոված) |
| Total URL mentions | 110 |
| Absolute `https://` | 110 / 110 |
| Unique URLs | 87 |
| Rows with multiple distinct gallery URLs | **3** |
| Rows with repeated same URL twice | **11** (treat as single image) |
| Attachment IDs | Not used — full URLs only |
| Host | `grill.am/wp-content/uploads/...` (Armenian path segments URL-encoded in HTTP) |

**Target:** download → validate MIME/size → `storage.putObject` under `uploads/products/{productId}/{mediaId}.ext` → `media_assets` (`persist-product-media.ts` L83–105).

**Risks:** remote availability/CORS not tested in this analysis; WebP/JPEG/PNG/GIF only; files >5MB rejected by current validator; Unicode filenames in URLs.

---

## 13. Translation analysis

| Locale | In CSV | In grill.am |
|---|---|---|
| hy (Armenian) | Yes — names/descriptions | Primary import locale |
| en | No dedicated fields | Missing — optional under DEC-017 |
| ru | No dedicated fields | Missing |

Resolver fallback: requested locale → other locales with title (`resolve-translation.ts` L8–32). Importing **hy-only** is valid: EN/RU storefronts will show Armenian titles until translated.

**Slug:** must be Latin ASCII shared across locales — **cannot** store Armenian slug strings (`product-slug.ts` L4–17` vs category Unicode slugify).

---

## 14. SEO and custom metadata analysis

| Source | Import? |
|---|---|
| Yoast metadesc (18) | Optional → `translations.hy.seoDescription` |
| Yoast focuskw / linkdex / content score | No |
| Yoast primary_product_cat (WP term IDs) | No — use category **names** instead |
| Elementor / Jetpack / havelum / ACF keys | No |
| Quantity rule metas (`main_product_*`) | No grill equivalent — **manual decision** if qty steps needed later via customization/business rules |

---

## 15. Missing and incompatible data

| Gap | Impact |
|---|---|
| Empty SKUs (97/97) | Cannot insert without generation |
| No product slugs | Must generate; ASCII policy incompatible with raw Armenian |
| No en/ru copy | Partial i18n |
| No composition field | PDP composition chips empty unless derived |
| No stock quantities | Defaulting to 0 makes products unsellable |
| No sale prices | `compareAtAmount` stays null (OK) |
| No variants/attributes | OK — all simple; customization empty |
| WC numeric IDs vs UUID | Need mapping table |
| Categories not in DB | Must create before linking |
| Plugin metas | Ignore |
| HTML in a few descriptions | Sanitize |
| Image URLs not object keys | Must re-host |

---

## 16. Data quality issues with counts

| Issue | Count | Examples |
|---|---:|---|
| Empty SKU | **97** | All rows |
| Unpublished (`Опубликован=-1`) | **1** | `677` Ալկոհոլային ըմպելիքներ |
| Missing price | **1** | `677` |
| Missing category | **1** | `677` |
| Missing images | **3** | `677`, `31779`, `46668` |
| Names → empty ASCII slug (naive) | **55** | `Գրիլ ապարատի`, `Քաբաբ հավի`, … |
| Naive slug collision groups | **7** | `0-5` (16 drinks), `twix` (2), `bbq` (2), `n2` (2), … |
| Duplicate product names | 0 | All names unique |
| Duplicate WC IDs | 0 | |
| Non-integer prices | 0 | |
| Sale price filled | 0 | |
| HTML in short description | 2 | |
| HTML in full description | 1 | |
| WP shortcodes / PHP serialized | 0 detected | |
| Shared image URLs across products | Common | e.g. same grill photo on 3 products |
| Multi-category products | Several | e.g. `27011`, `37240` |
| Unsupported product types | 0 | |

---

## 17. Required transformations

### 17.1 Status

- `Опубликован == 1` → `ACTIVE`
- else → `DRAFT` or **skip** (recommend skip for `677`)

### 17.2 Price

- `priceAmount = int(Базовая цена)`
- `compareAtAmount = null` (no sale prices)
- Future rule if sale appears: `priceAmount = sale`, `compareAtAmount = regular`, enforce `compareAt >= price` (`upsert-product.ts` L196–204)

### 17.3 SKU (decision)

Options:

1. `WC-{ID}` (simple, unique, reversible) — **recommended default**
2. Transliterated name code + ID suffix
3. Manual spreadsheet fill before import

### 17.4 Slug (decision)

1. Armenian transliteration library (hy→latn) + `normalizeProductSlug`
2. On empty/collision: append `-{wcId}`
3. Never use Unicode in product slugs (code forbids)

### 17.5 Stock (decision)

Because `Запасы` empty and cart uses `stockOnHand`:

| Option | Pros | Cons |
|---|---|---|
| A. Default high value (e.g. 999 / 9999) | Sellable immediately | Fake inventory |
| B. Default 0 + DRAFT | Safe | Nothing purchasable until edited |
| C. Treat `Наличие=1` as “unlimited” via large sentinel + document | Matches WC unmanaged stock | Still not true unlimited |

`stock_movements.reason = IMPORT` when setting initial qty.

### 17.6 Categories

1. Parse category field with WC escaping (`\,` → `,`)
2. Upsert `categories` by `translations.hy.title` (and Unicode slug via category slugify)
3. Link `product_categories`; first = primary

### 17.7 Images

1. Split on `, ` / `,`
2. Dedupe identical URLs
3. Cap at 12
4. Download, validate MIME/size, upload to app storage
5. First image `isPrimary=true`

### 17.8 Descriptions

- Unescape `\n`
- Sanitize HTML tags
- Truncate to Zod max lengths
- Do **not** invent composition unless business maps short description / tags → composition

### 17.9 Translations

- Write `hy` only from CSV
- Leave `en`/`ru` absent unless a translation pass is approved
- Apply shared slug to every present locale object

### 17.10 Customization / variants

- No CSV source → leave `null`
- Do not invent option groups from tags

### 17.11 Featured

- Map `Рекомендуемый?` (`0`/`1`) → `isFeatured` (all false in this file)

---

## 18. Recommended import order

1. **Dry-run report** (this analysis + per-row errors)  
2. Upsert **categories** from unique CSV titles  
3. Generate **SKU + slug** mapping table; resolve collisions  
4. Decide **stock default** and **status** policy  
5. Insert **products** (`translations`, prices, status, featured)  
6. Insert **product_categories**  
7. Download/upload **media_assets**  
8. Write **stock_movements** (`IMPORT`) if stock > 0  
9. Optional: fill `seoDescription` from Yoast  
10. Manual pass: composition, en/ru, customization, featured curation  
11. Spot-check storefront catalog/PDP/cart  

Idempotency key: WooCommerce `ID` stored in an import map (file or dedicated table — **not implemented yet**; would need approval if schema change).

---

## 19. Migration blockers

| Blocker | Severity | Count / note |
|---|---|---|
| Empty SKUs | **Hard** | 97/97 — generation policy required |
| Invalid/empty ASCII slugs from Armenian names | **Hard** | 55 empty + collision risk |
| Categories missing in grill.am | **Hard** (ordering) | 9 categories must be created first |
| Stock qty missing | **Hard** for sellability | Default 0 blocks checkout |
| Product without price | **Hard** for that row | ID `677` |
| Remote images may be unavailable | **Medium** | Not probed live in this analysis |
| en/ru missing | **Medium** (product decision) | hy-only OK technically |
| No importer code | **Process** | Must be built after decisions |
| WC ID ≠ UUID | **Process** | Mapping required |

Non-blockers: variants (none), brands (N/A), sale prices (none), most plugin meta (ignore).

---

## 20. Migration readiness statistics

| Metric | Value |
|---|---:|
| Total CSV rows | 97 |
| Total parent products | 0 |
| Total simple products | 97 |
| Total variable products | 0 |
| Total variations | 0 |
| Products ready for **automatic** import (no transforms beyond parsing) | **0** |
| Products requiring transformation (SKU/slug/category/media/stock) | **96** (all real catalog rows) |
| Products blocked by missing required price/publish data | **1** (`677`) |
| Duplicate SKUs in CSV | 0 (all empty; post-gen should be unique) |
| Duplicate names | 0 |
| Duplicate naive ASCII slugs | 7 groups (among non-empty naive slugs) |
| Products without images | 3 |
| Products without prices | 1 |
| Products without categories | 1 |
| Unsupported product types | 0 |

### Readiness percentage

**Definition A — zero business transforms:**  
`0 / 97 × 100 = 0%`

**Definition B — after standard agreed transforms** (generate SKU, transliterate+uniquify slug, upsert categories, default stock, download images; exclude unsellable `677`):  
`96 / 97 × 100 ≈ 99.0%`

**Primary reported readiness (recommended):** **99.0%** under Definition B; **0%** without decisions on SKU/slug/stock.

Variations were not double-counted: none exist; each of the 97 rows is one simple product.

---

## 21. Final recommendation

1. **Do not run a live import yet.**  
2. Get explicit decisions on: SKU scheme, Armenian transliteration, stock default, whether to auto-create categories, whether to skip `677`, whether hy-only is acceptable for launch.  
3. Build an idempotent dry-run importer that prints the mapping table and fails closed on slug/SKU collisions.  
4. Re-host images; do not hotlink `grill.am/wp-content` long-term.  
5. Plan a second content pass for `composition`, `en`/`ru`, and `customization` (addons/exclusions) — these are grill.am differentiators absent from CSV.

---

## Checklist

### Can be imported automatically

- Product type validation (`simple` only)
- Armenian `title` from `Имя`
- Integer `priceAmount` from `Базовая цена` (96 rows)
- Publish flag → status mapping
- Featured flag (all false)
- Short/full description copy (where present)
- Category name parsing (with `\,` unescape)
- Absolute image URL discovery
- Yoast metadesc → optional `seoDescription`

### Requires transformation

- SKU generation (all rows)
- Slug transliteration + uniquification (majority of rows)
- Category upsert + UUID linking
- Image download → object storage → `media_assets`
- Stock default / `IMPORT` ledger rows
- HTML/`\n` cleanup in descriptions
- WC ID → UUID mapping catalog
- Sale/regular inversion **if** future CSVs include sale prices

### Requires manual decision

- SKU format
- Transliteration standard for slugs
- Default `stockOnHand` when WC qty empty
- Import `677` or skip
- hy-only vs mandatory en/ru before publish
- Whether tags → `composition`
- Whether quantity-plugin metas matter
- Featured curation (CSV has none featured)
- Whether unpublished should ever import as DRAFT

### Missing from CSV

- SKU values
- Product slugs
- English / Russian locale fields
- Stock quantities / low-stock thresholds
- Sale prices
- Composition
- Variants / attributes / customization
- Brands
- GTIN/barcode
- Native SEO title
- grill.am UUIDs

### Present in CSV but not needed

- Tax status/class
- Weight/dimensions/shipping class
- Downloadable fields
- Upsells/cross-sells/grouped/parent/external
- Menu position (always 0)
- WC review flag
- Elementor / Jetpack / havelum / ACF metas
- Yoast scores, focus keywords, primary cat **IDs**, reading time
- Quantity “main_product_*” metas (all `no`)
- Visibility (always visible)

---

## Source references (key conclusions)

| Conclusion | Path |
|---|---|
| Product table + translations + customization types | `src/db/schema/catalog.ts` L27–115, L146–170, L179–198 |
| Status / modifier / stock reason enums | `src/db/schema/enums.ts` L11–15, L22–26, L43–48 |
| Media ownership | `src/db/schema/media.ts` L23–74 |
| Admin upsert validation + compare-at rule + category sync | `src/features/products/application/upsert-product.ts` L33–65, L143–180, L196–227 |
| ASCII slug rules | `src/features/products/domain/product-slug.ts` L4–46 |
| Customization schema | `src/features/products/domain/customization.ts` L15–47 |
| Image limits / storage keys | `src/features/products/application/persist-product-media.ts` L15–105 |
| Image MIME/size | `src/lib/media/image-file.ts` L1–28 |
| Locale fallback | `src/features/products/domain/resolve-translation.ts` L8–32 |
| Cart/PDP stock dependency | `src/features/products/ui/ProductBuyBox.tsx` L118; `src/features/cart/cart.ts` L146–152 |
| Featured toggle (not drawer) | `src/features/products/application/admin-product-actions.ts` L80–114 |
| Money = whole AMD | `docs/03-DATA-MODEL.md` L24, L144–158 |
| Category Unicode slugify | `src/features/categories/domain/slugify.ts` L1–13 |
| Seed demo only | `src/db/seed/run.ts` L105–188 |
| CSV file analyzed | `wc-product-export-5-8-2026-1785923568934.csv` |

---

*End of analysis. No importer implemented.*
