import "server-only";

import { eq } from "drizzle-orm";

import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { confirmPayment } from "@/features/payments/application/confirm-payment";
import { failPayment } from "@/features/payments/application/fail-payment";
import { enqueuePaymentNotification } from "@/features/payments/application/enqueue-payment-notification";
import {
  InsufficientStockAtConfirmationError,
  isPaymentDomainError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";
import { canProviderTransitionPaymentStatus } from "@/features/payments/domain/provider-payment-transitions";
import {
  PAYMENT_METRIC_NAMES,
  paymentMetrics,
} from "@/features/payments/domain/payment-metrics";
import {
  verifyArcaPayment,
  type VerifyArcaPaymentResult,
} from "@/features/payments/providers/arca/verify-arca-payment";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";
import type { ArcaNormalizedState } from "@/lib/payments/arca/types";

export type ProcessArcaStatusResult = {
  normalizedState: ArcaNormalizedState;
  orderId: string;
  paymentId: string;
  orderNumber: string;
  outcome:
    | "captured"
    | "already_processed"
    | "authorized"
    | "pending"
    | "failed"
    | "cancelled"
    | "refunded"
    | "reversed"
    | "unknown"
    | "reconciliation_required"
    | "captured_requires_review";
};

/**
 * Applies an authoritative ARCA status to shared payment services.
 */
export async function processArcaPaymentStatus(input: {
  paymentId: string;
  claimedProviderOrderId?: string;
  language?: string;
}): Promise<ProcessArcaStatusResult> {
  const verified = await verifyArcaPayment(input);
  return applyVerifiedArcaStatus(verified);
}

export async function applyVerifiedArcaStatus(
  verified: VerifyArcaPaymentResult,
): Promise<ProcessArcaStatusResult> {
  const orderNumber = await loadOrderNumber(verified.orderId);

  switch (verified.normalizedState) {
    case "captured": {
      try {
        const result = await confirmPayment({
          paymentId: verified.paymentId,
          providerReference: verified.providerReference,
          providerEventId: verified.providerEventId,
          verifiedAmount: verified.verifiedAmount,
          verifiedCurrency: verified.verifiedCurrency,
          safeMetadata: {
            arcaOfficialMeaning: verified.officialMeaning,
            arcaOrderStatus: verified.orderStatus,
          },
        });
        return {
          normalizedState: "captured",
          orderId: verified.orderId,
          paymentId: verified.paymentId,
          orderNumber: result.orderNumber,
          outcome:
            result.type === "already_processed"
              ? "already_processed"
              : "captured",
        };
      } catch (error) {
        if (error instanceof InsufficientStockAtConfirmationError) {
          const review = await captureWithFulfillmentReview(verified);
          return {
            ...review,
            orderNumber,
          };
        }
        throw error;
      }
    }
    case "authorized": {
      await markAuthorized(verified);
      return {
        normalizedState: "authorized",
        orderId: verified.orderId,
        paymentId: verified.paymentId,
        orderNumber,
        outcome: "authorized",
      };
    }
    case "failed": {
      const result = await failPayment({
        paymentId: verified.paymentId,
        outcome: "FAILED",
        providerEventId: verified.providerEventId,
        errorCode: `arca_status_${verified.orderStatus}`,
      });
      return {
        normalizedState: "failed",
        orderId: verified.orderId,
        paymentId: verified.paymentId,
        orderNumber,
        outcome: result.status === "CANCELLED" ? "cancelled" : "failed",
      };
    }
    case "cancelled": {
      await failPayment({
        paymentId: verified.paymentId,
        outcome: "CANCELLED",
        providerEventId: verified.providerEventId,
        errorCode: `arca_status_${verified.orderStatus}`,
      });
      return {
        normalizedState: "cancelled",
        orderId: verified.orderId,
        paymentId: verified.paymentId,
        orderNumber,
        outcome: "cancelled",
      };
    }
    case "pending":
      return {
        normalizedState: "pending",
        orderId: verified.orderId,
        paymentId: verified.paymentId,
        orderNumber,
        outcome: "pending",
      };
    case "refunded":
    case "reversed":
    case "reconciliation_required":
    case "unknown":
      await recordReviewEvent(verified);
      return {
        normalizedState: verified.normalizedState,
        orderId: verified.orderId,
        paymentId: verified.paymentId,
        orderNumber,
        outcome: verified.normalizedState,
      };
    default: {
      const _exhaustive: never = verified.normalizedState;
      void _exhaustive;
      return {
        normalizedState: "unknown",
        orderId: verified.orderId,
        paymentId: verified.paymentId,
        orderNumber,
        outcome: "unknown",
      };
    }
  }
}

/**
 * Provider paid but stock unavailable: keep payment truth CAPTURED,
 * set order fulfillment to REQUIRES_REVIEW. Never call failPayment.
 */
async function captureWithFulfillmentReview(
  verified: VerifyArcaPaymentResult,
): Promise<Omit<ProcessArcaStatusResult, "orderNumber">> {
  return withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, verified.paymentId))
      .for("update")
      .limit(1);

    if (!payment) {
      throw new Error("Payment missing during review capture.");
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update")
      .limit(1);

    if (!order) {
      throw new Error("Order missing during review capture.");
    }

    if (payment.status === "CAPTURED") {
      return {
        normalizedState: "captured" as const,
        orderId: order.id,
        paymentId: payment.id,
        outcome:
          order.status === "REQUIRES_REVIEW"
            ? ("captured_requires_review" as const)
            : ("already_processed" as const),
      };
    }

    if (!canProviderTransitionPaymentStatus(payment.status, "CAPTURED")) {
      throw new Error(
        `Cannot capture payment from ${payment.status} for review.`,
      );
    }

    const now = new Date();
    const timestampPatch = paymentLifecycleTimestampPatch(
      "CAPTURED",
      now,
      payment,
    );

    await tx
      .update(payments)
      .set({
        status: "CAPTURED",
        providerReference: verified.providerReference,
        updatedAt: now,
        ...timestampPatch,
      })
      .where(eq(payments.id, payment.id));

    await tx
      .update(orders)
      .set({
        paymentStatus: "CAPTURED",
        status: "REQUIRES_REVIEW",
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: order.id,
      eventType: "PAYMENT_PROVIDER",
      fromState: payment.status,
      toState: "CAPTURED",
      isCustomerVisible: true,
      provider: "arca",
      providerEventId: `${verified.providerEventId}:stock-review`,
      payload: buildSafePaymentEventPayload({
        kind: "PROVIDER_PAID_STOCK_UNAVAILABLE",
        provider: "arca",
        paymentId: payment.id,
        attemptNumber: payment.attemptNumber,
        providerReference: verified.providerReference,
        status: "CAPTURED",
        verifiedAmount: verified.verifiedAmount,
        verifiedCurrency: verified.verifiedCurrency,
        errorCode: "INSUFFICIENT_STOCK_AT_CONFIRMATION",
      }),
    });

    await enqueuePaymentNotification(tx, {
      type: "PAYMENT_REQUIRES_REVIEW_CUSTOMER",
      orderId: order.id,
      orderNumber: order.orderNumber,
      locale: order.locale,
      dedupeKey: `payment-review:${order.id}:customer`,
      recipientRole: "customer",
      safePayload: { provider: "arca" },
    });
    await enqueuePaymentNotification(tx, {
      type: "PAYMENT_REQUIRES_REVIEW_OPERATOR",
      orderId: order.id,
      orderNumber: order.orderNumber,
      locale: order.locale,
      dedupeKey: `payment-review:${order.id}:operators`,
      recipientRole: "operator",
      safePayload: { provider: "arca", severity: "high" },
    });

    paymentMetrics.increment(PAYMENT_METRIC_NAMES.requiresReview, {
      provider: "arca",
      operation: "confirm_review",
      resultClass: "requires_review",
    });

    logger.error("arca.provider_paid_stock_unavailable", {
      provider: "arca",
      paymentId: payment.id,
      orderId: order.id,
      severity: "high",
    });

    return {
      normalizedState: "captured" as const,
      orderId: order.id,
      paymentId: payment.id,
      outcome: "captured_requires_review" as const,
    };
  });
}

