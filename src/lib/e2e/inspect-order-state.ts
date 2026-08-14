import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  cartItems,
  carts,
  orderEvents,
  orders,
  payments,
  products,
} from "@/db/schema";
import { E2E_PAYMENT_PRODUCT_SKU } from "@/lib/e2e/payment-product";

export type E2eOrderState = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    sourceCartId: string | null;
    guestAccessExpiresAt: string | null;
    hasGuestAccessToken: boolean;
    totalAmount: number;
  };
  payments: Array<{
    id: string;
    provider: string;
    method: string;
    status: string;
    attemptNumber: number;
    providerReference: string | null;
    providerOrderNumber: string | null;
    amount: number;
  }>;
  events: Array<{
    eventType: string;
    provider: string | null;
    providerEventId: string | null;
    toState: string | null;
    kind: string | null;
  }>;
  cart: {
    id: string;
    status: string;
    itemCount: number;
  } | null;
  productStock: number | null;
  adminReview: {
    visible: boolean;
    title: string;
  };
};

export async function inspectE2eOrderState(
  orderNumber: string,
): Promise<E2eOrderState | null> {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    return null;
  }

  const paymentRows = await db
    .select({
      id: payments.id,
      provider: payments.provider,
      method: payments.method,
      status: payments.status,
      attemptNumber: payments.attemptNumber,
      providerReference: payments.providerReference,
      providerOrderNumber: payments.providerOrderNumber,
      amount: payments.amount,
    })
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .orderBy(desc(payments.attemptNumber));

  const eventRows = await db
    .select({
      eventType: orderEvents.eventType,
      provider: orderEvents.provider,
      providerEventId: orderEvents.providerEventId,
      toState: orderEvents.toState,
      payload: orderEvents.payload,
    })
    .from(orderEvents)
    .where(eq(orderEvents.orderId, order.id))
    .orderBy(desc(orderEvents.createdAt));

  let cart: E2eOrderState["cart"] = null;
  if (order.sourceCartId) {
    const [cartRow] = await db
      .select({ id: carts.id, status: carts.status })
      .from(carts)
      .where(eq(carts.id, order.sourceCartId))
      .limit(1);
    if (cartRow) {
      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(cartItems)
        .where(eq(cartItems.cartId, cartRow.id));
      cart = {
        id: cartRow.id,
        status: cartRow.status,
        itemCount: Number(countRow?.count ?? 0),
      };
    }
  }

  const [product] = await db
    .select({ stockOnHand: products.stockOnHand })
    .from(products)
    .where(eq(products.sku, E2E_PAYMENT_PRODUCT_SKU))
    .limit(1);

  const adminReviewVisible =
    order.status === "REQUIRES_REVIEW" && order.paymentStatus === "CAPTURED";

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      sourceCartId: order.sourceCartId,
      guestAccessExpiresAt: order.guestAccessExpiresAt?.toISOString() ?? null,
      hasGuestAccessToken: Boolean(order.guestAccessTokenHash),
      totalAmount: order.totalAmount,
    },
    payments: paymentRows,
    events: eventRows.map((row) => ({
      eventType: row.eventType,
      provider: row.provider,
      providerEventId: row.providerEventId,
      toState: row.toState,
      kind:
        typeof row.payload?.kind === "string" ? String(row.payload.kind) : null,
    })),
    cart,
    productStock: product?.stockOnHand ?? null,
    adminReview: {
      visible: adminReviewVisible,
      title: adminReviewVisible ? "Requires review" : "",
    },
  };
}
