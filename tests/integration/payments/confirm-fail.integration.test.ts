import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { carts, payments, products, stockMovements } from "@/db/schema";
import { confirmPayment } from "@/features/payments/application/confirm-payment";
import { failPayment } from "@/features/payments/application/fail-payment";
import {
  InsufficientStockAtConfirmationError,
  InvalidPaymentTransitionError,
  PaymentAmountMismatchError,
  PaymentAlreadyCapturedError,
  PaymentCurrencyMismatchError,
} from "@/features/payments/domain/errors";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

describe("confirmPayment / failPayment integration", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("captures once under concurrent confirmations", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );

    const results = await Promise.allSettled([
      confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: `cap-${fixture.paymentId}`,
        providerEventId: `evt-${fixture.paymentId}-a`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      }),
      confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: `cap-${fixture.paymentId}`,
        providerEventId: `evt-${fixture.paymentId}-b`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const values = fulfilled.map(
      (r) => (r as PromiseFulfilledResult<{ type: string }>).value.type,
    );
    expect(values.filter((t) => t === "captured").length).toBe(1);
    expect(
      values.every((t) => t === "captured" || t === "already_processed"),
    ).toBe(true);

    const [payment] = await db.withTx(async (tx) =>
      tx
        .select()
        .from(payments)
        .where(eq(payments.id, fixture.paymentId))
        .limit(1),
    );
    expect(payment?.status).toBe("CAPTURED");
    expect(payment?.capturedAt).toBeTruthy();
    expect(payment?.providerReference).toBe(`cap-${fixture.paymentId}`);

    const movements = await db.withTx(async (tx) =>
      tx
        .select()
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.orderId, fixture.orderId),
            eq(stockMovements.reason, "ORDER"),
          ),
        ),
    );
    expect(movements).toHaveLength(1);

    const [product] = await db.withTx(async (tx) =>
      tx
        .select({ stockOnHand: products.stockOnHand })
        .from(products)
        .where(eq(products.id, fixture.productId))
        .limit(1),
    );
    expect(product?.stockOnHand).toBe(4);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("rejects wrong amount and currency", async () => {
    const fixture = await db.withTx((tx) => createPaymentFixture(tx));

    await expect(
      confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: "bad-amount",
        verifiedAmount: fixture.totalAmount + 1,
        verifiedCurrency: "AMD",
      }),
    ).rejects.toBeInstanceOf(PaymentAmountMismatchError);

    await expect(
      confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: "bad-currency",
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "USD",
      }),
    ).rejects.toBeInstanceOf(PaymentCurrencyMismatchError);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("cannot capture failed or cancelled attempts", async () => {
    const failed = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "FAILED" }),
    );
    await expect(
      confirmPayment({
        paymentId: failed.paymentId,
        providerReference: "x",
        verifiedAmount: failed.totalAmount,
        verifiedCurrency: "AMD",
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentTransitionError);
    await db.withTx((tx) => cleanupPaymentFixture(tx, failed));

    const cancelled = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "CANCELLED" }),
    );
    await expect(
      confirmPayment({
        paymentId: cancelled.paymentId,
        providerReference: "y",
        verifiedAmount: cancelled.totalAmount,
        verifiedCurrency: "AMD",
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentTransitionError);
    await db.withTx((tx) => cleanupPaymentFixture(tx, cancelled));
  });

  it("converts only the originating cart and skips on fingerprint mismatch", async () => {
    const fixture = await db.withTx(async (tx) => {
      const base = await createPaymentFixture(tx, { stockOnHand: 3 });
      await tx
        .update(payments)
        .set({
          metadata: { sourceCartFingerprint: "mismatch:99" },
        })
        .where(eq(payments.id, base.paymentId));
      return base;
    });

    await confirmPayment({
      paymentId: fixture.paymentId,
      providerReference: `cart-${fixture.paymentId}`,
      verifiedAmount: fixture.totalAmount,
      verifiedCurrency: "AMD",
    });

    const [cart] = await db.withTx(async (tx) =>
      tx
        .select({ status: carts.status })
        .from(carts)
        .where(eq(carts.id, fixture.cartId))
        .limit(1),
    );
    expect(cart?.status).toBe("ACTIVE");

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("failPayment sets failed_at and does not mutate stock/cart", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 8 }),
    );

    const result = await failPayment({
      paymentId: fixture.paymentId,
      outcome: "FAILED",
      errorCode: "USER_CANCEL",
    });
    expect(result.type).toBe("updated");

    const replay = await failPayment({
      paymentId: fixture.paymentId,
      outcome: "FAILED",
    });
    expect(replay.type).toBe("already_processed");

    const [payment] = await db.withTx(async (tx) =>
      tx
        .select()
        .from(payments)
        .where(eq(payments.id, fixture.paymentId))
        .limit(1),
    );
    expect(payment?.status).toBe("FAILED");
    expect(payment?.failedAt).toBeTruthy();

    const movements = await db.withTx(async (tx) =>
      tx
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.orderId, fixture.orderId)),
    );
    expect(movements).toHaveLength(0);

    const [cart] = await db.withTx(async (tx) =>
      tx
        .select({ status: carts.status })
        .from(carts)
        .where(eq(carts.id, fixture.cartId))
        .limit(1),
    );
    expect(cart?.status).toBe("ACTIVE");

    await expect(
      failPayment({
        paymentId: fixture.paymentId,
        outcome: "CANCELLED",
      }),
    ).rejects.toBeInstanceOf(InvalidPaymentTransitionError);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("cannot fail a captured payment", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "CAPTURED", stockOnHand: 2 }),
    );
    await expect(
      failPayment({
        paymentId: fixture.paymentId,
        outcome: "FAILED",
      }),
    ).rejects.toBeInstanceOf(PaymentAlreadyCapturedError);
    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("refuses capture when stock is insufficient", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 0 }),
    );
    await expect(
      confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: "nostock",
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      }),
    ).rejects.toBeInstanceOf(InsufficientStockAtConfirmationError);

    const [payment] = await db.withTx(async (tx) =>
      tx
        .select({ status: payments.status })
        .from(payments)
        .where(eq(payments.id, fixture.paymentId))
        .limit(1),
    );
    expect(payment?.status).toBe("PENDING");

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
