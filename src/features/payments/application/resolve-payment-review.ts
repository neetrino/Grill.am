"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLogs, orderEvents, orders } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  canTransitionOrderStatus,
  isOrderStatus,
  type OrderStatus,
} from "@/features/orders/domain/order-status";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { logPaymentInfo } from "@/features/payments/domain/payment-logging";
import { requireOrdersStaff } from "@/lib/auth/policies";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

const resolveSchema = z.object({
  orderNumber: z.string().min(1).max(64),
  resolutionType: z.enum([
    "allocate_stock",
    "confirm_delayed_fulfillment",
    "cancel_fulfillment_external_refund",
    "mark_resolved_after_external_refund",
    "escalate_finance",
  ]),
  toStatus: z.enum(["PROCESSING", "PENDING", "CANCELLED", "DELIVERED"]),
  note: z.string().trim().max(2000).optional(),
});

export type ResolvePaymentReviewData = {
  orderNumber: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  resolutionType: string;
};

/**
 * Operator workflow for provider-paid + fulfillment-failed orders.
 * Payment remains CAPTURED; only fulfillment status moves.
 */
export async function resolvePaymentReviewAction(
  locale: string,
  raw: unknown,
): Promise<Result<ResolvePaymentReviewData>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = resolveSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid review resolution payload.");
  }

  const actor = await requireOrdersStaff(locale as Locale);
  const { orderNumber, resolutionType, toStatus, note } = parsed.data;
  const correlationId = createId();

  try {
    const result = await withTransaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(orders)
        .where(eq(orders.orderNumber, orderNumber))
        .for("update")
        .limit(1);

      if (!locked) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (locked.status !== "REQUIRES_REVIEW") {
        throw new Error("NOT_IN_REVIEW");
      }

      if (locked.paymentStatus !== "CAPTURED") {
        throw new Error("PAYMENT_NOT_CAPTURED");
      }

      if (!isOrderStatus(locked.status) || !isOrderStatus(toStatus)) {
        throw new Error("INVALID_STATUS");
      }

      if (!canTransitionOrderStatus(locked.status, toStatus)) {
        throw new Error("INVALID_TRANSITION");
      }

      const now = new Date();
      await tx
        .update(orders)
        .set({ status: toStatus, updatedAt: now })
        .where(eq(orders.id, locked.id));

      await tx.insert(orderEvents).values({
        id: createId(),
        orderId: locked.id,
        eventType: "STATUS_CHANGE",
        fromState: locked.status,
        toState: toStatus,
        actorUserId: actor.id,
        isCustomerVisible: true,
        provider: "internal",
        providerEventId: `review_resolved:${locked.id}:${correlationId}`,
        correlationId,
        payload: buildSafePaymentEventPayload({
          kind: "PAYMENT_REVIEW_RESOLVED",
          provider: "internal",
          paymentId: locked.id,
          attemptNumber: 0,
          status: locked.paymentStatus,
          errorCode: resolutionType,
        }),
      });

      // Attach operator note separately (safe, no secrets).
      await tx.insert(orderEvents).values({
        id: createId(),
        orderId: locked.id,
        eventType: "NOTE",
        fromState: locked.status,
        toState: toStatus,
        actorUserId: actor.id,
        isCustomerVisible: false,
        correlationId,
        payload: {
          kind: "PAYMENT_REVIEW_RESOLVED",
          resolutionType,
          note: note ?? null,
          resolvedBy: actor.id,
          resolvedAt: now.toISOString(),
        },
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "payment.review.resolve",
        targetType: "order",
        targetId: locked.id,
        beforeDiff: { status: locked.status },
        afterDiff: { status: toStatus, resolutionType },
        correlationId,
        context: { orderNumber, resolutionType },
      });

      return {
        orderNumber: locked.orderNumber,
        fromStatus: locked.status,
        toStatus,
        resolutionType,
      };
    });

    logPaymentInfo("payment.review_resolved", {
      correlationId,
      orderNumber: result.orderNumber,
      operation: "resolve_payment_review",
      normalizedState: "requires_review",
      result: resolutionType,
      requiresReview: false,
    });

    revalidatePath(`/${locale}/admin/orders`);
    return ok(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "ORDER_NOT_FOUND") {
      return err("ORDER_NOT_FOUND", "Order not found.");
    }
    if (code === "NOT_IN_REVIEW") {
      return err("NOT_IN_REVIEW", "Order is not in REQUIRES_REVIEW.");
    }
    if (code === "PAYMENT_NOT_CAPTURED") {
      return err(
        "PAYMENT_NOT_CAPTURED",
        "Review resolution requires a captured payment.",
      );
    }
    if (code === "INVALID_TRANSITION") {
      return err("INVALID_TRANSITION", "Invalid fulfillment transition.");
    }
    return err("REVIEW_RESOLVE_FAILED", "Unable to resolve review.");
  }
}
