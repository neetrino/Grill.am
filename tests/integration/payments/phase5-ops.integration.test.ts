import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { outboxEvents, payments } from "@/db/schema";
import { confirmPayment } from "@/features/payments/application/confirm-payment";
import { enqueuePaymentNotification } from "@/features/payments/application/enqueue-payment-notification";
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

  it("duplicate notification dedupeKey enqueues once", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        stockOnHand: 5,
        paymentStatus: "CAPTURED",
        provider: "arca",
      }),
    );

    try {
      const first = await db.withTx((tx) =>
        enqueuePaymentNotification(tx, {
          type: "ONLINE_PAYMENT_CAPTURED",
          orderId: fixture.orderId,
          orderNumber: fixture.orderNumber,
          locale: "en",
          dedupeKey: `payment-captured:${fixture.paymentId}:customer`,
          recipientRole: "customer",
        }),
      );
      const second = await db.withTx((tx) =>
        enqueuePaymentNotification(tx, {
          type: "ONLINE_PAYMENT_CAPTURED",
          orderId: fixture.orderId,
          orderNumber: fixture.orderNumber,
          locale: "en",
          dedupeKey: `payment-captured:${fixture.paymentId}:customer`,
          recipientRole: "customer",
        }),
      );

      expect(first.enqueued).toBe(true);
      expect(second.enqueued).toBe(false);
      expect(second.outboxId).toBe(first.outboxId);

      const rows = await db.withTx((tx) =>
        tx
          .select()
          .from(outboxEvents)
          .where(
            and(
              eq(outboxEvents.aggregateType, "order"),
              eq(outboxEvents.aggregateId, fixture.orderId),
              eq(outboxEvents.eventType, "ONLINE_PAYMENT_CAPTURED"),
            ),
          ),
      );
      const matching = rows.filter(
        (row) =>
          row.dedupeKey ===
            `payment-captured:${fixture.paymentId}:customer` ||
          row.payload?.dedupeKey ===
            `payment-captured:${fixture.paymentId}:customer`,
      );
      expect(matching).toHaveLength(1);
    } finally {
      await db.withTx(async (tx) => {
        await tx
          .delete(outboxEvents)
          .where(eq(outboxEvents.aggregateId, fixture.orderId));
        await cleanupPaymentFixture(tx, fixture);
      });
    }
  });
});
