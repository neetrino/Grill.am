import "server-only";

import { desc, eq } from "drizzle-orm";

import { cartItems, orders, payments } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { createPaymentAttempt } from "@/features/payments/application/create-payment-attempt";
import { failPayment } from "@/features/payments/application/fail-payment";
import { fingerprintCartItems } from "@/features/payments/domain/cart-fingerprint";
import {
  PaymentAlreadyCapturedError,
  PaymentAlreadyRefundedError,
  PaymentNotFoundError,
  PaymentProviderNotConfiguredError,
} from "@/features/payments/domain/errors";
import { assertOrderPaymentAccess } from "@/features/payments/providers/arca/access";
import { isPaymentRetryBlockedByRefund } from "@/features/payments/domain/refund-retry-barrier";
import { createIdramPaymentForm } from "@/features/payments/providers/idram/create-idram-payment";
import { requireIdramConfig } from "@/lib/payments/idram/config";
import type { IdramPaymentFormPayload } from "@/lib/payments/idram/types";

/**
 * Retries iDram payment for an unpaid order.
 * Creates a new attempt after terminal/expired; reuses active PENDING form.
 */
export async function retryIdramPayment(input: {
  orderId: string;
  locale?: string;
}): Promise<IdramPaymentFormPayload> {
  try {
    requireIdramConfig();
  } catch {
    throw new PaymentProviderNotConfiguredError("idram");
  }

  const { order } = await assertOrderPaymentAccess(input.orderId);

  if (order.paymentStatus === "CAPTURED" || order.status === "REQUIRES_REVIEW") {
    throw new PaymentAlreadyCapturedError();
  }
  if (isPaymentRetryBlockedByRefund(order.paymentStatus, null)) {
    throw new PaymentAlreadyRefundedError();
  }

  // Expire stale PENDING outside the create transaction (failPayment uses its own tx).
  const latest = await withTransaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(payments)
      .where(eq(payments.orderId, input.orderId))
      .orderBy(desc(payments.attemptNumber))
      .limit(1);
    return row ?? null;
  });

  if (
    latest &&
    latest.provider === "idram" &&
    latest.status === "PENDING" &&
    latest.expiresAt &&
    latest.expiresAt.getTime() <= Date.now()
  ) {
    await failPayment({
      paymentId: latest.id,
      outcome: "CANCELLED",
      providerEventId: `idram:expire:${latest.id}`,
      errorCode: "IDRAM_ATTEMPT_EXPIRED",
    });
  }

  const paymentId = await withTransaction(async (tx) => {
    const [lockedOrder] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .for("update")
      .limit(1);

    if (!lockedOrder) {
      throw new PaymentNotFoundError();
    }
    if (
      lockedOrder.paymentStatus === "CAPTURED" ||
      lockedOrder.status === "REQUIRES_REVIEW"
    ) {
      throw new PaymentAlreadyCapturedError();
    }
    const [newest] = await tx
      .select()
      .from(payments)
      .where(eq(payments.orderId, lockedOrder.id))
      .orderBy(desc(payments.attemptNumber))
      .limit(1);

    if (!newest || newest.provider !== "idram") {
      throw new PaymentNotFoundError();
    }
    if (isPaymentRetryBlockedByRefund(lockedOrder.paymentStatus, newest.status)) {
      throw new PaymentAlreadyRefundedError();
    }

    if (
      newest.status === "PENDING" &&
      (!newest.expiresAt || newest.expiresAt.getTime() > Date.now())
    ) {
      return newest.id;
    }

    let sourceCartFingerprint: string | undefined;
    if (lockedOrder.sourceCartId) {
      const items = await tx
        .select({
          productId: cartItems.productId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.cartId, lockedOrder.sourceCartId));
      sourceCartFingerprint = fingerprintCartItems(items);
    }

    const created = await createPaymentAttempt({
      tx,
      orderId: lockedOrder.id,
      provider: "idram",
      method: "idram",
      amount: lockedOrder.totalAmount,
      currency: lockedOrder.baseCurrency,
      metadata: sourceCartFingerprint ? { sourceCartFingerprint } : null,
    });

    await tx
      .update(orders)
      .set({ paymentStatus: "PENDING", updatedAt: new Date() })
      .where(eq(orders.id, lockedOrder.id));

    return created.id;
  });

  return createIdramPaymentForm({
    paymentId,
    locale: input.locale,
  });
}
