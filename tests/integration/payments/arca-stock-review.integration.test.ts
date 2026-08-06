import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { orders, payments, stockMovements } from "@/db/schema";
import { applyVerifiedArcaStatus } from "@/features/payments/providers/arca/process-arca-status";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

describe("ARCA provider-paid / stock-unavailable", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("captures payment and marks order REQUIRES_REVIEW when stock is gone", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        stockOnHand: 0,
        provider: "arca",
        providerReference: null,
      }),
    );

    const result = await applyVerifiedArcaStatus({
      paymentId: fixture.paymentId,
      orderId: fixture.orderId,
      providerReference: `arca-ref-${fixture.paymentId}`,
      localOrderNumber: `a1-${fixture.paymentId.replace(/-/g, "").slice(0, 20)}`,
      orderStatus: 2,
      normalizedState: "captured",
      verifiedAmount: fixture.totalAmount,
      verifiedCurrency: "AMD",
      providerEventId: `arca:status:test:${fixture.paymentId}`,
      officialMeaning: "Full authorization / funds deposited (DEPOSITED)",
    });

    expect(result.outcome).toBe("captured_requires_review");

    const [payment] = await db.withTx(async (tx) =>
      tx
        .select()
        .from(payments)
        .where(eq(payments.id, fixture.paymentId))
        .limit(1),
    );
    expect(payment?.status).toBe("CAPTURED");

    const [order] = await db.withTx(async (tx) =>
      tx
        .select()
        .from(orders)
        .where(eq(orders.id, fixture.orderId))
        .limit(1),
    );
    expect(order?.paymentStatus).toBe("CAPTURED");
    expect(order?.status).toBe("REQUIRES_REVIEW");

    const movements = await db.withTx(async (tx) =>
      tx
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.orderId, fixture.orderId)),
    );
    expect(movements).toHaveLength(0);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
