import {
  buildCategoryPlans,
  buildProductConflictCheck,
  loadAllExistingProductSlugs,
  loadExistingCategories,
  loadExistingProductsBySkus,
} from "./conflicts";
import { DEFAULT_IMPORT_STOCK_ON_HAND } from "./constants";
import { mapWithConcurrency } from "./concurrency";
import { getImportDb } from "./db";
import {
  type DownloadImageResult,
  validateRemoteImage,
} from "./download-image";
import { SlugReservationRegistry } from "./generate-slug";
import { normalizeCsvRow } from "./normalize-row";
import { readWooCommerceCsv } from "./read-csv";
import { emptySummary, writeImportReports } from "./reports";
import type {
  ApplyReadiness,
  CategoryPlan,
  CliOptions,
  ImageValidationResult,
  ImageValidationStatus,
  ImportIssue,
  ImportReport,
  NormalizedProductRow,
  PlannedProduct,
  SkippedRow,
} from "./types";

export type DryRunResult = {
  report: ImportReport;
  markdownPath: string;
  jsonPath: string;
  hasBlockingErrors: boolean;
};

const BLOCKING_CODES = new Set([
  "invalid_price",
  "missing_title",
  "unsupported_product_type",
  "invalid_id",
  "slug_conflict",
  "duplicate_slug",
  "inaccessible_images",
]);

function collectCategoryTitles(products: NormalizedProductRow[]): string[] {
  const titles: string[] = [];
  for (const product of products) {
    for (const title of product.categories) {
      titles.push(title);
    }
  }
  return titles;
}

function mapDownloadToValidation(
  sourceUrl: string,
  result: DownloadImageResult,
): ImageValidationResult {
  if (result.ok) {
    return {
      sourceUrl,
      status: "validated",
      message: `Validated ${result.image.mimeType} (${result.image.byteSize} bytes)`,
      serverHint: result.serverHint,
    };
  }
  return {
    sourceUrl,
    status: result.code as ImageValidationStatus,
    message: result.error,
    serverHint: result.serverHint,
  };
}

function buildApplyReadiness(input: {
  errors: ImportIssue[];
  invalidRows: number;
  duplicateSlugs: string[];
  inaccessibleImageCount: number;
  allowImageFailures: boolean;
}): ApplyReadiness {
  const blockingReasons: string[] = [];
  const blocking = input.errors.filter((e) => BLOCKING_CODES.has(e.code));

  if (input.invalidRows > 0) {
    blockingReasons.push(`${input.invalidRows} invalid CSV row(s)`);
  }
  if (input.duplicateSlugs.length > 0) {
    blockingReasons.push(
      `Duplicate generated slugs: ${input.duplicateSlugs.join(", ")}`,
    );
  }
  if (input.inaccessibleImageCount > 0 && !input.allowImageFailures) {
    blockingReasons.push(
      `${input.inaccessibleImageCount} inaccessible source image URL(s)`,
    );
  }
  for (const error of blocking) {
    if (!blockingReasons.includes(error.message)) {
      blockingReasons.push(error.message);
    }
  }

  return {
    ready: blockingReasons.length === 0,
    blockingReasons,
    inaccessibleSourceImages: input.inaccessibleImageCount,
    duplicateGeneratedSlugs: input.duplicateSlugs.length,
    invalidRows: input.invalidRows,
  };
}

