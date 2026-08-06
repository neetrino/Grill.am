import { reconcileArcaPayments } from "@/features/payments/providers/arca/reconcile-arca-payments";
import { logger } from "@/lib/observability/logger";

async function main(): Promise<void> {
  const summary = await reconcileArcaPayments();
  logger.info("arca.reconcile.summary", {
    provider: "arca",
    scanned: summary.scanned,
    processed: summary.processed,
    captured: summary.captured,
    failed: summary.failed,
    pending: summary.pending,
    review: summary.review,
    errors: summary.errors,
  });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error: unknown) => {
  logger.error("arca.reconcile.fatal", {
    provider: "arca",
    errorCode: error instanceof Error ? error.name : "UNKNOWN",
  });
  process.exitCode = 1;
});
