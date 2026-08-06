import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { cartItems, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { createPaymentAttempt } from "@/features/payments/application/create-payment-attempt";
import { fingerprintCartItems } from "@/features/payments/domain/cart-fingerprint";
import {
  PaymentAlreadyCapturedError,
  PaymentNotFoundError,
  PaymentProviderNotConfiguredError,
} from "@/features/payments/domain/errors";
import { assertOrderPaymentAccess } from "@/features/payments/providers/arca/access";
import { initializeArcaPayment } from "@/features/payments/providers/arca/initialize-arca-payment";
import { readArcaPaymentMetadata } from "@/features/payments/providers/arca/metadata";
import { processArcaPaymentStatus } from "@/features/payments/providers/arca/process-arca-status";
import { requireArcaConfig } from "@/lib/payments/arca/config";

export type RetryArcaPaymentResult =
  | {
      type: "redirect";
      paymentId: string;
      orderId: string;
      orderNumber: string;
      redirectUrl: string;
    }
  | {
      type: "already_captured";
      paymentId: string;
      orderId: string;
      orderNumber: string;
    }
  | {
      type: "uncertain";
      paymentId: string;
      orderId: string;
      orderNumber: string;
    };

/**
 * Retries ARCA payment for an unpaid order.
 * Reuses an active registration when safe; otherwise creates a new attempt.
 */
export async function retryArcaPayment(input: {
  orderId: string;
  locale?: string;
}): Promise<RetryArcaPaymentResult> {
  try {
    requireArcaConfig();
  } catch {
    throw new PaymentProviderNotConfiguredError("arca");
  }

  await assertOrderPaymentAccess(input.orderId);

  const snapshot = await withTransaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .for("update")
      .limit(1);

    if (!order) {
      throw new PaymentNotFoundError();
    }

    const [newest] = await tx
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.attemptNumber))
      .limit(1);

    return { order, payment: newest ?? null };
  });

  if (snapshot.order.paymentStatus === "CAPTURED") {
    throw new PaymentAlreadyCapturedError();
  }

  const payment = snapshot.payment;
  if (!payment || payment.provider !== "arca") {
    throw new PaymentNotFoundError();
  }

  if (payment.status === "PENDING" || payment.status === "AUTHORIZED") {
    const processed = await processArcaPaymentStatus({
      paymentId: payment.id,
      language: input.locale,
    }).catch(() => null);

    if (
      processed?.outcome === "captured" ||
      processed?.outcome === "already_processed" ||
      processed?.outcome === "captured_requires_review"
    ) {
      return {
        type: "already_captured",
        paymentId: payment.id,
        orderId: snapshot.order.id,
        orderNumber: snapshot.order.orderNumber,
      };
    }

    if (payment.status === "PENDING") {
      const meta = readArcaPaymentMetadata(payment.metadata);
      if (meta.arca?.initializationState !== "failed") {
        const init = await initializeArcaPayment({
          paymentId: payment.id,
          locale: input.locale,
        });
        if (init.type === "redirect") {
          return {
            type: "redirect",
            paymentId: init.paymentId,
            orderId: init.orderId,
            orderNumber: init.orderNumber,
            redirectUrl: init.redirectUrl,
          };
        }
        return {
          type: "uncertain",
          paymentId: init.paymentId,
          orderId: init.orderId,
          orderNumber: init.orderNumber,
        };
      }
    }
  }

  const newPaymentId = await withTransaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .for("update")
      .limit(1);

    if (!order) {
      throw new PaymentNotFoundError();
    }
    if (order.paymentStatus === "CAPTURED") {
      throw new PaymentAlreadyCapturedError();
    }

    const [newest] = await tx
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.attemptNumber))
      .limit(1);

    if (
      newest &&
      (newest.status === "PENDING" || newest.status === "AUTHORIZED")
    ) {
      return newest.id;
    }

    let sourceCartFingerprint: string | undefined;
    if (order.sourceCartId) {
      const items = await tx
        .select({
          productId: cartItems.productId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.cartId, order.sourceCartId));
      sourceCartFingerprint = fingerprintCartItems(items);
    }

    const created = await createPaymentAttempt({
      tx,
      orderId: order.id,
      provider: "arca",
      method: "arca",
      amount: order.totalAmount,
      currency: order.baseCurrency,
      metadata: sourceCartFingerprint ? { sourceCartFingerprint } : null,
    });

    await tx
      .update(orders)
      .set({ paymentStatus: "PENDING", updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return created.id;
  });

  const init = await initializeArcaPayment({
    paymentId: newPaymentId,
    locale: input.locale,
  });

  if (init.type === "redirect") {
    return {
      type: "redirect",
      paymentId: init.paymentId,
      orderId: init.orderId,
      orderNumber: init.orderNumber,
      redirectUrl: init.redirectUrl,
    };
  }

  return {
    type: "uncertain",
    paymentId: init.paymentId,
    orderId: init.orderId,
    orderNumber: init.orderNumber,
  };
}

export async function getOrderIdForPayment(
  paymentId: string,
): Promise<string | null> {
  const [row] = await getDb()
    .select({ orderId: payments.orderId })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  return row?.orderId ?? null;
}
