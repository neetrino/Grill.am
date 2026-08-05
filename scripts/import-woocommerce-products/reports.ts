import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { REPORTS_DIR } from "./constants";
import type {
  ApplyReadiness,
  ImportMode,
  ImportReport,
  ImportSummary,
  VerifyReportData,
} from "./types";

function reportBaseName(mode: ImportMode): string {
  if (mode === "dry-run") return "dry-run-report";
  if (mode === "apply") return "apply-report";
  return "verify-report";
}

function formatSummaryMarkdown(summary: ImportSummary): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(summary)) {
    if (key === "productsCreated" && summary.mode === "dry-run") {
      lines.push(
        `- **productsCreated (planned creates)**: ${String(value)}`,
      );
      continue;
    }
    lines.push(`- **${key}**: ${String(value)}`);
  }
  return lines.join("\n");
}

function formatApplyReadiness(readiness: ApplyReadiness): string {
  const lines = [
    `- **ready**: ${readiness.ready}`,
    `- **blocking reasons**: ${
      readiness.blockingReasons.length > 0
        ? readiness.blockingReasons.join("; ")
        : "(none)"
    }`,
    `- **inaccessible source images**: ${readiness.inaccessibleSourceImages}`,
    `- **duplicate generated slugs**: ${readiness.duplicateGeneratedSlugs}`,
    `- **invalid rows**: ${readiness.invalidRows}`,
  ];
  return lines.join("\n");
}

function toMarkdown(report: ImportReport | VerifyReportData): string {
  const lines: string[] = [];
  lines.push(`# WooCommerce product import — ${report.summary.mode}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(formatSummaryMarkdown(report.summary));
  lines.push("");

  lines.push("## Skipped rows");
  lines.push("");
  if (report.skipped.length === 0) {
    lines.push("_None_");
  } else {
    for (const row of report.skipped) {
      lines.push(
        `- WC ID **${row.woocommerceId}** — ${row.title}: ${row.reason}`,
      );
    }
  }
  lines.push("");

  if ("categories" in report && Array.isArray(report.categories)) {
    lines.push("## Categories");
    lines.push("");
    for (const category of report.categories) {
      if ("plannedMutation" in category) {
        lines.push(
          `- ${category.title} → slug \`${category.slug}\` (${category.plannedMutation}${category.existingId ? `, id ${category.existingId}` : ""})`,
        );
      } else {
        lines.push(
          `- ${category.title}: ${category.found ? `found (${category.categoryId})` : "missing"}`,
        );
      }
    }
    lines.push("");
  }

  lines.push("## Products");
  lines.push("");
  for (const product of report.products) {
    if ("sku" in product && "titleHy" in product && "plannedMutation" in product) {
      lines.push(`### ${product.sku} — ${product.titleHy}`);
      lines.push("");
      lines.push(`- WooCommerce ID: ${product.woocommerceId}`);
      lines.push(`- Slug: \`${product.slug}\``);
      lines.push(`- Status: ${product.status}`);
      lines.push(`- Price: ${product.priceAmount}`);
      lines.push(`- Stock: ${product.stockOnHand}`);
      lines.push(`- Categories: ${product.categories.join(" | ") || "(none)"}`);
      lines.push(
        `- Images: ${product.sourceImageUrls.length} source URL(s); duplicates removed: ${product.duplicateImageUrlsRemoved}; validated: ${product.imagesValidatedCount}`,
      );
      if (product.imageValidations.length > 0) {
        for (const image of product.imageValidations) {
          lines.push(
            `  - [${image.status}] ${image.sourceUrl}${image.serverHint ? ` (${image.serverHint})` : ""}`,
          );
        }
      }
      lines.push(`- Planned mutation: ${product.plannedMutation}`);
      if (product.warnings.length > 0) {
        lines.push(
          `- Warnings: ${product.warnings.map((w) => w.message).join("; ")}`,
        );
      }
      if (product.errors.length > 0) {
        lines.push(
          `- Errors: ${product.errors.map((e) => e.message).join("; ")}`,
        );
      }
      lines.push("");
    } else if ("mutation" in product) {
      lines.push(`### ${product.sku}`);
      lines.push("");
      lines.push(`- WooCommerce ID: ${product.woocommerceId}`);
      lines.push(`- Product ID: ${product.productId ?? "(none)"}`);
      lines.push(`- Mutation: ${product.mutation}`);
      lines.push(`- Slug: \`${product.slug}\``);
      lines.push(`- Status: ${product.status}`);
      lines.push(`- Price: ${product.priceAmount}`);
      lines.push(`- Stock: ${product.stockOnHand}`);
      lines.push(`- Categories: ${product.categories.join(" | ") || "(none)"}`);
      lines.push(
        `- R2 keys: ${product.finalObjectKeys.join(", ") || "(none)"}`,
      );
      lines.push(
        `- Images uploaded/reused: ${product.imagesUploaded}/${product.imagesReused}`,
      );
      if (product.imageFailures.length > 0) {
        lines.push(
          `- Image failures: ${product.imageFailures.map((f) => f.message).join("; ")}`,
        );
      }
      lines.push("");
    } else if ("found" in product) {
      lines.push(`### ${product.sku} — ${product.titleHy}`);
      lines.push("");
      lines.push(`- Found: ${product.found}`);
      lines.push(`- Product ID: ${product.productId ?? "(missing)"}`);
      lines.push(`- Status OK: ${product.statusOk}`);
      lines.push(`- Price OK: ${product.priceOk}`);
      lines.push(`- Stock OK: ${product.stockOk}`);
      lines.push(`- Categories OK: ${product.categoriesOk}`);
      lines.push(`- Media count: ${product.mediaCount}`);
      lines.push(`- Has primary: ${product.hasPrimaryImage}`);
      lines.push(`- Duplicate media: ${product.duplicateMedia}`);
      if (product.issues.length > 0) {
        lines.push(
          `- Issues: ${product.issues.map((i) => i.message).join("; ")}`,
        );
      }
      lines.push("");
    }
  }

  lines.push("## Conflicts");
  lines.push("");
  if (report.conflicts.length === 0) {
    lines.push("_None_");
  } else {
    for (const issue of report.conflicts) {
      lines.push(
        `- [${issue.code}] ${issue.message}${issue.woocommerceId != null ? ` (WC ${issue.woocommerceId})` : ""}`,
      );
    }
  }
  lines.push("");

  lines.push("## Warnings");
  lines.push("");
  if (report.warnings.length === 0) {
    lines.push("_None_");
  } else {
    for (const issue of report.warnings) {
      lines.push(`- [${issue.code}] ${issue.message}`);
    }
  }
  lines.push("");

  lines.push("## Blocking errors");
  lines.push("");
  if (report.errors.length === 0) {
    lines.push("_None_");
  } else {
    for (const issue of report.errors) {
      lines.push(`- [${issue.code}] ${issue.message}`);
    }
  }
  lines.push("");

  lines.push("## Apply readiness");
  lines.push("");
  lines.push(formatApplyReadiness(report.applyReadiness));
  lines.push("");

  return lines.join("\n");
}

