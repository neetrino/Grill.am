import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import {
  carts,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
} from "@/db/schema";
import { createId } from "@/lib/id";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

describe("payment schema constraints", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("rejects duplicate (order_id, attempt_number)", async () => {
    const fixture = await db.withTx((tx) => createPaymentFixture(tx));
    await expect(
      db.withTx(async (tx) => {
        await tx.insert(payments).values({
          id: createId(),
          orderId: fixture.orderId,
          provider: "arca",
          method: "ARCA",
          amount: fixture.totalAmount,
          currency: "AMD",
          status: "PENDING",
          attemptNumber: 1,
        });
      }),
    ).rejects.toThrow();
    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("allows the same attempt number on different orders", async () => {
    const a = await db.withTx((tx) =>
      createPaymentFixture(tx, { attemptNumber: 1 }),
    );
    const b = await db.withTx((tx) =>
      createPaymentFixture(tx, { attemptNumber: 1 }),
    );
    expect(a.paymentId).not.toBe(b.paymentId);
    await db.withTx((tx) => cleanupPaymentFixture(tx, a));
    await db.withTx((tx) => cleanupPaymentFixture(tx, b));
  });

  it("rejects duplicate (provider, provider_reference)", async () => {
    const sharedRef = `ref-${createId()}`;
    const a = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "arca",
        providerReference: sharedRef,
      }),
    );
    const b = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "arca",
        providerReference: null,
      }),
    );
    await expect(
      db.withTx(async (tx) => {
        await tx
          .update(payments)
          .set({ providerReference: sharedRef })
          .where(eq(payments.id, b.paymentId));
      }),
    ).rejects.toThrow();
    await db.withTx((tx) => cleanupPaymentFixture(tx, a));
    await db.withTx((tx) => cleanupPaymentFixture(tx, b));
  });

  it("allows the same provider_reference across different providers", async () => {
    const sharedRef = `ns-${createId()}`;
    const a = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "arca",
        providerReference: sharedRef,
      }),
    );
    const b = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerReference: sharedRef,
      }),
    );
    expect(b.paymentId).toBeTruthy();
    await db.withTx((tx) => cleanupPaymentFixture(tx, a));
    await db.withTx((tx) => cleanupPaymentFixture(tx, b));
  });

  it("allows multiple null provider references", async () => {
    const a = await db.withTx((tx) =>
      createPaymentFixture(tx, { providerReference: null }),
    );
    const b = await db.withTx((tx) =>
      createPaymentFixture(tx, { providerReference: null }),
    );
    expect(a.paymentId).not.toBe(b.paymentId);
    await db.withTx((tx) => cleanupPaymentFixture(tx, a));
    await db.withTx((tx) => cleanupPaymentFixture(tx, b));
  });

  it("rejects attempt_number <= 0", async () => {
    const fixture = await db.withTx((tx) => createPaymentFixture(tx));
    await expect(
      db.withTx(async (tx) => {
        await tx.insert(payments).values({
          id: createId(),
          orderId: fixture.orderId,
          provider: "arca",
          method: "ARCA",
          amount: fixture.totalAmount,
          currency: "AMD",
          status: "PENDING",
          attemptNumber: 0,
        });
      }),
    ).rejects.toThrow();
    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("sets source_cart_id null when cart is deleted", async () => {
    const fixture = await db.withTx((tx) => createPaymentFixture(tx));
    await db.withTx(async (tx) => {
      await tx.delete(carts).where(eq(carts.id, fixture.cartId));
      const [order] = await tx
        .select({ sourceCartId: orders.sourceCartId })
        .from(orders)
        .where(eq(orders.id, fixture.orderId))
        .limit(1);
      expect(order?.sourceCartId).toBeNull();

      await tx
        .delete(orderEvents)
        .where(eq(orderEvents.orderId, fixture.orderId));
      await tx.delete(payments).where(eq(payments.orderId, fixture.orderId));
      await tx.delete(orderItems).where(eq(orderItems.orderId, fixture.orderId));
      await tx.delete(orders).where(eq(orders.id, fixture.orderId));
      await tx.delete(products).where(eq(products.id, fixture.productId));
    });
  });

  it("persists guest access token hash fields", async () => {
    const expires = new Date(Date.now() + 60_000);
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        guestAccessTokenHash: "abc123hash",
        guestAccessExpiresAt: expires,
      }),
    );
    const [order] = await db.withTx(async (tx) =>
      tx
        .select({
          hash: orders.guestAccessTokenHash,
          exp: orders.guestAccessExpiresAt,
        })
        .from(orders)
        .where(eq(orders.id, fixture.orderId))
        .limit(1),
    );
    expect(order?.hash).toBe("abc123hash");
    expect(order?.exp?.getTime()).toBe(expires.getTime());
    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
