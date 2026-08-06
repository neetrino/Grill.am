import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { orders, outboxEvents } from "@/db/schema";
import { enqueuePaymentNotification } from "@/features/payments/application/enqueue-payment-notification";
import {
  claimOutboxBatch,
  markOutboxFailed,
  markOutboxRetry,
  markOutboxSent,
} from "@/features/outbox/application/claim-outbox";
import { processOutboxOnce } from "@/features/outbox/application/process-outbox";
import { computeOutboxBackoffMs } from "@/features/outbox/domain/backoff";
import { createCaptureEmailDelivery, clearCapturedEmails } from "@/lib/email/capture-adapter";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";
import { createId } from "@/lib/id";

describe("outbox durable consumer", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("computes bounded backoff", () => {
    const d1 = computeOutboxBackoffMs({ attemptNumber: 1, jitterRatio: 0 });
    const d3 = computeOutboxBackoffMs({ attemptNumber: 3, jitterRatio: 0 });
    expect(d3).toBeGreaterThan(d1);
    expect(
      computeOutboxBackoffMs({
        attemptNumber: 20,
        jitterRatio: 0,
        maxDelayMs: 60_000,
      }),
    ).toBe(60_000);
  });

  it("dedupe key is unique under concurrent enqueue", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "CAPTURED", provider: "arca" }),
    );

    try {
      const key = `payment-captured:${fixture.paymentId}:customer`;
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          db.withTx((tx) =>
            enqueuePaymentNotification(tx, {
              type: "ONLINE_PAYMENT_CAPTURED",
              orderId: fixture.orderId,
              orderNumber: fixture.orderNumber,
              locale: "en",
              dedupeKey: key,
              recipientRole: "customer",
            }),
          ),
        ),
      );

      const enqueued = results.filter((row) => row.enqueued);
      expect(enqueued).toHaveLength(1);

      const rows = await db.withTx((tx) =>
        tx
          .select()
          .from(outboxEvents)
          .where(eq(outboxEvents.dedupeKey, key)),
      );
      expect(rows).toHaveLength(1);
    } finally {
      await db.withTx(async (tx) => {
        await tx
          .delete(outboxEvents)
          .where(eq(outboxEvents.aggregateId, fixture.orderId));
        await cleanupPaymentFixture(tx, fixture);
      });
    }
  });

  it("SKIP LOCKED claim gives disjoint rows to concurrent workers", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "CAPTURED", provider: "arca" }),
    );

    const ids: string[] = [];
    try {
      await db.withTx(async (tx) => {
        for (let i = 0; i < 4; i += 1) {
          const id = createId();
          ids.push(id);
          await tx.insert(outboxEvents).values({
            id,
            eventType: "ONLINE_PAYMENT_CAPTURED",
            aggregateType: "order",
            aggregateId: fixture.orderId,
            dedupeKey: `claim-test:${fixture.orderId}:${i}`,
            payload: {
              dedupeKey: `claim-test:${fixture.orderId}:${i}`,
              orderNumber: fixture.orderNumber,
              locale: "en",
              recipientRole: "customer",
            },
            status: "PENDING",
            maxAttempts: 8,
          });
        }
      });

      const [a, b] = await Promise.all([
        db.withTx((tx) =>
          claimOutboxBatch(tx, { workerId: "w-a", batchSize: 2 }),
        ),
        db.withTx((tx) =>
          claimOutboxBatch(tx, { workerId: "w-b", batchSize: 2 }),
        ),
      ]);

      const claimedIds = [...a, ...b].map((row) => row.id);
      expect(new Set(claimedIds).size).toBe(claimedIds.length);
      expect(claimedIds.length).toBeGreaterThanOrEqual(2);
    } finally {
      await db.withTx(async (tx) => {
        for (const id of ids) {
          await tx.delete(outboxEvents).where(eq(outboxEvents.id, id));
        }
        await cleanupPaymentFixture(tx, fixture);
      });
    }
  });

  it("processOutboxOnce marks SENT via capture delivery", async () => {
    clearCapturedEmails("e2e-test");
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "CAPTURED", provider: "arca" }),
    );

    const dedupeKey = `payment-captured:${fixture.paymentId}:customer-process`;
    try {
      // Isolate from leftover PENDING rows in shared test DB.
      await db.withTx(async (tx) => {
        await tx
          .update(outboxEvents)
          .set({ availableAt: new Date(Date.now() + 86_400_000) })
          .where(eq(outboxEvents.status, "PENDING"));
      });

      await db.withTx((tx) =>
        enqueuePaymentNotification(tx, {
          type: "ONLINE_PAYMENT_CAPTURED",
          orderId: fixture.orderId,
          orderNumber: fixture.orderNumber,
          locale: "en",
          dedupeKey,
          recipientRole: "customer",
        }),
      );

      await db.withTx(async (tx) => {
        await tx
          .update(outboxEvents)
          .set({ availableAt: new Date(Date.now() - 1_000) })
          .where(eq(outboxEvents.dedupeKey, dedupeKey));
      });

      const pending = await db.withTx((tx) =>
        tx
          .select()
          .from(outboxEvents)
          .where(eq(outboxEvents.dedupeKey, dedupeKey))
          .limit(1),
      );
      expect(pending[0]?.status).toBe("PENDING");

      const delivery = createCaptureEmailDelivery("e2e-test");
      const summary = await processOutboxOnce({
        batchSize: 5,
        delivery,
        workerId: "test-worker",
        withTx: db.withTx,
        loadOrder: async (orderId) => {
          const [order] = await db.db
            .select()
            .from(orders)
            .where(eq(orders.id, orderId))
            .limit(1);
          return order ?? null;
        },
      });

      expect(summary.claimed).toBeGreaterThanOrEqual(1);
      expect(summary.sent).toBeGreaterThanOrEqual(1);

      const [row] = await db.withTx((tx) =>
        tx
          .select()
          .from(outboxEvents)
          .where(eq(outboxEvents.dedupeKey, dedupeKey))
          .limit(1),
      );
      expect(row?.status).toBe("COMPLETED");
      expect(row?.sentAt).toBeTruthy();
    } finally {
      await db.withTx(async (tx) => {
        await tx
          .delete(outboxEvents)
          .where(eq(outboxEvents.aggregateId, fixture.orderId));
        // Restore delayed PENDING rows so later tests are not starved.
        await tx
          .update(outboxEvents)
          .set({ availableAt: new Date() })
          .where(eq(outboxEvents.status, "PENDING"));
        await cleanupPaymentFixture(tx, fixture);
      });
    }
  });

  it("retry then fail respects max attempts markers", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { paymentStatus: "CAPTURED", provider: "arca" }),
    );
    const id = createId();
    try {
      await db.withTx(async (tx) => {
        await tx.insert(outboxEvents).values({
          id,
          eventType: "ONLINE_PAYMENT_CAPTURED",
          aggregateType: "order",
          aggregateId: fixture.orderId,
          dedupeKey: `retry-test:${id}`,
          payload: {
            orderNumber: fixture.orderNumber,
            locale: "en",
            recipientRole: "customer",
          },
          status: "PROCESSING",
          attemptCount: 1,
          maxAttempts: 2,
          claimedAt: new Date(),
          claimedBy: "w",
        });

        await markOutboxRetry(tx, {
          id,
          attemptCount: 2,
          availableAt: new Date(Date.now() + 60_000),
          errorCode: "TRANSPORT",
          safeError: "temporary",
        });
      });

      const [retried] = await db.withTx((tx) =>
        tx.select().from(outboxEvents).where(eq(outboxEvents.id, id)).limit(1),
      );
      expect(retried?.status).toBe("PENDING");

      await db.withTx((tx) =>
        markOutboxFailed(tx, {
          id,
          attemptCount: 2,
          errorCode: "TRANSPORT",
          safeError: "permanent",
        }),
      );
      const [failed] = await db.withTx((tx) =>
        tx.select().from(outboxEvents).where(eq(outboxEvents.id, id)).limit(1),
      );
      expect(failed?.status).toBe("FAILED");
      expect(failed?.failedAt).toBeTruthy();

      await db.withTx((tx) =>
        markOutboxSent(tx, { id, providerMessageId: "msg-1" }),
      );
      // After FAILED we still allow explicit sent mark in this helper unit —
      // production worker never calls sent after failed; assert helper works.
      const [sent] = await db.withTx((tx) =>
        tx.select().from(outboxEvents).where(eq(outboxEvents.id, id)).limit(1),
      );
      expect(sent?.status).toBe("COMPLETED");
    } finally {
      await db.withTx(async (tx) => {
        await tx.delete(outboxEvents).where(eq(outboxEvents.id, id));
        await cleanupPaymentFixture(tx, fixture);
      });
    }
  });
});
