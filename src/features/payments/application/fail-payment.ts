import { and, eq } from "drizzle-orm";

import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { scheduleOrderEmails } from "@/features/notifications/application/schedule-order-emails";
import {
  InvalidPaymentTransitionError,
  PaymentAlreadyCapturedError,
  PaymentNotFoundError,
} from "@/features/payments/domain/errors";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";
import { canProviderTransitionPaymentStatus } from "@/features/payments/domain/provider-payment-transitions";
import { createId } from "@/lib/id";

export type FailPaymentInput = {
  paymentId: string;
  outcome: "FAILED" | "CANCELLED";
  providerEventId?: string;
  errorCode?: string;
  safeMetadata?: Record<string, unknown>;
};

export type FailPaymentResult =
  | {
      type: "updated";
      orderId: string;
      paymentId: string;
      status: "FAILED" | "CANCELLED";
    }
  | {
      type: "already_processed";
      orderId: string;
      paymentId: string;
      status: "FAILED" | "CANCELLED";
    };

/**
 * Marks a payment attempt FAILED or CANCELLED without fulfilling the order.
 * Does not decrement stock or clear the cart. CAPTURED attempts cannot fail.
 * FAILED ↔ CANCELLED on the same attempt is rejected.
 */
export async function failPayment(
  input: FailPaymentInput,
): Promise<FailPaymentResult> {
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

    if (payment.status === "CAPTURED") {
      throw new PaymentAlreadyCapturedError();
    }

    if (payment.status === input.outcome) {
      return {
        type: "already_processed" as const,
        orderId: order.id,
        paymentId: payment.id,
        status: input.outcome,
      };
    }

    if (!canProviderTransitionPaymentStatus(payment.status, input.outcome)) {
      throw new InvalidPaymentTransitionError(payment.status, input.outcome);
    }

    const now = new Date();
    const timestampPatch = paymentLifecycleTimestampPatch(
      input.outcome,
      now,
      payment,
    );

    const updated = await tx
      .update(payments)
      .set({
        status: input.outcome,
        metadata: mergeSafeMetadata(payment.metadata, input.safeMetadata),
        updatedAt: now,
        ...timestampPatch,
      })
      .where(
        and(
          eq(payments.id, payment.id),
          eq(payments.status, payment.status),
        ),
      )
      .returning({ id: payments.id });

    if (updated.length === 0) {
      const [again] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id))
        .limit(1);

      if (again?.status === input.outcome) {
        return {
          type: "already_processed" as const,
          orderId: order.id,
          paymentId: payment.id,
          status: input.outcome,
        };
      }

      if (again?.status === "CAPTURED") {
        throw new PaymentAlreadyCapturedError();
      }

      throw new InvalidPaymentTransitionError(
        again?.status ?? payment.status,
        input.outcome,
      );
    }

    await tx
      .update(orders)
      .set({ paymentStatus: "FAILED", updatedAt: now })
      .where(eq(orders.id, order.id));

    const eventKind =
      input.outcome === "FAILED" ? "PAYMENT_FAILED" : "PAYMENT_CANCELLED";

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: order.id,
      eventType: "PAYMENT_PROVIDER",
      fromState: payment.status,
      toState: input.outcome,
      isCustomerVisible: true,
      provider: payment.provider,
      providerEventId: input.providerEventId ?? null,
      payload: buildSafePaymentEventPayload({
        kind: eventKind,
        provider: payment.provider,
        paymentId: payment.id,
        attemptNumber: payment.attemptNumber,
        providerReference: payment.providerReference,
        status: input.outcome,
        errorCode: input.errorCode,
      }),
    });

    return {
      type: "updated" as const,
      orderId: order.id,
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      status: input.outcome,
      locale: order.locale,
      shouldNotifyCustomer: input.errorCode !== "PAYMENT_ATTEMPT_EXPIRED",
    };
  });

  if (result.type === "updated" && result.shouldNotifyCustomer) {
    scheduleOrderEmails({
      kind:
        result.status === "FAILED" ? "payment_failed" : "payment_cancelled",
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      locale: result.locale,
      paymentId: result.paymentId,
    });
  }

  return {
    type: result.type,
    orderId: result.orderId,
    paymentId: result.paymentId,
    status: result.status,
  };
}

function mergeSafeMetadata(
  existing: Record<string, unknown> | null,
  incoming: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!incoming) {
    return existing;
  }
  return { ...(existing ?? {}), ...incoming };
}