async function markAuthorized(
  verified: VerifyArcaPaymentResult,
): Promise<void> {
  await withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, verified.paymentId))
      .for("update")
      .limit(1);
    if (!payment) return;
    if (payment.status === "AUTHORIZED" || payment.status === "CAPTURED") {
      return;
    }
    if (!canProviderTransitionPaymentStatus(payment.status, "AUTHORIZED")) {
      return;
    }
    const now = new Date();
    await tx
      .update(payments)
      .set({
        status: "AUTHORIZED",
        providerReference: verified.providerReference,
        updatedAt: now,
        ...paymentLifecycleTimestampPatch("AUTHORIZED", now, payment),
      })
      .where(eq(payments.id, payment.id));
    await tx
      .update(orders)
      .set({ paymentStatus: "AUTHORIZED", updatedAt: now })
      .where(eq(orders.id, payment.orderId));
  });
}

async function recordReviewEvent(
  verified: VerifyArcaPaymentResult,
): Promise<void> {
  try {
    await withTransaction(async (tx) => {
      await tx.insert(orderEvents).values({
        id: createId(),
        orderId: verified.orderId,
        eventType: "PAYMENT_PROVIDER",
        fromState: null,
        toState: verified.normalizedState,
        isCustomerVisible: false,
        provider: "arca",
        providerEventId: `${verified.providerEventId}:review`,
        payload: buildSafePaymentEventPayload({
          kind: "ARCA_STATUS_REVIEW",
          provider: "arca",
          paymentId: verified.paymentId,
          attemptNumber: 0,
          providerReference: verified.providerReference,
          status: verified.normalizedState,
        }),
      });
    });
  } catch (error) {
    if (isPaymentDomainError(error)) {
      return;
    }
    // Unique provider event replay — ignore.
  }
}

async function loadOrderNumber(orderId: string): Promise<string> {
  const { getDb } = await import("@/db/client");
  const [order] = await getDb()
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return order?.orderNumber ?? "";
}
