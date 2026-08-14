import { and, eq, sql } from "drizzle-orm";

import {
  cartItems,
  carts,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  stockMovements,
} from "@/db/schema";
import type { DatabaseTransaction } from "@/db/transaction";
import { withTransaction } from "@/db/transaction";
import {
  InsufficientStockAtConfirmationError,
  InvalidPaymentTransitionError,
  PaymentNotFoundError,
} from "@/features/payments/domain/errors";
import { assertConfirmPaymentAmounts } from "@/features/payments/domain/confirm-payment-guards";
import { fingerprintCartItems } from "@/features/payments/domain/cart-fingerprint";
import { buildSafePaymentEventPayload } from "@/features/payments/domain/payment-events";
import { paymentLifecycleTimestampPatch } from "@/features/payments/domain/payment-lifecycle-timestamps";
import { canProviderTransitionPaymentStatus } from "@/features/payments/domain/provider-payment-transitions";
import { scheduleOrderEmails } from "@/features/notifications/application/schedule-order-emails";
import {
  PAYMENT_METRIC_NAMES,
  paymentMetrics,
} from "@/features/payments/domain/payment-metrics";
import { logPaymentInfo } from "@/features/payments/domain/payment-logging";
import { createId } from "@/lib/id";

export type ConfirmPaymentInput = {
  paymentId: string;
  providerReference: string;
  providerEventId?: string;
  verifiedAmount: number;
  verifiedCurrency: string;
  safeMetadata?: Record<string, unknown>;
};

export type ConfirmPaymentResult =
  | {
      type: "captured";
      orderId: string;
      paymentId: string;
      orderNumber: string;
    }
  | {
      type: "already_processed";
      orderId: string;
      paymentId: string;
      orderNumber: string;
    };

/**
 * Idempotent online payment confirmation.
 *
 * Payment capture commits even if originating-cart cleanup is skipped
 * (missing cart / fingerprint mismatch). Stock is applied once under the
 * payment row lock + conditional PENDING→CAPTURED update.
 *
 * Phase 3: if the provider has already irrevocably charged the customer
 * but stock is insufficient here, ARCA status processing captures payment
 * and sets orders.status=REQUIRES_REVIEW (never failPayment).
 */
