import { CSV_HEADERS, DEFAULT_IMPORT_STOCK_ON_HAND, FIELD_LIMITS } from "./constants";
import { parseWooCommerceCategories } from "./category-parser";
import { generateProductSlug } from "./generate-slug";
import {
  buildPlannedImageObjectKeyTemplate,
  hashImageSourceUrl,
  parseProductImageUrls,
} from "./image-parser";
import {
  normalizeDescriptionText,
  normalizeSeoDescription,
  normalizeTitle,
} from "./normalize-text";
import { cell } from "./read-csv";
import {
  generateSku,
  isExcludedWooCommerceId,
  mapFeaturedFlag,
  mapPublishedStatus,
  parseIntegerAmdPrice,
  parseWooCommerceId,
} from "./sku-and-price";
import type {
  ImportIssue,
  NormalizedProductRow,
  RawCsvRow,
  SkippedRow,
} from "./types";

export type NormalizeRowResult =
  | { kind: "skipped"; skipped: SkippedRow }
  | { kind: "invalid"; woocommerceId: number | null; errors: ImportIssue[] }
  | { kind: "ok"; product: NormalizedProductRow; warnings: ImportIssue[] };

/** Normalizes one WooCommerce CSV row into an importable product plan. */
export function normalizeCsvRow(
  row: RawCsvRow,
  options?: { slugConflictWithOtherSku?: boolean },
): NormalizeRowResult {
  const warnings: ImportIssue[] = [];
  const errors: ImportIssue[] = [];

  const idRaw = cell(row, CSV_HEADERS.id);
  const woocommerceId = parseWooCommerceId(idRaw);
  if (woocommerceId == null) {
    return {
      kind: "invalid",
      woocommerceId: null,
      errors: [
        {
          code: "invalid_id",
          message: `Invalid WooCommerce ID: "${idRaw}"`,
        },
      ],
    };
  }

  const titleRaw = cell(row, CSV_HEADERS.name);
  if (isExcludedWooCommerceId(woocommerceId)) {
    return {
      kind: "skipped",
      skipped: {
        woocommerceId,
        title: titleRaw.trim() || "(untitled)",
        reason:
          "Excluded unpublished category-placeholder product (no price/category/image).",
      },
    };
  }

  const csvType = cell(row, CSV_HEADERS.type).trim().toLowerCase();
  if (csvType && csvType !== "simple") {
    errors.push({
      code: "unsupported_product_type",
      message: `Unsupported product type: ${csvType}`,
      woocommerceId,
    });
  }

  const { value: titleHy, truncated: titleTruncated } = normalizeTitle(titleRaw);
  if (!titleHy) {
    errors.push({
      code: "missing_title",
      message: "Product title is required.",
      woocommerceId,
    });
  } else if (titleTruncated) {
    warnings.push({
      code: "title_truncated",
      message: `Title truncated to ${FIELD_LIMITS.title} characters.`,
      woocommerceId,
    });
  }

  const short = normalizeDescriptionText(
    cell(row, CSV_HEADERS.shortDescription),
    FIELD_LIMITS.shortDescription,
  );
  if (short.truncated) {
    warnings.push({
      code: "short_description_truncated",
      message: `Short description truncated to ${FIELD_LIMITS.shortDescription} characters.`,
      woocommerceId,
    });
  }

  const description = normalizeDescriptionText(
    cell(row, CSV_HEADERS.description),
    FIELD_LIMITS.description,
  );
  if (description.truncated) {
    warnings.push({
      code: "description_truncated",
      message: `Description truncated to ${FIELD_LIMITS.description} characters.`,
      woocommerceId,
    });
  }

  const seo = normalizeSeoDescription(
    cell(row, CSV_HEADERS.yoastMetaDescription),
  );
  if (seo.truncated) {
    warnings.push({
      code: "seo_description_truncated",
      message: `SEO description truncated to ${FIELD_LIMITS.seoDescription} characters.`,
      woocommerceId,
    });
  }

  const priceAmount = parseIntegerAmdPrice(cell(row, CSV_HEADERS.regularPrice));
  if (priceAmount == null) {
    errors.push({
      code: "invalid_price",
      message: `Invalid or empty base price: "${cell(row, CSV_HEADERS.regularPrice)}"`,
      woocommerceId,
    });
  }

  const saleRaw = cell(row, CSV_HEADERS.salePrice).trim();
  if (saleRaw) {
    warnings.push({
      code: "sale_price_ignored",
      message: `Sale price present but ignored by migration rules: "${saleRaw}"`,
      woocommerceId,
    });
  }

  const categories = parseWooCommerceCategories(
    cell(row, CSV_HEADERS.categories),
  );
  if (categories.length === 0) {
    warnings.push({
      code: "missing_categories",
      message: "Product has no categories.",
      woocommerceId,
    });
  }

  const parsedImages = parseProductImageUrls(cell(row, CSV_HEADERS.images));
  if (parsedImages.urls.length === 0) {
    warnings.push({
      code: "missing_images",
      message: "Product has no images; will be imported without media.",
      woocommerceId,
    });
  }

  const sku = generateSku(woocommerceId);
  const slugResult = generateProductSlug({
    titleHy: titleHy || `product-${woocommerceId}`,
    woocommerceId,
    conflictWithOtherSku: options?.slugConflictWithOtherSku ?? false,
  });

  const publishedRaw = cell(row, CSV_HEADERS.published);
  const featuredRaw = cell(row, CSV_HEADERS.featured);

  if (errors.length > 0) {
    return { kind: "invalid", woocommerceId, errors };
  }

  const truncatedFields = [
    titleTruncated ? "title" : null,
    short.truncated ? "shortDescription" : null,
    description.truncated ? "description" : null,
    seo.truncated ? "seoDescription" : null,
  ].filter((value): value is string => value != null);

  const product: NormalizedProductRow = {
    woocommerceId,
    sku,
    titleHy,
    shortDescriptionHy: short.value,
    descriptionHy: description.value,
    seoDescriptionHy: seo.value,
    truncatedFields,
    status: mapPublishedStatus(publishedRaw),
    isFeatured: mapFeaturedFlag(featuredRaw),
    priceAmount: priceAmount as number,
    compareAtAmount: null,
    stockOnHand: DEFAULT_IMPORT_STOCK_ON_HAND,
    categories,
    primaryCategory: categories[0] ?? null,
    sourceImageUrls: parsedImages.urls,
    duplicateImageUrlsRemoved: parsedImages.duplicatesRemoved,
    images: parsedImages.urls.map((sourceUrl, index) => ({
      sourceUrl,
      index,
      sourceHash: hashImageSourceUrl(sourceUrl),
      plannedObjectKeyTemplate: buildPlannedImageObjectKeyTemplate({
        woocommerceId,
        index,
        sourceUrl,
      }),
    })),
    slug: slugResult.slug,
    slugFallbackUsed: slugResult.fallbackUsed,
    slugConflictSuffixApplied: slugResult.conflictSuffixApplied,
    csvType: csvType || "simple",
    publishedRaw,
    featuredRaw,
  };

  if (slugResult.fallbackUsed) {
    warnings.push({
      code: "slug_fallback",
      message: `Slug fell back to product-${woocommerceId}.`,
      woocommerceId,
      sku,
    });
  }

  return { kind: "ok", product, warnings };
}
