import { runApply } from "./apply";
import { parseCliArgs, printUsage } from "./cli-args";
import { runDryRun } from "./dry-run";
import { logger } from "@/lib/observability/logger";
import { runVerify } from "./verify";

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    return;
  }

  const options = parseCliArgs(process.argv);
  logger.info("wc_import.start", {
    mode: options.mode,
    csvPath: options.csvPath,
    skipImageCheck: options.skipImageCheck,
  });

  if (options.mode === "dry-run") {
    const result = await runDryRun(options);
    logger.info("wc_import.dry_run.complete", {
      totalCsvRows: result.report.summary.totalCsvRows,
      skippedRows: result.report.summary.skippedRows,
      productsPlanned: result.report.summary.productsPlanned,
      blockingErrors: result.report.summary.blockingErrors,
      warnings: result.report.summary.warnings,
      markdownPath: result.markdownPath,
      jsonPath: result.jsonPath,
    });
    if (result.hasBlockingErrors) {
      process.exitCode = 1;
    }
    return;
  }

  if (options.mode === "apply") {
    const result = await runApply(options);
    logger.info("wc_import.apply.complete", {
      productsCreated: result.report.summary.productsCreated,
      productsUpdated: result.report.summary.productsUpdated,
      productsFailed: result.report.summary.productsFailed,
      imagesUploadedToR2: result.report.summary.imagesUploadedToR2,
      markdownPath: result.markdownPath,
      jsonPath: result.jsonPath,
    });
    if (result.report.summary.productsFailed > 0) {
      process.exitCode = 1;
    }
    return;
  }

  const result = await runVerify(options);
  logger.info("wc_import.verify.complete", {
    expectedImportedProducts: result.report.summary.expectedImportedProducts,
    productsFoundBySku: result.report.summary.productsFoundBySku,
    missingProducts: result.report.summary.missingProducts,
    markdownPath: result.markdownPath,
    jsonPath: result.jsonPath,
  });
}

main().catch((error: unknown) => {
  logger.error("wc_import.failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
