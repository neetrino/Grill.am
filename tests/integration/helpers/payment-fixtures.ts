import { eq } from "drizzle-orm";

import {
  carts,
  cartItems,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  stockMovements,
} from "@/db/schema";
import type { DatabaseTransaction } from "@/db/transaction";
import { createId } from "@/lib/id";
import { fingerprintCartItems } from "@/features/payments/domain/cart-fingerprint";

type Tx = DatabaseTransaction;

export type PaymentFixture = {
  productId: string;
  cartId: string;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  totalAmount: number;
};

/** Creates a minimal product/cart/order/payment graph for payment lifecycle tests. */
export async function createPaymentFixture(
  tx: Tx,
  options?: {
    stockOnHand?: number;
    paymentStatus?: "PENDING" | "FAILED" | "CANCELLED" | "CAPTURED";
    provider?: string;
    providerReference?: string | null;
    providerOrderNumber?: string | null;
    expiresAt?: Date | null;
    guestAccessTokenHash?: string | null;
    guestAccessExpiresAt?: Date | null;
    sourceCartId?: string | null;
    attemptNumber?: number;
  },
): Promise<PaymentFixture> {
  const productId = createId();
  const cartId = createId();
  const orderId = createId();
  const paymentId = createId();
  const orderNumber = `t${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const totalAmount = 2500;
  const now = new Date();

  await tx.insert(products).values({
    id: productId,
    sku: `SKU-${productId}`,
    status: "ACTIVE",
    priceAmount: totalAmount,
    stockOnHand: options?.stockOnHand ?? 10,
    translations: {
      hy: { title: "Test", slug: `hy-${productId}` },
      en: { title: "Test", slug: `en-${productId}` },
      ru: { title: "Test", slug: `ru-${productId}` },
    },
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(carts).values({
    id: cartId,
    guestTokenHash: `guest-${cartId}`,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(cartItems).values({
    id: createId(),
    cartId,
    productId,
    quantity: 1,
    createdAt: now,
    updatedAt: now,
  });

  const sourceCartFingerprint = fingerprintCartItems([
    { productId, quantity: 1 },
  ]);

  await tx.insert(orders).values({
    id: orderId,
    orderNumber,
    contactEmail: "payment-test@example.com",
    contactPhone: "+37400000000",
    contactName: "Payment Test",
    status: "PENDING",
    paymentStatus:
      options?.paymentStatus === "CAPTURED" ? "CAPTURED" : "PENDING",
    baseCurrency: "AMD",
    displayCurrency: "AMD",
    subtotalAmount: totalAmount,
    discountAmount: 0,
    taxAmount: 0,
    deliveryAmount: 0,
    totalAmount,
    shippingAddress: {
      recipientFirstName: "Pay",
      recipientLastName: "Test",
      phone: "+37400000000",
      countryCode: "AM",
      city: "Yerevan",
      line1: "Test",
    },
    billingAddress: {
      recipientFirstName: "Pay",
      recipientLastName: "Test",
      phone: "+37400000000",
      countryCode: "AM",
      city: "Yerevan",
      line1: "Test",
    },
    sourceCartId: options?.sourceCartId === null ? null : (options?.sourceCartId ?? cartId),
    guestAccessTokenHash: options?.guestAccessTokenHash ?? null,
    guestAccessExpiresAt: options?.guestAccessExpiresAt ?? null,
    idempotencyScopeHash: `scope-${orderId}`,
    idempotencyKeyHash: `key-${orderId}`,
    requestFingerprint: `fp-${orderId}`,
    locale: "en",
    placedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(orderItems).values({
    id: createId(),
    orderId,
    productId,
    productTitleSnapshot: "Test",
    productSkuSnapshot: `SKU-${productId}`,
    quantity: 1,
    unitBaseAmount: totalAmount,
    unitDisplayAmount: totalAmount,
    discountAmount: 0,
    lineTotalAmount: totalAmount,
    currency: "AMD",
    createdAt: now,
  });

  await tx.insert(payments).values({
    id: paymentId,
    orderId,
    provider: options?.provider ?? "arca",
    method: options?.provider === "idram" ? "IDRAM" : options?.provider === "cod" ? "COD" : "ARCA",
    providerReference: options?.providerReference ?? null,
    providerOrderNumber: options?.providerOrderNumber ?? null,
    amount: totalAmount,
    currency: "AMD",
    status: options?.paymentStatus ?? "PENDING",
    attemptNumber: options?.attemptNumber ?? 1,
    expiresAt: options?.expiresAt ?? null,
    metadata: { sourceCartFingerprint },
    createdAt: now,
    updatedAt: now,
  });

  return {
    productId,
    cartId,
    orderId,
    orderNumber,
    paymentId,
    totalAmount,
  };
}

export async function cleanupPaymentFixture(
  tx: Tx,
  fixture: PaymentFixture,
): Promise<void> {
  await tx
    .delete(stockMovements)
    .where(eq(stockMovements.orderId, fixture.orderId));
  await tx.delete(orderEvents).where(eq(orderEvents.orderId, fixture.orderId));
  await tx.delete(payments).where(eq(payments.orderId, fixture.orderId));
  await tx.delete(orderItems).where(eq(orderItems.orderId, fixture.orderId));
  await tx.delete(orders).where(eq(orders.id, fixture.orderId));
  await tx.delete(carts).where(eq(carts.id, fixture.cartId));
  await tx.delete(products).where(eq(products.id, fixture.productId));
}
