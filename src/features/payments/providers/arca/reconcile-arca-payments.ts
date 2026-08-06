import "server-only";

import { and, asc, eq, lt, or } from "drizzle-orm";

import { payments } from "@/db/schema";
import { getDb } from "@/db/client";
import { processArcaPaymentStatus } from "@/features/payments/providers/arca/process-arca-status";
import { readArcaPaymentMetadata } from "@/features/payments/providers/arca/metadata";
import { requireArcaConfig } from "@/lib/payments/arca/config";
import { logger } from "@/lib/observability/logger";
import { redactProviderReference } from "@/lib/payments/arca/redaction";

export type ArcaReconcileSummary = {
  scanned: number;
  processed: number;
  captured: number;
  failed: number;
  pending: number;
  review: number;
  errors: number;
};

const DEFAULT_MIN_AGE_MS = 5 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 25;

/**
 * Reconciles pending/uncertain ARCA attempts older than a safe delay.
 * Idempotent; skips CAPTURED and other terminal attempts.
 */
export async function reconcileArcaPayments(options?: {
  minAgeMs?: number;
  batchSize?: number;
  now?: Date;
}): Promise<ArcaReconcileSummary> {
  requireArcaConfig();

  const minAgeMs = options?.minAgeMs ?? DEFAULT_MIN_AGE_MS;
  const batchSize = Math.min(options?.batchSize ?? DEFAULT_BATCH_SIZE, 100);
  const now = options?.now ?? new Date();
  const cutoff = new Date(now.getTime() - minAgeMs);

  const candidates = await getDb()
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.provider, "arca"),
        or(eq(payments.status, "PENDING"), eq(payments.status, "AUTHORIZED")),
        lt(payments.createdAt, cutoff),
      ),
    )
    .orderBy(asc(payments.createdAt))
    .limit(batchSize);

  const summary: ArcaReconcileSummary = {
    scanned: candidates.length,
    processed: 0,
    captured: 0,
    failed: 0,
    pending: 0,
    review: 0,
    errors: 0,
  };

  for (const payment of candidates) {
    if (!payment.providerReference) {
      const meta = readArcaPaymentMetadata(payment.metadata);
      if (
        meta.arca?.initializationState !== "uncertain" &&
        meta.arca?.initializationState !== "registered"
      ) {
        continue;
      }
    }

    try {
      const result = await processArcaPaymentStatus({
        paymentId: payment.id,
      });
      summary.processed += 1;
      if (
        result.outcome === "captured" ||
        result.outcome === "already_processed" ||
        result.outcome === "captured_requires_review"
      ) {
        summary.captured += 1;
        if (result.outcome === "captured_requires_review") {
          summary.review += 1;
        }
      } else if (
        result.outcome === "failed" ||
        result.outcome === "cancelled"
      ) {
        summary.failed += 1;
      } else if (
        result.outcome === "unknown" ||
        result.outcome === "reconciliation_required" ||
        result.outcome === "refunded" ||
        result.outcome === "reversed"
      ) {
        summary.review += 1;
      } else {
        summary.pending += 1;
      }

      logger.info("arca.reconcile.item", {
        provider: "arca",
        paymentId: payment.id,
        orderId: payment.orderId,
        outcome: result.outcome,
        providerReference: redactProviderReference(payment.providerReference),
      });
    } catch (error) {
      summary.errors += 1;
      logger.error("arca.reconcile.error", {
        provider: "arca",
        paymentId: payment.id,
        orderId: payment.orderId,
        errorCode:
          error instanceof Error ? error.name : "ARCA_RECONCILE_ERROR",
      });
    }
  }

  return summary;
}