export async function confirmPayment(
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
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
      await recordConfirmationReplay(tx, {
        orderId: order.id,
        payment,
        input,
      });

      return {
        type: "already_processed" as const,
        orderId: order.id,
        paymentId: payment.id,
        orderNumber: order.orderNumber,
      };
    }

    if (!canProviderTransitionPaymentStatus(payment.status, "CAPTURED")) {
      throw new InvalidPaymentTransitionError(payment.status, "CAPTURED");
    }

    assertConfirmPaymentAmounts({
      verifiedAmount: input.verifiedAmount,
      verifiedCurrency: input.verifiedCurrency,
      paymentAmount: payment.amount,
      paymentCurrency: payment.currency,
      orderTotalAmount: order.totalAmount,
      orderCurrency: order.baseCurrency,
    });

    // Validate stock before durable capture so we never mark CAPTURED then fail.
    await assertStockAvailable(tx, order.id);

    const now = new Date();
    const timestampPatch = paymentLifecycleTimestampPatch(
      "CAPTURED",
      now,
      payment,
    );

    const updated = await tx
      .update(payments)
      .set({
        status: "CAPTURED",
        providerReference: input.providerReference,
        metadata: mergeSafeMetadata(payment.metadata, input.safeMetadata),
        updatedAt: now,
        ...timestampPatch,
      })
      .where(
        and(eq(payments.id, payment.id), eq(payments.status, "PENDING")),
      )
      .returning({ id: payments.id });

    if (updated.length === 0) {
      const [again] = await tx
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id))
        .limit(1);

      if (again?.status === "CAPTURED") {
        return {
          type: "already_processed" as const,
          orderId: order.id,
          paymentId: payment.id,
          orderNumber: order.orderNumber,
        };
      }

      throw new InvalidPaymentTransitionError(
        again?.status ?? payment.status,
        "CAPTURED",
      );
    }

    await tx
      .update(orders)
      .set({ paymentStatus: "CAPTURED", updatedAt: now })
      .where(eq(orders.id, order.id));

    await applyStockDecrementOnce(tx, order.id, order.orderNumber, now);

    await convertSourceCartOnce(tx, {
      sourceCartId: order.sourceCartId,
      metadata: payment.metadata,
      now,
      orderId: order.id,
      paymentId: payment.id,
      provider: payment.provider,
      attemptNumber: payment.attemptNumber,
    });

    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: order.id,
      eventType: "PAYMENT_PROVIDER",
      fromState: payment.status,
      toState: "CAPTURED",
      isCustomerVisible: true,
      provider: payment.provider,
      providerEventId: input.providerEventId ?? null,
      payload: buildSafePaymentEventPayload({
        kind: "PAYMENT_CAPTURED",
        provider: payment.provider,
        paymentId: payment.id,
        attemptNumber: payment.attemptNumber,
        providerReference: input.providerReference,
        status: "CAPTURED",
        verifiedAmount: input.verifiedAmount,
        verifiedCurrency: input.verifiedCurrency,
      }),
    });

    paymentMetrics.increment(PAYMENT_METRIC_NAMES.captured, {
      provider: payment.provider,
      operation: "confirm",
      normalizedStatus: "captured",
      resultClass: "success",
    });
    logPaymentInfo("payment.captured", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      provider: payment.provider,
      attemptNumber: payment.attemptNumber,
      operation: "confirm_payment",
      normalizedState: "captured",
      idempotentReplay: false,
    });

    return {
      type: "captured" as const,
      orderId: order.id,
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      locale: order.locale,
    };
  });

  if (result.type === "captured") {
    scheduleOrderEmails({
      kind: "payment_captured",
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
    orderNumber: result.orderNumber,
  };
}

async function recordConfirmationReplay(
  tx: DatabaseTransaction,
  args: {
    orderId: string;
    payment: typeof payments.$inferSelect;
    input: ConfirmPaymentInput;
  },
): Promise<void> {
  const { orderId, payment, input } = args;
  if (!input.providerEventId) {
    return;
  }

  const [existing] = await tx
    .select({ id: orderEvents.id })
    .from(orderEvents)
    .where(
      and(
        eq(orderEvents.provider, payment.provider),
        eq(orderEvents.providerEventId, input.providerEventId),
      ),
    )
    .limit(1);

  if (existing) {
    return;
  }

  await tx.insert(orderEvents).values({
    id: createId(),
    orderId,
    eventType: "PAYMENT_PROVIDER",
    fromState: "CAPTURED",
    toState: "CAPTURED",
    isCustomerVisible: false,
    provider: payment.provider,
    providerEventId: `${input.providerEventId}:confirmation-replay`,
    payload: buildSafePaymentEventPayload({
      kind: "PAYMENT_CONFIRMATION_REPLAYED",
      provider: payment.provider,
      paymentId: payment.id,
      attemptNumber: payment.attemptNumber,
      providerReference: payment.providerReference,
      status: "CAPTURED",
      verifiedAmount: input.verifiedAmount,
      verifiedCurrency: input.verifiedCurrency,
    }),
  });
}

async function assertStockAvailable(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<void> {
  const [existing] = await tx
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.orderId, orderId),
        eq(stockMovements.reason, "ORDER"),
      ),
    )
    .limit(1);

  if (existing) {
    return;
  }

  const quantityByProduct = await quantityByProductForOrder(tx, orderId);
  for (const [productId, needed] of quantityByProduct) {
    const [locked] = await tx
      .select({ stockOnHand: products.stockOnHand })
      .from(products)
      .where(eq(products.id, productId))
      .for("update")
      .limit(1);

    if (!locked || locked.stockOnHand < needed) {
      throw new InsufficientStockAtConfirmationError();
    }
  }
}

