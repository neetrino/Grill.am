import { and, eq } from "drizzle-orm";

import { auditLogs, orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  InvalidPaymentTransitionError,
  PaymentNotFoundError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";
import { logPaymentInfo } from "@/features/payments/domain/payment-logging";
import {
  PAYMENT_METRIC_NAMES,
  paymentMetrics,
} from "@/features/payments/domain/payment-metrics";
import { createId } from "@/lib/id";

export type MarkPaymentRefundedInput = {
  paymentId: string;
  correlationId: string;
  actorUserId?: string;
  providerEventId?: string;
  bankState?: "refunded" | "reversed";
};

export type MarkPaymentRefundedResult = {
  type: "refunded" | "already_processed";
  orderId: string;
  paymentId: string;
  orderNumber: string;
};

/**
 * Applies local REFUNDED after the bank has reversed or refunded.
 * Does not restore stock or change fulfillment order.status.
 */
export async function markPaymentRefunded(
  input: MarkPaymentRefundedInput,
): Promise<MarkPaymentRefundedResult> {
  const result = await withTransaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .for("update")
      .limit(1);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update")
      .limit(1);

    if (!order) {
      throw new PaymentNotFoundError();
    }

    if (payment.status === "REFUNDED") {
      return {
        type: "already_processed" as const,
        orderId: order.id,
        paymentId: payment.id,
        orderNumber: order.orderNumber,
      };
    }

    if (payment.status !== "CAPTURED") {
      throw new InvalidPaymentTransitionError(payment.status, "REFUNDED");
    }

    const now = new Date();
    const updated = await tx
      .update(payments)
      .set({
        status: "REFUNDED",
        updatedAt: now,
        ...paymentLifecycleTimestampPatch("REFUNDED", now, payment),
      })
      .where(
        and(eq(payments.id, payment.id), eq(payments.status, "CAPTURED")),
      )
      .returning({ id: payments.id });

    if (updated.length === 0) {
      const [again] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id))
        .limit(1);
      if (again?.status === "REFUNDED") {
        return {
          type: "already_processed" as const,
          orderId: order.id,
          paymentId: payment.id,
          orderNumber: order.orderNumber,
        };
      }
      throw new InvalidPaymentTransitionError(
        again?.status ?? payment.status,
        "REFUNDED",
      );
    }

    await tx
      .update(orders)
      .set({ paymentStatus: "REFUNDED", updatedAt: now })
      .where(eq(orders.id, order.id));

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: order.id,
      eventType: "PAYMENT_PROVIDER",
      fromState: payment.status,
      toState: "REFUNDED",
      actorUserId: input.actorUserId ?? null,
      isCustomerVisible: true,
      provider: payment.provider,
      providerEventId: input.providerEventId ?? `arca-refund:${payment.id}`,
      correlationId: input.correlationId,
      payload: buildSafePaymentEventPayload({
        kind: "PAYMENT_REFUNDED",
        provider: payment.provider,
        paymentId: payment.id,
        attemptNumber: payment.attemptNumber,
        providerReference: payment.providerReference,
        status: "REFUNDED",
        errorCode: input.bankState,
      }),
    });

    await tx.insert(auditLogs).values({
      id: createId(),
      actorUserId: input.actorUserId ?? null,
      action: "payment.refund",
      targetType: "payment",
      targetId: payment.id,
      beforeDiff: { status: payment.status, orderPaymentStatus: order.paymentStatus },
      afterDiff: { status: "REFUNDED", orderPaymentStatus: "REFUNDED" },
      correlationId: input.correlationId,
      context: {
        orderNumber: order.orderNumber,
        bankState: input.bankState ?? null,
      },
    });

    return {
      type: "refunded" as const,
      orderId: order.id,
      paymentId: payment.id,
      orderNumber: order.orderNumber,
    };
  });

  if (result.type === "refunded") {
    paymentMetrics.increment(PAYMENT_METRIC_NAMES.refunded, {
      provider: "arca",
      operation: "refund",
      resultClass: "refunded",
    });
    logPaymentInfo("payment.refunded", {
      operation: "refund",
      paymentId: result.paymentId,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      provider: "arca",
      correlationId: input.correlationId,
      result: input.bankState ?? "refunded",
    });
  }

  return result;
}
