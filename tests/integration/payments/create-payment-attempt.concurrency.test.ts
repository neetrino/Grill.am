import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { payments } from "@/db/schema";
import { createPaymentAttempt } from "@/features/payments/application/create-payment-attempt";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

describe("createPaymentAttempt concurrency", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("allocates distinct attempt numbers under order lock", async () => {
    const fixture = await db.withTx((tx) => createPaymentFixture(tx));

    const created = await Promise.all([
      db.withTx((tx) =>
        createPaymentAttempt({
          tx,
          orderId: fixture.orderId,
          provider: "arca",
          method: "arca",
          amount: fixture.totalAmount,
          currency: "AMD",
        }),
      ),
      db.withTx((tx) =>
        createPaymentAttempt({
          tx,
          orderId: fixture.orderId,
          provider: "arca",
          method: "arca",
          amount: fixture.totalAmount,
          currency: "AMD",
        }),
      ),
    ]);

    const numbers = created.map((row) => row.attemptNumber).sort((a, b) => a - b);
    expect(new Set(numbers).size).toBe(2);
    expect(numbers[0]).toBeGreaterThanOrEqual(2);

    const rows = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.orderId, fixture.orderId)),
    );
    expect(rows.length).toBeGreaterThanOrEqual(3);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("five concurrent attempts produce unique numbers", async () => {
    const fixture = await db.withTx((tx) => createPaymentFixture(tx));

    const created = await Promise.all(
      Array.from({ length: 5 }, () =>
        db.withTx((tx) =>
          createPaymentAttempt({
            tx,
            orderId: fixture.orderId,
            provider: "idram",
            method: "idram",
            amount: fixture.totalAmount,
            currency: "AMD",
          }),
        ),
      ),
    );

    const numbers = created.map((row) => row.attemptNumber);
    expect(new Set(numbers).size).toBe(5);
    expect(numbers.every((n) => n > 1)).toBe(true);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
