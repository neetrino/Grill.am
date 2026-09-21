"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { auditLogs, orderEvents, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  restoreBonusSpendAfterRefund,
  reverseBonusSpendForOrder,
  syncOrderBonusEarn,
} from "@/features/loyalty/application/ledger";
import {
  assertAdminPaymentTransition,
  planAdminPaymentStatusChange,
} from "@/features/orders/domain/admin-payment-status-plan";
import {
  canTransitionPaymentStatus,
  isPaymentStatus,
  type PaymentStatus,
} from "@/features/orders/domain/payment-status";
import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";
import { refundArcaPaymentAction } from "@/features/payments/application/refund-arca-payment-action";
import {
  changePaymentStatusSchema,
  type ChangePaymentStatusInput,
} from "@/features/orders/schemas/change-payment-status";
import { requireOrdersStaff } from "@/lib/auth/policies";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

export type ChangePaymentStatusData = {
  orderNumber: string;
  fromStatus: PaymentStatus;
  toStatus: PaymentStatus;
};

/**
 * Admin payment transition: updates order + latest payment row,
 * appends payment history event and audit log.
 * Refunded on ARCA captured attempts goes through the bank.
 * Paid cash may move between Cancelled and Paid; captured card funds may not.
 */
export async function changePaymentStatusAction(
  locale: string,
  raw: ChangePaymentStatusInput,
): Promise<Result<ChangePaymentStatusData>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = changePaymentStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid payment status payload.");
  }

  const actor = await requireOrdersStaff(locale as Locale);
  const { orderNumber, toStatus, note } = parsed.data;
  const bankResult = await applyBankRefundIfNeeded(locale, {
    orderNumber,
    toStatus,
  });
  if (bankResult) {
    return bankResult;
  }

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

      if (!isPaymentStatus(locked.paymentStatus)) {
        throw new Error("INVALID_CURRENT_STATUS");
      }

      const fromStatus = locked.paymentStatus;
      const [latestPayment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, locked.id))
        .orderBy(desc(payments.attemptNumber))
        .limit(1);

      if (fromStatus === toStatus) {
        throw new Error("SAME_STATUS");
      }

      assertAdminPaymentTransition({
        fromStatus,
        toStatus,
        provider: latestPayment?.provider ?? null,
      });

      const now = new Date();
      const correlationId = createId();

      await tx
        .update(orders)
        .set({ paymentStatus: toStatus, updatedAt: now })
        .where(eq(orders.id, locked.id));

      if (latestPayment) {
        const timestampPatch = paymentLifecycleTimestampPatch(
          toStatus,
          now,
          latestPayment,
        );
        await tx
          .update(payments)
          .set({
            status: toStatus,
            updatedAt: now,
            ...timestampPatch,
          })
          .where(eq(payments.id, latestPayment.id));
      }

      await tx.insert(orderEvents).values({
        id: createId(),
        orderId: locked.id,
        eventType: "PAYMENT_PROVIDER",
        fromState: fromStatus,
        toState: toStatus,
        actorUserId: actor.id,
        isCustomerVisible: true,
        payload: {
          source: "admin",
          paymentId: latestPayment?.id ?? null,
          note: note ?? null,
        },
        correlationId,
      });

      if (note) {
        await tx.insert(orderEvents).values({
          id: createId(),
          orderId: locked.id,
          eventType: "NOTE",
          actorUserId: actor.id,
          isCustomerVisible: false,
          payload: { note, context: "payment_status" },
          correlationId,
        });
      }

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "order.change_payment_status",
        targetType: "order",
        targetId: locked.id,
        beforeDiff: { paymentStatus: fromStatus },
        afterDiff: { paymentStatus: toStatus },
        correlationId,
        context: { orderNumber, note: note ?? null },
      });

      await syncOrderBonusEarn(tx, locked.id);
      if (
        toStatus === "FAILED" ||
        toStatus === "CANCELLED"
      ) {
        await reverseBonusSpendForOrder(tx, locked.id);
      }
      if (toStatus === "REFUNDED") {
        await restoreBonusSpendAfterRefund(tx, locked.id);
      }

      return { orderNumber, fromStatus, toStatus };
    });

    revalidateAdminOrderPaths(locale);
    return ok(result);
  } catch (error) {
    return mapPaymentStatusError(error);
  }
}

async function applyBankRefundIfNeeded(
  locale: Locale,
  input: { orderNumber: string; toStatus: PaymentStatus },
): Promise<Result<ChangePaymentStatusData> | null> {
  const db = getDb();
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.orderNumber, input.orderNumber))
    .limit(1);

  if (!order || !isPaymentStatus(order.paymentStatus)) {
    return null;
  }

  const [latestPayment] = await db
    .select({ id: payments.id, provider: payments.provider })
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .orderBy(desc(payments.attemptNumber))
    .limit(1);

  const plan = planAdminPaymentStatusChange({
    toStatus: input.toStatus,
    provider: latestPayment?.provider ?? null,
  });

  if (plan.type === "local") {
    return null;
  }

  if (plan.type === "unsupported_provider_refund") {
    return err(
      "IDRAM_REFUND_UNSUPPORTED",
      "iDram refund is not available in the shop. Return funds in the iDram cabinet.",
    );
  }

  if (order.paymentStatus === input.toStatus) {
    return err("SAME_STATUS", "Payment already has this status.");
  }

  if (!canTransitionPaymentStatus(order.paymentStatus, input.toStatus)) {
    return err(
      "INVALID_TRANSITION",
      "That payment transition is not allowed.",
    );
  }

  if (!latestPayment) {
    return err("PAYMENT_NOT_FOUND", "No payment attempt to refund.");
  }

  const refunded = await refundArcaPaymentAction({
    paymentId: latestPayment.id,
    locale,
  });
  if (!refunded.ok) {
    return err(refunded.code, refunded.error);
  }

  revalidateAdminOrderPaths(locale);
  return ok({
    orderNumber: order.orderNumber,
    fromStatus: order.paymentStatus,
    toStatus: "REFUNDED",
  });
}

function revalidateAdminOrderPaths(locale: string): void {
  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/profile/orders`);
}

function mapPaymentStatusError(error: unknown): Result<never> {
  const code = error instanceof Error ? error.message : "UNKNOWN";

  switch (code) {
    case "ORDER_NOT_FOUND":
      return err("ORDER_NOT_FOUND", "Order not found.");
    case "SAME_STATUS":
      return err("SAME_STATUS", "Payment already has this status.");
    case "CAPTURED_USE_REFUND":
      return err(
        "CAPTURED_USE_REFUND",
        "Captured card funds must be returned with Refunded, not Cancelled.",
      );
    case "INVALID_TRANSITION":
      return err(
        "INVALID_TRANSITION",
        "That payment transition is not allowed.",
      );
    case "INVALID_CURRENT_STATUS":
      return err(
        "INVALID_CURRENT_STATUS",
        "Order has an unknown payment status.",
      );
    default:
      return err("PAYMENT_STATUS_FAILED", "Unable to update payment status.");
  }
}
