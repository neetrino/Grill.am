import path from "node:path";

/** WooCommerce product ID that must never be imported. */
export const EXCLUDED_WOOCOMMERCE_ID = 677;

/** Temporary unlimited stock when WooCommerce quantities are absent. */
export const DEFAULT_IMPORT_STOCK_ON_HAND = 999;

/** SKU prefix used as the WooCommerce source identity. */
export const SKU_PREFIX = "WC-";

/** Correlation id prefix for idempotent IMPORT stock movements. */
export const STOCK_CORRELATION_PREFIX = "wc-import:";

/** Bounded concurrency for remote image download/upload. */
export const DEFAULT_IMAGE_CONCURRENCY = 3;

/** Network timeout for image download / HEAD checks (ms). */
export const IMAGE_FETCH_TIMEOUT_MS = 30_000;

/** Max redirects when downloading remote images. */
export const IMAGE_MAX_REDIRECTS = 5;

/** Field length limits matching product upsert validation. */
export const FIELD_LIMITS = {
  title: 200,
  shortDescription: 500,
  description: 5000,
  seoDescription: 500,
  sku: 120,
  slug: 200,
} as const;

export const DEFAULT_CSV_PATH = path.resolve(
  process.cwd(),
  "wc-product-export-5-8-2026-1785923568934.csv",
);

export const REPORTS_DIR = path.resolve(
  process.cwd(),
  "reports/woocommerce-product-import",
);

/** Explicit WooCommerce CSV header → internal field mapping. */
export const CSV_HEADERS = {
  id: "ID",
  type: "Тип",
  sku: "Артикул",
  name: "Имя",
  published: "Опубликован",
  featured: "Рекомендуемый?",
  shortDescription: "Краткое описание",
  description: "Описание",
  stockStatus: "Наличие",
  stockQty: "Запасы",
  salePrice: "Акционная цена",
  regularPrice: "Базовая цена",
  categories: "Категории",
  images: "Изображения",
  yoastMetaDescription: "Мета: _yoast_wpseo_metadesc",
} as const;

export const REQUIRED_CSV_HEADERS = [
  CSV_HEADERS.id,
  CSV_HEADERS.type,
  CSV_HEADERS.name,
  CSV_HEADERS.published,
  CSV_HEADERS.featured,
  CSV_HEADERS.shortDescription,
  CSV_HEADERS.description,
  CSV_HEADERS.stockStatus,
  CSV_HEADERS.stockQty,
  CSV_HEADERS.regularPrice,
  CSV_HEADERS.salePrice,
  CSV_HEADERS.categories,
  CSV_HEADERS.images,
] as const;

export const OPTIONAL_CSV_HEADERS = [
  CSV_HEADERS.sku,
  CSV_HEADERS.yoastMetaDescription,
] as const;
