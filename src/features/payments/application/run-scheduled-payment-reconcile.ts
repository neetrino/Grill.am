import "server-only";

import {
  expirePaymentAttempt,
  listExpiredPendingPaymentIds,
} from "@/features/payments/application/expire-payment-attempt";
import {
  reconcileArcaPayments,
  type ArcaReconcileSummary,
} from "@/features/payments/providers/arca/reconcile-arca-payments";
import { getArcaConfig } from "@/lib/payments/arca/config";
import { logger } from "@/lib/observability/logger";

export type ScheduledPaymentReconcileSummary = {
  arca: ArcaReconcileSummary | null;
  expired: {
    scanned: number;
    expired: number;
    skipped: number;
    errors: number;
  };
};

/**
 * Cron/ops job: ask ARCA for authoritative status, then expire local TTLs.
 * Idempotent; never downgrades CAPTURED.
 */
export async function runScheduledPaymentReconcile(): Promise<ScheduledPaymentReconcileSummary> {
  let arca: ArcaReconcileSummary | null = null;

  if (getArcaConfig()) {
    arca = await reconcileArcaPayments();
    logger.info("payments.reconcile.arca_summary", {
      provider: "arca",
      scanned: arca.scanned,
      processed: arca.processed,
      captured: arca.captured,
      failed: arca.failed,
      pending: arca.pending,
      review: arca.review,
      errors: arca.errors,
    });
  } else {
    logger.info("payments.reconcile.arca_skipped", {
      provider: "arca",
      reason: "arca_config_unavailable",
    });
  }

  const expiredIds = await listExpiredPendingPaymentIds(100);
  const expiredSummary = {
    scanned: expiredIds.length,
    expired: 0,
    skipped: 0,
    errors: 0,
  };

  for (const paymentId of expiredIds) {
    try {
      const result = await expirePaymentAttempt({ paymentId });
      if (result.type === "expired") {
        expiredSummary.expired += 1;
      } else {
        expiredSummary.skipped += 1;
      }
    } catch {
      expiredSummary.errors += 1;
      logger.error("payments.reconcile.expire_error", {
        paymentId,
        errorCode: "PAYMENT_EXPIRE_ERROR",
      });
    }
  }

  logger.info("payments.reconcile.expire_summary", expiredSummary);

  return { arca, expired: expiredSummary };
}
