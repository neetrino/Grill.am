import { and, eq, isNull, sql } from "drizzle-orm";

import { mediaAssets, productCategories, products } from "@/db/schema";

import {
  buildCategoryPlans,
  findExistingCategory,
  loadExistingCategories,
  loadExistingProductsBySkus,
} from "./conflicts";
import { DEFAULT_IMPORT_STOCK_ON_HAND } from "./constants";
import { getImportDb } from "./db";
import { normalizeCsvRow } from "./normalize-row";
import { readWooCommerceCsv } from "./read-csv";
import { emptySummary, writeImportReports } from "./reports";
import type {
  CliOptions,
  ImportIssue,
  NormalizedProductRow,
  SkippedRow,
  VerifyProductResult,
  VerifyReportData,
} from "./types";

export type VerifyResult = {
  report: VerifyReportData;
  markdownPath: string;
  jsonPath: string;
};

/** Read-only verification of CSV plan against current DB/media state. */
export async function runVerify(options: CliOptions): Promise<VerifyResult> {
  const csv = await readWooCommerceCsv(options.csvPath);
  const db = getImportDb();

  const skipped: SkippedRow[] = [];
  const planned: NormalizedProductRow[] = [];
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [...csv.warnings];
  const conflicts: ImportIssue[] = [];

  for (const row of csv.rows) {
    const result = normalizeCsvRow(row);
    if (result.kind === "skipped") {
      skipped.push(result.skipped);
      continue;
    }
    if (result.kind === "invalid") {
      errors.push(...result.errors);
      conflicts.push(...result.errors);
      continue;
    }
    planned.push(result.product);
    warnings.push(...result.warnings);
  }

  const bySku = await loadExistingProductsBySkus(
    db,
    planned.map((p) => p.sku),
  );
  const existingCategories = await loadExistingCategories(db);
  const categoryPlans = buildCategoryPlans(
    planned.flatMap((p) => p.categories),
    existingCategories,
  );

  const categoryVerify = categoryPlans.map((plan) => {
    const found = findExistingCategory(existingCategories, plan.title);
    return {
      title: plan.title,
      found: Boolean(found),
      categoryId: found?.id ?? null,
    };
  });

  const productsVerify: VerifyProductResult[] = [];
  let missingProducts = 0;
  let incorrectStatus = 0;
  let incorrectPrice = 0;
  let incorrectStock = 0;
  let missingCategoryLinks = 0;
  let productsWithoutMedia = 0;
  let duplicateMediaRecords = 0;
  let productsMissingPrimaryImage = 0;
  let duplicateSkuConflicts = 0;

  for (const product of planned) {
    const existing = bySku.get(product.sku) ?? null;
    const issues: ImportIssue[] = [];

    if (!existing) {
      missingProducts += 1;
      issues.push({
        code: "missing_product",
        message: `Product SKU ${product.sku} not found in database.`,
        woocommerceId: product.woocommerceId,
        sku: product.sku,
      });
      productsVerify.push({
        woocommerceId: product.woocommerceId,
        sku: product.sku,
        titleHy: product.titleHy,
        found: false,
        productId: null,
        statusOk: false,
        priceOk: false,
        stockOk: false,
        categoriesOk: false,
        mediaCount: 0,
        hasPrimaryImage: false,
        duplicateMedia: false,
        expectedStatus: product.status,
        expectedPrice: product.priceAmount,
        expectedStock: DEFAULT_IMPORT_STOCK_ON_HAND,
        expectedCategories: product.categories,
        issues,
      });
      continue;
    }

    // Detect duplicate SKU rows (schema unique should prevent; still report).
    const [dup] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.sku, product.sku), isNull(products.deletedAt)));
    if ((dup?.count ?? 0) > 1) {
      duplicateSkuConflicts += 1;
      issues.push({
        code: "duplicate_sku",
        message: `Duplicate SKU rows for ${product.sku}.`,
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }

    const statusOk = existing.status === product.status;
    const priceOk = existing.priceAmount === product.priceAmount;
    const stockOk = existing.stockOnHand === DEFAULT_IMPORT_STOCK_ON_HAND;
    if (!statusOk) {
      incorrectStatus += 1;
      issues.push({
        code: "incorrect_status",
        message: `Expected ${product.status}, found ${existing.status}.`,
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }
    if (!priceOk) {
      incorrectPrice += 1;
      issues.push({
        code: "incorrect_price",
        message: `Expected ${product.priceAmount}, found ${existing.priceAmount}.`,
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }
    if (!stockOk) {
      incorrectStock += 1;
      issues.push({
        code: "incorrect_stock",
        message: `Expected ${DEFAULT_IMPORT_STOCK_ON_HAND}, found ${existing.stockOnHand}.`,
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }

    const linked = await db
      .select({ categoryId: productCategories.categoryId })
      .from(productCategories)
      .where(eq(productCategories.productId, existing.id));

    const expectedCategoryIds = product.categories
      .map((title) => findExistingCategory(existingCategories, title)?.id)
      .filter((id): id is string => Boolean(id));
    const linkedIds = new Set(linked.map((row) => row.categoryId));
    const categoriesOk =
      expectedCategoryIds.length === linkedIds.size &&
      expectedCategoryIds.every((id) => linkedIds.has(id));
    if (!categoriesOk) {
      missingCategoryLinks += 1;
      issues.push({
        code: "missing_category_links",
        message: "Product category links do not match CSV categories.",
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }

    const mediaRows = await db
      .select({
        id: mediaAssets.id,
        objectKey: mediaAssets.objectKey,
        isPrimary: mediaAssets.isPrimary,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.productId, existing.id));

    const keyCounts = new Map<string, number>();
    for (const row of mediaRows) {
      keyCounts.set(row.objectKey, (keyCounts.get(row.objectKey) ?? 0) + 1);
    }
    const duplicateMedia = [...keyCounts.values()].some((count) => count > 1);
    if (duplicateMedia) {
      duplicateMediaRecords += 1;
      issues.push({
        code: "duplicate_media",
        message: "Duplicate media object keys for product.",
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }

    const hasPrimaryImage = mediaRows.some((row) => row.isPrimary);
    if (mediaRows.length === 0 && product.sourceImageUrls.length > 0) {
      productsWithoutMedia += 1;
      issues.push({
        code: "missing_media",
        message: "Expected media from CSV images but none found.",
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    } else if (mediaRows.length === 0) {
      productsWithoutMedia += 1;
    }

    if (mediaRows.length > 0 && !hasPrimaryImage) {
      productsMissingPrimaryImage += 1;
      issues.push({
        code: "missing_primary_image",
        message: "Product has media but no primary image.",
        sku: product.sku,
        woocommerceId: product.woocommerceId,
      });
    }

    conflicts.push(...issues.filter((i) => i.code === "duplicate_sku"));
    warnings.push(
      ...issues.filter((i) => i.code !== "duplicate_sku" && i.code !== "missing_product"),
    );
    errors.push(...issues.filter((i) => i.code === "missing_product"));

    productsVerify.push({
      woocommerceId: product.woocommerceId,
      sku: product.sku,
      titleHy: product.titleHy,
      found: true,
      productId: existing.id,
      statusOk,
      priceOk,
      stockOk,
      categoriesOk,
      mediaCount: mediaRows.length,
      hasPrimaryImage,
      duplicateMedia,
      expectedStatus: product.status,
      expectedPrice: product.priceAmount,
      expectedStock: DEFAULT_IMPORT_STOCK_ON_HAND,
      expectedCategories: product.categories,
      issues,
    });
  }

  const base = emptySummary({
    csvPath: options.csvPath,
    mode: "verify",
    runTimestamp: new Date().toISOString(),
  });
  base.totalCsvRows = csv.rows.length;
  base.skippedRows = skipped.length;
  base.validRows = planned.length;
  base.invalidRows = errors.filter((e) => e.code === "invalid_price" || e.code === "missing_title").length;
  base.productsPlanned = planned.length;
  base.categoriesCreated = 0;
  base.categoriesReused = categoryVerify.filter((c) => c.found).length;
  base.imagesDiscovered = planned.reduce((n, p) => n + p.sourceImageUrls.length, 0);
  base.productsWithoutImages = planned.filter((p) => p.sourceImageUrls.length === 0).length;
  base.warnings = warnings.length;
  base.blockingErrors = errors.length;

  const report: VerifyReportData = {
    summary: {
      ...base,
      expectedImportedProducts: planned.length,
      productsFoundBySku: productsVerify.filter((p) => p.found).length,
      missingProducts,
      duplicateSkuConflicts,
      expectedCategories: categoryVerify.length,
      missingCategories: categoryVerify.filter((c) => !c.found).length,
      incorrectStatus,
      incorrectPrice,
      incorrectStock,
      missingCategoryLinks,
      productsWithoutMedia,
      duplicateMediaRecords,
      productsMissingPrimaryImage,
    },
    skipped,
    categories: categoryVerify,
    products: productsVerify,
    conflicts,
    warnings,
    errors,
    applyReadiness: {
      ready: missingProducts === 0 && duplicateSkuConflicts === 0,
      blockingReasons: [
        ...(missingProducts > 0 ? [`${missingProducts} missing product(s)`] : []),
        ...(duplicateSkuConflicts > 0
          ? [`${duplicateSkuConflicts} duplicate SKU conflict(s)`]
          : []),
      ],
      inaccessibleSourceImages: 0,
      duplicateGeneratedSlugs: 0,
      invalidRows: base.invalidRows,
    },
  };

  const paths = await writeImportReports("verify", report);
  return { report, ...paths };
}
