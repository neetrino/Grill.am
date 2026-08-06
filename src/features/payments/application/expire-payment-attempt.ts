import { and, eq, lt, or, sql } from "drizzle-orm";

import { orderEvents, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { failPayment } from "@/features/payments/application/fail-payment";
import { PaymentAlreadyCapturedError } from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { logPaymentInfo } from "@/features/payments/domain/payment-logging";
import {
  PAYMENT_METRIC_NAMES,
  paymentMetrics,
} from "@/features/payments/domain/payment-metrics";
import { createId } from "@/lib/id";

export type ExpirePaymentAttemptResult =
  | {
      type: "expired";
      paymentId: string;
      orderId: string;
      status: "CANCELLED";
    }
  | {
      type: "skipped";
      reason:
        | "not_found"
        | "not_pending"
        | "not_expired"
        | "already_captured"
        | "already_terminal";
      paymentId: string;
    };

/**
 * Marks an abandoned PENDING attempt as CANCELLED when expiresAt has passed.
 * CAPTURED always wins (confirm under lock cannot be downgraded).
 * Does not claim provider failure — local policy only.
 */
export async function expirePaymentAttempt(input: {
  paymentId: string;
  correlationId?: string;
  now?: Date;
}): Promise<ExpirePaymentAttemptResult> {
  const now = input.now ?? new Date();
  const correlationId = input.correlationId ?? createId();

  const decision = await withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .for("update")
      .limit(1);

    if (!payment) {
      return { type: "skipped" as const, reason: "not_found" as const, paymentId: input.paymentId };
    }

    if (payment.status === "CAPTURED") {
      return {
        type: "skipped" as const,
        reason: "already_captured" as const,
        paymentId: payment.id,
      };
    }

    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      return {
        type: "skipped" as const,
        reason: "already_terminal" as const,
        paymentId: payment.id,
      };
    }

    if (payment.status !== "PENDING" && payment.status !== "AUTHORIZED") {
      return {
        type: "skipped" as const,
        reason: "not_pending" as const,
        paymentId: payment.id,
      };
    }

    if (!payment.expiresAt || payment.expiresAt > now) {
      return {
        type: "skipped" as const,
        reason: "not_expired" as const,
        paymentId: payment.id,
      };
    }

    return {
      type: "ready" as const,
      paymentId: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      attemptNumber: payment.attemptNumber,
    };
  });

  if (decision.type !== "ready") {
    return decision;
  }

  try {
    const failResult = await failPayment({
      paymentId: decision.paymentId,
      outcome: "CANCELLED",
      providerEventId: `expire:${decision.paymentId}:${decision.attemptNumber}`,
      errorCode: "PAYMENT_ATTEMPT_EXPIRED",
      safeMetadata: { expiredLocally: true },
    });

    await withTransaction(async (tx) => {
      try {
        await tx.insert(orderEvents).values({
          id: createId(),
          orderId: decision.orderId,
          eventType: "PAYMENT_PROVIDER",
          fromState: "PENDING",
          toState: "CANCELLED",
          isCustomerVisible: false,
          provider: decision.provider,
          providerEventId: `payment_expired:${decision.paymentId}`,
          correlationId,
          payload: buildSafePaymentEventPayload({
            kind: "PAYMENT_EXPIRED",
            provider: decision.provider,
            paymentId: decision.paymentId,
            attemptNumber: decision.attemptNumber,
            status: "CANCELLED",
            errorCode: "PAYMENT_ATTEMPT_EXPIRED",
          }),
        });
      } catch {
        // Unique provider event id — concurrent expire is harmless.
      }
    });

    logPaymentInfo("payment.attempt_expired", {
      correlationId,
      orderId: decision.orderId,
      paymentId: decision.paymentId,
      provider: decision.provider,
      attemptNumber: decision.attemptNumber,
      operation: "expire_payment_attempt",
      normalizedState: "expired",
      result: failResult.type,
    });

    paymentMetrics.increment(PAYMENT_METRIC_NAMES.cancelled, {
      provider: decision.provider,
      operation: "expire",
      normalizedStatus: "expired",
      resultClass: "success",
    });

    return {
      type: "expired",
      paymentId: decision.paymentId,
      orderId: decision.orderId,
      status: "CANCELLED",
    };
  } catch (error) {
    // Confirm won the race after the pre-check transaction committed.
    if (error instanceof PaymentAlreadyCapturedError) {
      return {
        type: "skipped",
        reason: "already_captured",
        paymentId: decision.paymentId,
      };
    }
    throw error;
  }
}

/** Lists PENDING/AUTHORIZED attempts past expiresAt for ops tooling. */
export async function listExpiredPendingPaymentIds(limit = 100): Promise<string[]> {
  const now = new Date();
  const rows = await withTransaction(async (tx) => {
    return tx
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          or(eq(payments.status, "PENDING"), eq(payments.status, "AUTHORIZED")),
          lt(payments.expiresAt, now),
          sql`${payments.expiresAt} IS NOT NULL`,
        ),
      )
      .limit(limit);
  });
  return rows.map((row) => row.id);
}
