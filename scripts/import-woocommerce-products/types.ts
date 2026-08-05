export type ImportMode = "dry-run" | "apply" | "verify";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type ProductMutationResult = "created" | "updated" | "unchanged";

export type CategoryMutationResult = "created" | "reused";

export type ImportIssue = {
  code: string;
  message: string;
  woocommerceId?: number;
  sku?: string;
};

export type RawCsvRow = Record<string, string>;

export type ParsedImagePlan = {
  sourceUrl: string;
  index: number;
  sourceHash: string;
  plannedObjectKeyTemplate: string;
};

export type ImageValidationStatus =
  | "validated"
  | "http_403"
  | "http_404"
  | "http_error"
  | "timeout"
  | "invalid_mime"
  | "oversized_image"
  | "corrupted_image"
  | "network_error"
  | "skipped";

export type ImageValidationResult = {
  sourceUrl: string;
  status: ImageValidationStatus;
  message: string;
  serverHint: string | null;
};

export type NormalizedProductRow = {
  woocommerceId: number;
  sku: string;
  titleHy: string;
  shortDescriptionHy: string | null;
  descriptionHy: string | null;
  seoDescriptionHy: string | null;
  truncatedFields: string[];
  status: ProductStatus;
  isFeatured: boolean;
  priceAmount: number;
  compareAtAmount: null;
  stockOnHand: number;
  categories: string[];
  primaryCategory: string | null;
  sourceImageUrls: string[];
  duplicateImageUrlsRemoved: number;
  images: ParsedImagePlan[];
  slug: string;
  slugFallbackUsed: boolean;
  slugConflictSuffixApplied: boolean;
  csvType: string;
  publishedRaw: string;
  featuredRaw: string;
};

export type SkippedRow = {
  woocommerceId: number;
  title: string;
  reason: string;
};

export type ProductConflictCheck = {
  existingProductId: string | null;
  existingSkuOwnerId: string | null;
  slugOwnedByOtherSku: boolean;
  slugOwnerSku: string | null;
  existingStockOnHand: number | null;
  existingStatus: ProductStatus | null;
  existingPriceAmount: number | null;
  hasImportStockMovement: boolean;
  existingCategoryIds: string[];
  existingMediaObjectKeys: string[];
};

export type PlannedProduct = NormalizedProductRow & {
  conflicts: ProductConflictCheck;
  warnings: ImportIssue[];
  errors: ImportIssue[];
  plannedMutation: ProductMutationResult | "blocked";
  imageValidations: ImageValidationResult[];
  imagesValidatedCount: number;
};

export type CategoryPlan = {
  title: string;
  slug: string;
  existingId: string | null;
  plannedMutation: CategoryMutationResult;
};

export type ProductApplyResult = {
  woocommerceId: number;
  sku: string;
  productId: string | null;
  mutation: ProductMutationResult | "failed" | "skipped";
  slug: string;
  status: ProductStatus;
  priceAmount: number;
  stockOnHand: number;
  categories: string[];
  sourceImageUrls: string[];
  finalObjectKeys: string[];
  imagesUploaded: number;
  imagesReused: number;
  imageFailures: ImportIssue[];
  warnings: ImportIssue[];
  errors: ImportIssue[];
};

export type ApplyReadiness = {
  ready: boolean;
  blockingReasons: string[];
  inaccessibleSourceImages: number;
  duplicateGeneratedSlugs: number;
  invalidRows: number;
};

export type ImportSummary = {
  csvPath: string;
  mode: ImportMode;
  runTimestamp: string;
  totalCsvRows: number;
  skippedRows: number;
  validRows: number;
  invalidRows: number;
  productsPlanned: number;
  /** In dry-run: planned creates. In apply: actual creates. */
  productsCreated: number;
  productsPlannedCreates: number;
  productsUpdated: number;
  productsUnchanged: number;
  productsFailed: number;
  categoriesCreated: number;
  categoriesReused: number;
  categoryLinksCreated: number;
  imagesDiscovered: number;
  uniqueImageUrls: number;
  duplicateImageUrlsRemoved: number;
  imagesDownloaded: number;
  imagesValidated: number;
  imagesUploadedToR2: number;
  imagesReused: number;
  imageFailures: number;
  imageHttp403: number;
  imageHttp404: number;
  imageTimeouts: number;
  imageInvalidMime: number;
  imageOversized: number;
  imageCorrupted: number;
  productsWithoutImages: number;
  stockValuesApplied: number;
  warnings: number;
  blockingErrors: number;
  duplicateGeneratedSlugs: number;
  applyReady: boolean;
};

export type ImportReport = {
  summary: ImportSummary;
  skipped: SkippedRow[];
  categories: CategoryPlan[];
  products: Array<
    PlannedProduct | ProductApplyResult | VerifyProductResult
  >;
  conflicts: ImportIssue[];
  warnings: ImportIssue[];
  errors: ImportIssue[];
  applyReadiness: ApplyReadiness;
};

export type VerifyProductResult = {
  woocommerceId: number;
  sku: string;
  titleHy: string;
  found: boolean;
  productId: string | null;
  statusOk: boolean;
  priceOk: boolean;
  stockOk: boolean;
  categoriesOk: boolean;
  mediaCount: number;
  hasPrimaryImage: boolean;
  duplicateMedia: boolean;
  expectedStatus: ProductStatus;
  expectedPrice: number;
  expectedStock: number;
  expectedCategories: string[];
  issues: ImportIssue[];
};

export type VerifyReportData = {
  summary: ImportSummary & {
    expectedImportedProducts: number;
    productsFoundBySku: number;
    missingProducts: number;
    duplicateSkuConflicts: number;
    expectedCategories: number;
    missingCategories: number;
    incorrectStatus: number;
    incorrectPrice: number;
    incorrectStock: number;
    missingCategoryLinks: number;
    productsWithoutMedia: number;
    duplicateMediaRecords: number;
    productsMissingPrimaryImage: number;
  };
  skipped: SkippedRow[];
  categories: Array<{
    title: string;
    found: boolean;
    categoryId: string | null;
  }>;
  products: VerifyProductResult[];
  conflicts: ImportIssue[];
  warnings: ImportIssue[];
  errors: ImportIssue[];
  applyReadiness: ApplyReadiness;
};

export type CliOptions = {
  mode: ImportMode;
  csvPath: string;
  confirmImport: boolean;
  skipImageCheck: boolean;
  allowImageFailures: boolean;
  forceStock: boolean;
  imageConcurrency: number;
};