/** Builds the full dry-run migration plan (read-only DB + GET image validation). */
export async function runDryRun(options: CliOptions): Promise<DryRunResult> {
  const csv = await readWooCommerceCsv(options.csvPath);
  const db = getImportDb();

  const skipped: SkippedRow[] = [];
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [...csv.warnings];
  const conflicts: ImportIssue[] = [];
  const validProducts: Array<{
    product: NormalizedProductRow;
    rowWarnings: ImportIssue[];
  }> = [];
  let invalidRows = 0;

  for (const row of csv.rows) {
    const result = normalizeCsvRow(row);
    if (result.kind === "skipped") {
      skipped.push(result.skipped);
      continue;
    }
    if (result.kind === "invalid") {
      invalidRows += 1;
      errors.push(...result.errors);
      conflicts.push(...result.errors);
      continue;
    }
    validProducts.push({
      product: result.product,
      rowWarnings: result.warnings,
    });
  }

  const bySku = await loadExistingProductsBySkus(
    db,
    validProducts.map((entry) => entry.product.sku),
  );
  const existingCategories = await loadExistingCategories(db);
  const categoryPlans: CategoryPlan[] = buildCategoryPlans(
    collectCategoryTitles(validProducts.map((entry) => entry.product)),
    existingCategories,
  );

  const slugRegistry = new SlugReservationRegistry();
  slugRegistry.seedExisting(await loadAllExistingProductSlugs(db));

  const planned: PlannedProduct[] = [];

  for (const entry of validProducts) {
    const productWarnings = [...entry.rowWarnings];
    const productErrors: ImportIssue[] = [];

    const allocated = slugRegistry.allocate({
      titleHy: entry.product.titleHy,
      woocommerceId: entry.product.woocommerceId,
      sku: entry.product.sku,
    });

    const working: NormalizedProductRow = {
      ...entry.product,
      slug: allocated.slug,
      slugFallbackUsed: allocated.fallbackUsed,
      slugConflictSuffixApplied: allocated.conflictSuffixApplied,
    };

    if (allocated.conflictSuffixApplied) {
      productWarnings.push({
        code: "slug_conflict_suffix",
        message: `Slug conflict resolved with suffix; using ${working.slug}.`,
        woocommerceId: working.woocommerceId,
        sku: working.sku,
      });
    }

    const conflictsCheck = await buildProductConflictCheck(db, working, bySku);

    if (conflictsCheck.slugOwnedByOtherSku) {
      productErrors.push({
        code: "slug_conflict",
        message: `Slug "${working.slug}" still owned by another SKU (${conflictsCheck.slugOwnerSku}).`,
        woocommerceId: working.woocommerceId,
        sku: working.sku,
      });
      conflicts.push(...productErrors);
    }

    let plannedMutation: PlannedProduct["plannedMutation"] = "created";
    if (productErrors.length > 0) {
      plannedMutation = "blocked";
    } else if (conflictsCheck.existingProductId) {
      const unchanged =
        conflictsCheck.existingPriceAmount === working.priceAmount &&
        conflictsCheck.existingStatus === working.status &&
        conflictsCheck.existingStockOnHand === DEFAULT_IMPORT_STOCK_ON_HAND &&
        conflictsCheck.hasImportStockMovement;
      plannedMutation = unchanged ? "unchanged" : "updated";
    }

    planned.push({
      ...working,
      conflicts: conflictsCheck,
      warnings: productWarnings,
      errors: productErrors,
      plannedMutation,
      imageValidations: [],
      imagesValidatedCount: 0,
    });

    warnings.push(...productWarnings);
    errors.push(...productErrors);
  }

  const validationCache = new Map<string, DownloadImageResult>();
  let imagesValidated = 0;
  let imageHttp403 = 0;
  let imageHttp404 = 0;
  let imageTimeouts = 0;
  let imageInvalidMime = 0;
  let imageOversized = 0;
  let imageCorrupted = 0;
  let imageFailures = 0;

  if (!options.skipImageCheck) {
    const uniqueUrls = [
      ...new Set(planned.flatMap((product) => product.sourceImageUrls)),
    ];

    await mapWithConcurrency(
      uniqueUrls,
      options.imageConcurrency,
      async (url) => {
        const result = await validateRemoteImage(url);
        validationCache.set(url, result);
        return result;
      },
    );

    for (const product of planned) {
      const validations: ImageValidationResult[] = [];
      for (const url of product.sourceImageUrls) {
        const cached = validationCache.get(url);
        if (!cached) {
          validations.push({
            sourceUrl: url,
            status: "network_error",
            message: "Missing validation result",
            serverHint: null,
          });
          continue;
        }
        const mapped = mapDownloadToValidation(url, cached);
        validations.push(mapped);

        if (mapped.status === "validated") {
          imagesValidated += 1;
        } else {
          imageFailures += 1;
          if (mapped.status === "http_403") imageHttp403 += 1;
          else if (mapped.status === "http_404") imageHttp404 += 1;
          else if (mapped.status === "timeout") imageTimeouts += 1;
          else if (mapped.status === "invalid_mime") imageInvalidMime += 1;
          else if (mapped.status === "oversized_image") imageOversized += 1;
          else if (mapped.status === "corrupted_image") imageCorrupted += 1;

          const issue: ImportIssue = {
            code: mapped.status,
            message: `${mapped.message}: ${url}`,
            woocommerceId: product.woocommerceId,
            sku: product.sku,
          };
          product.warnings.push(issue);
          warnings.push(issue);
          if (mapped.status === "http_403" || mapped.status === "http_404") {
            conflicts.push(issue);
          }
        }
      }

      product.imageValidations = validations;
      product.imagesValidatedCount = validations.filter(
        (v) => v.status === "validated",
      ).length;

      if (
        product.sourceImageUrls.length > 0 &&
        product.imagesValidatedCount === 0
      ) {
        const issue: ImportIssue = {
          code: "inaccessible_images",
          message: `All ${product.sourceImageUrls.length} source image URL(s) failed validation.`,
          woocommerceId: product.woocommerceId,
          sku: product.sku,
        };
        if (options.allowImageFailures) {
          product.warnings.push(issue);
          warnings.push(issue);
        } else {
          product.errors.push(issue);
          errors.push(issue);
          conflicts.push(issue);
          product.plannedMutation = "blocked";
        }
      }
    }
  }

  const duplicateSlugs = slugRegistry.findDuplicateFinalSlugs(planned);
  if (duplicateSlugs.length > 0) {
    for (const slug of duplicateSlugs) {
      const issue: ImportIssue = {
        code: "duplicate_slug",
        message: `Duplicate final slug among planned products: ${slug}`,
      };
      errors.push(issue);
      conflicts.push(issue);
    }
    for (const product of planned) {
      if (duplicateSlugs.includes(product.slug)) {
        product.errors.push({
          code: "duplicate_slug",
          message: `Duplicate final slug: ${product.slug}`,
          woocommerceId: product.woocommerceId,
          sku: product.sku,
        });
        product.plannedMutation = "blocked";
      }
    }
  }

  const uniqueImageUrls = new Set(
    planned.flatMap((product) => product.sourceImageUrls),
  ).size;
  const inaccessibleImageCount = [...validationCache.values()].filter(
    (result) => !result.ok,
  ).length;

  const applyReadiness = buildApplyReadiness({
    errors,
    invalidRows,
    duplicateSlugs,
    inaccessibleImageCount: options.skipImageCheck ? 0 : inaccessibleImageCount,
    allowImageFailures: options.allowImageFailures,
  });

  const summary = emptySummary({
    csvPath: options.csvPath,
    mode: "dry-run",
    runTimestamp: new Date().toISOString(),
  });
  summary.totalCsvRows = csv.rows.length;
  summary.skippedRows = skipped.length;
  summary.validRows = planned.filter((p) => p.errors.length === 0).length;
  summary.invalidRows =
    invalidRows + planned.filter((p) => p.errors.length > 0).length;
  summary.productsPlanned = planned.filter(
    (p) => p.plannedMutation !== "blocked",
  ).length;
  summary.productsPlannedCreates = planned.filter(
    (p) => p.plannedMutation === "created",
  ).length;
  summary.productsCreated = summary.productsPlannedCreates;
  summary.productsUpdated = planned.filter(
    (p) => p.plannedMutation === "updated",
  ).length;
  summary.productsUnchanged = planned.filter(
    (p) => p.plannedMutation === "unchanged",
  ).length;
  summary.categoriesCreated = categoryPlans.filter(
    (c) => c.plannedMutation === "created",
  ).length;
  summary.categoriesReused = categoryPlans.filter(
    (c) => c.plannedMutation === "reused",
  ).length;
  summary.imagesDiscovered = planned.reduce(
    (n, p) => n + p.sourceImageUrls.length,
    0,
  );
  summary.uniqueImageUrls = uniqueImageUrls;
  summary.duplicateImageUrlsRemoved = planned.reduce(
    (n, p) => n + p.duplicateImageUrlsRemoved,
    0,
  );
  summary.imagesDownloaded = imagesValidated;
  summary.imagesValidated = imagesValidated;
  summary.imageFailures = imageFailures;
  summary.imageHttp403 = imageHttp403;
  summary.imageHttp404 = imageHttp404;
  summary.imageTimeouts = imageTimeouts;
  summary.imageInvalidMime = imageInvalidMime;
  summary.imageOversized = imageOversized;
  summary.imageCorrupted = imageCorrupted;
  summary.productsWithoutImages = planned.filter(
    (p) => p.sourceImageUrls.length === 0,
  ).length;
  summary.stockValuesApplied = planned.filter(
    (p) => p.plannedMutation !== "blocked",
  ).length;
  summary.warnings = warnings.length;
  summary.blockingErrors = errors.filter((e) => BLOCKING_CODES.has(e.code)).length;
  summary.duplicateGeneratedSlugs = duplicateSlugs.length;
  summary.applyReady = applyReadiness.ready;

  const report: ImportReport = {
    summary,
    skipped,
    categories: categoryPlans,
    products: planned,
    conflicts,
    warnings,
    errors,
    applyReadiness,
  };

  const paths = await writeImportReports("dry-run", report);
  return {
    report,
    ...paths,
    hasBlockingErrors: !applyReadiness.ready,
  };
}
