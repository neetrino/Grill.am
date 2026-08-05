import { slugifyCategoryTitle } from "@/features/categories/domain/slugify";

import { runDryRun } from "./dry-run";
import { getImportDb } from "./db";
import { SlugReservationRegistry } from "./generate-slug";
import { resolveCategoryIdMap } from "./import-category";
import { importProductMedia } from "./import-media";
import {
  syncImportProductCategories,
  upsertImportProduct,
} from "./import-product";
import { applyImportStock } from "./import-stock";
import { emptySummary, writeImportReports } from "./reports";
import { createImportStorage } from "./storage";
import type {
  CategoryPlan,
  CliOptions,
  ImportReport,
  PlannedProduct,
  ProductApplyResult,
} from "./types";

export type ApplyResult = {
  report: ImportReport;
  markdownPath: string;
  jsonPath: string;
};

function assertApplyConfirmed(options: CliOptions): void {
  const envConfirm = process.env.IMPORT_CONFIRMATION === "YES";
  if (options.confirmImport || envConfirm) {
    return;
  }
  throw new Error(
    "Apply mode requires explicit confirmation. Pass --confirm-import or set IMPORT_CONFIRMATION=YES.",
  );
}

/** Applies the WooCommerce import after a blocking-error-free dry-run plan. */
export async function runApply(options: CliOptions): Promise<ApplyResult> {
  assertApplyConfirmed(options);

  // Apply always validates images (GET + bytes). skipImageCheck is ignored here.
  const dry = await runDryRun({ ...options, skipImageCheck: false });
  if (!dry.report.applyReadiness.ready || dry.hasBlockingErrors) {
    const reasons = dry.report.applyReadiness.blockingReasons.join("; ");
    throw new Error(
      `Apply aborted: not apply-ready. ${reasons || "Blocking validation errors exist."}`,
    );
  }

  const planned = dry.report.products.filter(
    (product): product is PlannedProduct =>
      "plannedMutation" in product && product.plannedMutation !== "blocked",
  );

  const duplicateSlugs = new SlugReservationRegistry().findDuplicateFinalSlugs(
    planned,
  );
  if (duplicateSlugs.length > 0) {
    throw new Error(
      `Apply aborted: duplicate final slugs remain: ${duplicateSlugs.join(", ")}`,
    );
  }

  const db = getImportDb();
  const storage = createImportStorage();

  const categoryTitles = [
    ...new Set(planned.flatMap((product) => product.categories)),
  ];
  const slugByTitle = new Map(
    categoryTitles.map((title) => [title, slugifyCategoryTitle(title)]),
  );
  const categoryResolution = await resolveCategoryIdMap(
    db,
    categoryTitles,
    slugByTitle,
  );

  const categoryPlans: CategoryPlan[] = categoryTitles.map((title) => ({
    title,
    slug: slugByTitle.get(title) ?? slugifyCategoryTitle(title),
    existingId: categoryResolution.idByTitle.get(title) ?? null,
    plannedMutation: "reused",
  }));

  for (const plan of dry.report.categories) {
    const match = categoryPlans.find((c) => c.title === plan.title);
    if (match) {
      match.plannedMutation = plan.plannedMutation;
      match.existingId = categoryResolution.idByTitle.get(plan.title) ?? null;
    }
  }

  const results: ProductApplyResult[] = [];
  let productsCreated = 0;
  let productsUpdated = 0;
  let productsUnchanged = 0;
  let productsFailed = 0;
  let categoryLinksCreated = 0;
  let imagesDownloaded = 0;
  let imagesUploadedToR2 = 0;
  let imagesReused = 0;
  let imageFailures = 0;
  let stockValuesApplied = 0;
  const warnings = [...dry.report.warnings];
  const errors = [...dry.report.errors];

  for (const product of planned) {
    try {
      const upserted = await upsertImportProduct(db, product);
      if (upserted.mutation === "created") productsCreated += 1;
      else if (upserted.mutation === "updated") productsUpdated += 1;
      else productsUnchanged += 1;

      const categoryIds = product.categories
        .map((title) => categoryResolution.idByTitle.get(title))
        .filter((id): id is string => Boolean(id));
      categoryLinksCreated += await syncImportProductCategories(
        db,
        upserted.productId,
        categoryIds,
      );

      const stock = await applyImportStock(db, {
        productId: upserted.productId,
        sku: product.sku,
        previousStockOnHand: upserted.previousStockOnHand,
        forceStock: options.forceStock,
      });
      if (stock.applied) stockValuesApplied += 1;

      const media = await importProductMedia(db, storage, {
        productId: upserted.productId,
        woocommerceId: product.woocommerceId,
        sku: product.sku,
        images: product.images,
      });

      imagesDownloaded += media.imagesDownloaded;
      imagesUploadedToR2 += media.imagesUploaded;
      imagesReused += media.imagesReused;
      imageFailures += media.imageFailures.length;
      warnings.push(...media.imageFailures);

      results.push({
        woocommerceId: product.woocommerceId,
        sku: product.sku,
        productId: upserted.productId,
        mutation: upserted.mutation,
        slug: product.slug,
        status: product.status,
        priceAmount: product.priceAmount,
        stockOnHand: stock.stockOnHand,
        categories: product.categories,
        sourceImageUrls: product.sourceImageUrls,
        finalObjectKeys: media.finalObjectKeys,
        imagesUploaded: media.imagesUploaded,
        imagesReused: media.imagesReused,
        imageFailures: media.imageFailures,
        warnings: [...product.warnings, ...media.imageFailures],
        errors: [],
      });
    } catch (error) {
      productsFailed += 1;
      const message =
        error instanceof Error ? error.message : "Product apply failed";
      const issue = {
        code: "product_apply_failed",
        message,
        woocommerceId: product.woocommerceId,
        sku: product.sku,
      };
      errors.push(issue);
      results.push({
        woocommerceId: product.woocommerceId,
        sku: product.sku,
        productId: null,
        mutation: "failed",
        slug: product.slug,
        status: product.status,
        priceAmount: product.priceAmount,
        stockOnHand: product.stockOnHand,
        categories: product.categories,
        sourceImageUrls: product.sourceImageUrls,
        finalObjectKeys: [],
        imagesUploaded: 0,
        imagesReused: 0,
        imageFailures: [],
        warnings: product.warnings,
        errors: [issue],
      });
    }
  }

  const summary = emptySummary({
    csvPath: options.csvPath,
    mode: "apply",
    runTimestamp: new Date().toISOString(),
  });
  summary.totalCsvRows = dry.report.summary.totalCsvRows;
  summary.skippedRows = dry.report.summary.skippedRows;
  summary.validRows = dry.report.summary.validRows;
  summary.invalidRows = dry.report.summary.invalidRows;
  summary.productsPlanned = planned.length;
  summary.productsCreated = productsCreated;
  summary.productsPlannedCreates = dry.report.summary.productsPlannedCreates;
  summary.productsUpdated = productsUpdated;
  summary.productsUnchanged = productsUnchanged;
  summary.productsFailed = productsFailed;
  summary.categoriesCreated = categoryResolution.created;
  summary.categoriesReused = categoryResolution.reused;
  summary.categoryLinksCreated = categoryLinksCreated;
  summary.imagesDiscovered = dry.report.summary.imagesDiscovered;
  summary.uniqueImageUrls = dry.report.summary.uniqueImageUrls;
  summary.duplicateImageUrlsRemoved =
    dry.report.summary.duplicateImageUrlsRemoved;
  summary.imagesDownloaded = imagesDownloaded;
  summary.imagesValidated = dry.report.summary.imagesValidated;
  summary.imagesUploadedToR2 = imagesUploadedToR2;
  summary.imagesReused = imagesReused;
  summary.imageFailures = imageFailures;
  summary.productsWithoutImages = dry.report.summary.productsWithoutImages;
  summary.stockValuesApplied = stockValuesApplied;
  summary.warnings = warnings.length;
  summary.blockingErrors = errors.length;
  summary.duplicateGeneratedSlugs = 0;
  summary.applyReady = productsFailed === 0;

  const report: ImportReport = {
    summary,
    skipped: dry.report.skipped,
    categories: categoryPlans,
    products: results,
    conflicts: dry.report.conflicts,
    warnings,
    errors,
    applyReadiness: {
      ready: productsFailed === 0,
      blockingReasons:
        productsFailed > 0 ? [`${productsFailed} product apply failure(s)`] : [],
      inaccessibleSourceImages: 0,
      duplicateGeneratedSlugs: 0,
      invalidRows: 0,
    },
  };

  const paths = await writeImportReports("apply", report);
  return { report, ...paths };
}
