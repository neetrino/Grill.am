import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { orders } from "@/db/schema";
import {
  generateGuestOrderAccessToken,
  verifyGuestOrderAccessToken,
} from "@/features/payments/domain/order-access-token";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

describe("guest order access (DB-backed)", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  it("grants access only with the matching raw token", async () => {
    const token = generateGuestOrderAccessToken();
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        guestAccessTokenHash: token.tokenHash,
        guestAccessExpiresAt: token.expiresAt,
      }),
    );

    const [order] = await db.withTx(async (tx) =>
      tx.select().from(orders).where(eq(orders.id, fixture.orderId)).limit(1),
    );

    expect(
      verifyGuestOrderAccessToken(
        token.rawToken,
        order?.guestAccessTokenHash,
        order?.guestAccessExpiresAt,
      ),
    ).toBe(true);

    expect(
      verifyGuestOrderAccessToken(
        "wrong-token",
        order?.guestAccessTokenHash,
        order?.guestAccessExpiresAt,
      ),
    ).toBe(false);

    // Order number alone is never enough — there is no hash without the raw token.
    expect(
      verifyGuestOrderAccessToken(
        fixture.orderNumber,
        order?.guestAccessTokenHash,
        order?.guestAccessExpiresAt,
      ),
    ).toBe(false);

    const other = generateGuestOrderAccessToken();
    expect(
      verifyGuestOrderAccessToken(
        other.rawToken,
        order?.guestAccessTokenHash,
        order?.guestAccessExpiresAt,
      ),
    ).toBe(false);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("denies expired tokens", async () => {
    const token = generateGuestOrderAccessToken();
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        guestAccessTokenHash: token.tokenHash,
        guestAccessExpiresAt: new Date(Date.now() - 1000),
      }),
    );

    const [order] = await db.withTx(async (tx) =>
      tx.select().from(orders).where(eq(orders.id, fixture.orderId)).limit(1),
    );

    expect(
      verifyGuestOrderAccessToken(
        token.rawToken,
        order?.guestAccessTokenHash,
        order?.guestAccessExpiresAt,
      ),
    ).toBe(false);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