async function applyStockDecrementOnce(
  tx: DatabaseTransaction,
  orderId: string,
  orderNumber: string,
  now: Date,
): Promise<void> {
  const [existing] = await tx
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.orderId, orderId),
        eq(stockMovements.reason, "ORDER"),
      ),
    )
    .limit(1);

  if (existing) {
    return;
  }

  const quantityByProduct = await quantityByProductForOrder(tx, orderId);

  for (const [productId, needed] of quantityByProduct) {
    const [locked] = await tx
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .for("update")
      .limit(1);

    if (!locked || locked.stockOnHand < needed) {
      throw new InsufficientStockAtConfirmationError();
    }

    const nextStock = locked.stockOnHand - needed;

    await tx
      .update(products)
      .set({
        stockOnHand: nextStock,
        version: sql`${products.version} + 1`,
        updatedAt: now,
      })
      .where(eq(products.id, productId));

    await tx.insert(stockMovements).values({
      id: createId(),
      productId,
      delta: -needed,
      reason: "ORDER",
      orderId,
      resultingBalance: nextStock,
      correlationId: orderNumber,
    });
  }
}

async function quantityByProductForOrder(
  tx: DatabaseTransaction,
  orderId: string,
): Promise<Map<string, number>> {
  const lines = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const quantityByProduct = new Map<string, number>();
  for (const line of lines) {
    if (!line.productId) continue;
    quantityByProduct.set(
      line.productId,
      (quantityByProduct.get(line.productId) ?? 0) + line.quantity,
    );
  }
  return quantityByProduct;
}

async function convertSourceCartOnce(
  tx: DatabaseTransaction,
  args: {
    sourceCartId: string | null;
    metadata: Record<string, unknown> | null;
    now: Date;
    orderId: string;
    paymentId: string;
    provider: string;
    attemptNumber: number;
  },
): Promise<void> {
  const meta = readSourceCartMetadata(args.metadata);
  const cartId = args.sourceCartId ?? meta.sourceCartId ?? null;

  if (!cartId) {
    await recordCartCleanupSkipped(tx, args, "missing_source_cart");
    return;
  }

  const [cart] = await tx
    .select()
    .from(carts)
    .where(eq(carts.id, cartId))
    .for("update")
    .limit(1);

  if (!cart) {
    await recordCartCleanupSkipped(tx, args, "cart_deleted");
    return;
  }

  if (cart.status !== "ACTIVE") {
    await recordCartCleanupSkipped(tx, args, "cart_not_active");
    return;
  }

  if (meta.sourceCartFingerprint) {
    const items = await tx
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    const fingerprint = fingerprintCartItems(items);
    if (fingerprint !== meta.sourceCartFingerprint) {
      await recordCartCleanupSkipped(tx, args, "fingerprint_mismatch");
      return;
    }
  }

  await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await tx
    .update(carts)
    .set({ status: "CONVERTED", updatedAt: args.now })
    .where(eq(carts.id, cart.id));
}

async function recordCartCleanupSkipped(
  tx: DatabaseTransaction,
  args: {
    orderId: string;
    paymentId: string;
    provider: string;
    attemptNumber: number;
  },
  reason: string,
): Promise<void> {
  await tx.insert(orderEvents).values({
    id: createId(),
    orderId: args.orderId,
    eventType: "PAYMENT_PROVIDER",
    fromState: "CAPTURED",
    toState: "CAPTURED",
    isCustomerVisible: false,
    provider: args.provider,
    payload: {
      kind: "CART_CLEANUP_SKIPPED",
      reason,
      paymentId: args.paymentId,
      attemptNumber: args.attemptNumber,
      provider: args.provider,
      status: "CAPTURED",
    },
  });
}

function readSourceCartMetadata(
  metadata: Record<string, unknown> | null,
): {
  sourceCartId?: string;
  sourceCartFingerprint?: string;
} {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }
  return {
    sourceCartId:
      typeof metadata.sourceCartId === "string"
        ? metadata.sourceCartId
        : undefined,
    sourceCartFingerprint:
      typeof metadata.sourceCartFingerprint === "string"
        ? metadata.sourceCartFingerprint
        : undefined,
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