/** Writes Markdown + JSON reports under reports/woocommerce-product-import/. */
export async function writeImportReports(
  mode: ImportMode,
  report: ImportReport | VerifyReportData,
): Promise<{ markdownPath: string; jsonPath: string }> {
  await mkdir(REPORTS_DIR, { recursive: true });
  const base = reportBaseName(mode);
  const markdownPath = path.join(REPORTS_DIR, `${base}.md`);
  const jsonPath = path.join(REPORTS_DIR, `${base}.json`);

  await writeFile(markdownPath, toMarkdown(report), "utf8");
  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");

  return { markdownPath, jsonPath };
}

export function emptyApplyReadiness(): ApplyReadiness {
  return {
    ready: false,
    blockingReasons: [],
    inaccessibleSourceImages: 0,
    duplicateGeneratedSlugs: 0,
    invalidRows: 0,
  };
}

export function emptySummary(
  partial: Pick<ImportSummary, "csvPath" | "mode" | "runTimestamp">,
): ImportSummary {
  return {
    ...partial,
    totalCsvRows: 0,
    skippedRows: 0,
    validRows: 0,
    invalidRows: 0,
    productsPlanned: 0,
    productsCreated: 0,
    productsPlannedCreates: 0,
    productsUpdated: 0,
    productsUnchanged: 0,
    productsFailed: 0,
    categoriesCreated: 0,
    categoriesReused: 0,
    categoryLinksCreated: 0,
    imagesDiscovered: 0,
    uniqueImageUrls: 0,
    duplicateImageUrlsRemoved: 0,
    imagesDownloaded: 0,
    imagesValidated: 0,
    imagesUploadedToR2: 0,
    imagesReused: 0,
    imageFailures: 0,
    imageHttp403: 0,
    imageHttp404: 0,
    imageTimeouts: 0,
    imageInvalidMime: 0,
    imageOversized: 0,
    imageCorrupted: 0,
    productsWithoutImages: 0,
    stockValuesApplied: 0,
    warnings: 0,
    blockingErrors: 0,
    duplicateGeneratedSlugs: 0,
    applyReady: false,
  };
}
