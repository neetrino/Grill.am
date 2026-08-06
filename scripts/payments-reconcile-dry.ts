import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

/**
 * Read-only payment reconciliation report for operators.
 * Never prints credentials, guest tokens, or raw provider bodies.
 */
async function main(): Promise<void> {
  const { reconcilePaymentsDry } = await import(
    "@/features/payments/application/reconcile-payments-dry"
  );
  const { logger } = await import("@/lib/observability/logger");

  const report = await reconcilePaymentsDry();
  logger.info("payments.reconcile.dry", {
    pending: report.counts.pending_beyond_threshold,
    failedMayBePaid: report.counts.failed_may_be_paid,
    requiresReview: report.counts.requires_review,
    missingNotification: report.counts.missing_capture_notification,
    outboxFailed: report.counts.outbox_permanently_failed,
    totalCandidates: report.candidates.length,
  });
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.name : "UNKNOWN",
    }),
  );
  process.exitCode = 1;
});
