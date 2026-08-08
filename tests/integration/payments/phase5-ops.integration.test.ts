import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { payments } from "@/db/schema";
import { confirmPayment } from "@/features/payments/application/confirm-payment";
import { expirePaymentAttempt } from "@/features/payments/application/expire-payment-attempt";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

describe("Phase 5 payment ops", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("expire does not downgrade CAPTURED when confirm wins", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        stockOnHand: 5,
        paymentStatus: "PENDING",
        provider: "arca",
        expiresAt: new Date(Date.now() - 60_000),
      }),
    );

    try {
      await Promise.all([
        expirePaymentAttempt({ paymentId: fixture.paymentId }),
        confirmPayment({
          paymentId: fixture.paymentId,
          providerReference: `cap-exp-${fixture.paymentId}`,
          providerEventId: `evt-exp-${fixture.paymentId}`,
          verifiedAmount: fixture.totalAmount,
          verifiedCurrency: "AMD",
        }).catch(() => null),
      ]);

      const [row] = await db.withTx((tx) =>
        tx
          .select()
          .from(payments)
          .where(eq(payments.id, fixture.paymentId))
          .limit(1),
      );

      // If confirm succeeded, CAPTURED; if expire won first, CANCELLED is ok
      // but confirm after expire should throw — never CAPTURED→FAILED.
      expect(["CAPTURED", "CANCELLED"]).toContain(row?.status);
      if (row?.status === "CAPTURED") {
        expect(row.capturedAt).toBeTruthy();
      }
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });
});
