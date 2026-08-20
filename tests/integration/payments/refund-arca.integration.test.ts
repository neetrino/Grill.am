import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

import { resetEnvCacheForTests } from "@/config/env";
import { orders, payments, products, stockMovements } from "@/db/schema";
import { confirmPayment } from "@/features/payments/application/confirm-payment";
import { markPaymentRefunded } from "@/features/payments/application/mark-payment-refunded";
import { refundArcaPayment } from "@/features/payments/application/refund-arca-payment";
import {
  PaymentRefundInProgressError,
  PaymentRefundNotAllowedError,
} from "@/features/payments/domain/errors";
import { mergeArcaPaymentMetadata } from "@/features/payments/providers/arca/metadata";
import { ArcaBusinessError } from "@/lib/payments/arca/errors";
import type { ArcaPaymentClient } from "@/lib/payments/arca/client";
import type { ArcaStatusResponse } from "@/lib/payments/arca/schemas";
import { createId } from "@/lib/id";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

function stubArcaEnv(): void {
  vi.stubEnv("E2E_EMAIL_MODE", "capture");
  vi.stubEnv("PAYMENT_ENABLE_ARCA", "true");
  vi.stubEnv("ARCA_ENVIRONMENT", "test");
  vi.stubEnv("ARCA_PAYMENT_MODE", "one_stage");
  vi.stubEnv("ARCA_API_BASE_URL", "https://ipaytest.arca.am:8445/payment/rest");
  vi.stubEnv("ARCA_API_USERNAME", "api-user");
  vi.stubEnv("ARCA_API_PASSWORD", "api-pass");
  vi.stubEnv("ARCA_RETURN_BASE_URL", "https://grill.am");
  vi.stubEnv("ARCA_CURRENCY_CODE", "051");
  vi.stubEnv("ARCA_LANGUAGE", "en");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://grill.am");
  resetEnvCacheForTests();
}

function createFakeArcaClient(args: {
  amountMinorUnits: number;
  orderNumber: string;
  providerOrderId: string;
  reverseFailsWith?: "5" | "7";
  refundFailsWith?: "5" | "7";
}): ArcaPaymentClient {
  let orderStatus = 2;
  return {
    async register() {
      throw new Error("register is not used in refund tests");
    },
    async getOrderStatusExtended(): Promise<ArcaStatusResponse> {
      return {
        errorCode: "0",
        orderStatus,
        orderNumber: args.orderNumber,
        amount: args.amountMinorUnits,
        currency: "051",
        actionCode: 0,
      };
    },
    async reverse() {
      if (args.reverseFailsWith) {
        throw new ArcaBusinessError(
          args.reverseFailsWith,
          "ARCA reverse was rejected.",
        );
      }
      orderStatus = 3;
    },
    async refund() {
      if (args.refundFailsWith) {
        throw new ArcaBusinessError(
          args.refundFailsWith,
          "ARCA refund was rejected.",
        );
      }
      orderStatus = 4;
    },
  };
}

describe("ARCA full refund", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    stubArcaEnv();
    db = await openIntegrationDb();
  });

  afterEach(() => {
    stubArcaEnv();
  });

  afterAll(async () => {
    resetEnvCacheForTests();
    vi.unstubAllEnvs();
    if (db) {
      await db.close();
    }
  });

  it("marks CAPTURED as REFUNDED without restoring stock or canceling the order", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );

    try {
      await confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: `cap-${fixture.paymentId}`,
        providerEventId: `evt-${fixture.paymentId}`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      });

      const marked = await markPaymentRefunded({
        paymentId: fixture.paymentId,
        correlationId: createId(),
      });
      expect(marked.type).toBe("refunded");

      const replay = await markPaymentRefunded({
        paymentId: fixture.paymentId,
        correlationId: createId(),
      });
      expect(replay.type).toBe("already_processed");

      const [payment] = await db.withTx((tx) =>
        tx
          .select()
          .from(payments)
          .where(eq(payments.id, fixture.paymentId))
          .limit(1),
      );
      const [order] = await db.withTx((tx) =>
        tx.select().from(orders).where(eq(orders.id, fixture.orderId)).limit(1),
      );
      const [product] = await db.withTx((tx) =>
        tx
          .select()
          .from(products)
          .where(eq(products.id, fixture.productId))
          .limit(1),
      );
      const movements = await db.withTx((tx) =>
        tx
          .select()
          .from(stockMovements)
          .where(and(eq(stockMovements.orderId, fixture.orderId))),
      );

      expect(payment?.status).toBe("REFUNDED");
      expect(payment?.refundedAt).toBeTruthy();
      expect(order?.paymentStatus).toBe("REFUNDED");
      expect(order?.status).toBe("PENDING");
      expect(product?.stockOnHand).toBe(4);
      expect(movements).toHaveLength(1);
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });

  it("reverses a deposited ARCA payment then applies local REFUNDED", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );
    const providerOrderId = `arca-${fixture.paymentId}`;

    try {
      await confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: providerOrderId,
        providerEventId: `evt-ref-${fixture.paymentId}`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      });

      const result = await refundArcaPayment(
        {
          paymentId: fixture.paymentId,
          correlationId: createId(),
        },
        {
          client: createFakeArcaClient({
            amountMinorUnits: fixture.totalAmount * 100,
            orderNumber: fixture.orderNumber,
            providerOrderId,
          }),
        },
      );

      expect(result.type).toBe("refunded");
      expect(result.method).toBe("reverse");

      const [payment] = await db.withTx((tx) =>
        tx
          .select()
          .from(payments)
          .where(eq(payments.id, fixture.paymentId))
          .limit(1),
      );
      expect(payment?.status).toBe("REFUNDED");
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });

  it("falls back to refund.do when reverse is invalid for the current state", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );
    const providerOrderId = `arca-fb-${fixture.paymentId}`;

    try {
      await confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: providerOrderId,
        providerEventId: `evt-fb-${fixture.paymentId}`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      });

      const result = await refundArcaPayment(
        {
          paymentId: fixture.paymentId,
          correlationId: createId(),
        },
        {
          client: createFakeArcaClient({
            amountMinorUnits: fixture.totalAmount * 100,
            orderNumber: fixture.orderNumber,
            providerOrderId,
            reverseFailsWith: "7",
          }),
        },
      );

      expect(result.type).toBe("refunded");
      expect(result.method).toBe("refund");
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });

  it("falls back to refund.do when reverse is denied with error 5", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );
    const providerOrderId = `arca-e5-${fixture.paymentId}`;

    try {
      await confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: providerOrderId,
        providerEventId: `evt-e5-${fixture.paymentId}`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      });

      const result = await refundArcaPayment(
        {
          paymentId: fixture.paymentId,
          correlationId: createId(),
        },
        {
          client: createFakeArcaClient({
            amountMinorUnits: fixture.totalAmount * 100,
            orderNumber: fixture.orderNumber,
            providerOrderId,
            reverseFailsWith: "5",
          }),
        },
      );

      expect(result.type).toBe("refunded");
      expect(result.method).toBe("refund");
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });

  it("releases the refund claim after reverse and refund are both denied", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );
    const providerOrderId = `arca-rel-${fixture.paymentId}`;
    const client = createFakeArcaClient({
      amountMinorUnits: fixture.totalAmount * 100,
      orderNumber: fixture.orderNumber,
      providerOrderId,
      reverseFailsWith: "5",
      refundFailsWith: "5",
    });

    try {
      await confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: providerOrderId,
        providerEventId: `evt-rel-${fixture.paymentId}`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      });

      await expect(
        refundArcaPayment(
          { paymentId: fixture.paymentId, correlationId: createId() },
          { client },
        ),
      ).rejects.toBeInstanceOf(ArcaBusinessError);

      await expect(
        refundArcaPayment(
          { paymentId: fixture.paymentId, correlationId: createId() },
          { client },
        ),
      ).rejects.toBeInstanceOf(ArcaBusinessError);
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });

  it("rejects refund for non-ARCA payments", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "cod",
        paymentStatus: "CAPTURED",
      }),
    );

    try {
      await expect(
        refundArcaPayment({
          paymentId: fixture.paymentId,
          correlationId: createId(),
        }),
      ).rejects.toBeInstanceOf(PaymentRefundNotAllowedError);
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });

  it("rejects a second refund while a claim is active and the bank is still captured", async () => {
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, { stockOnHand: 5 }),
    );
    const providerOrderId = `arca-cl-${fixture.paymentId}`;

    try {
      await confirmPayment({
        paymentId: fixture.paymentId,
        providerReference: providerOrderId,
        providerEventId: `evt-cl-${fixture.paymentId}`,
        verifiedAmount: fixture.totalAmount,
        verifiedCurrency: "AMD",
      });

      await db.withTx(async (tx) => {
        const [row] = await tx
          .select()
          .from(payments)
          .where(eq(payments.id, fixture.paymentId))
          .limit(1);
        await tx
          .update(payments)
          .set({
            metadata: mergeArcaPaymentMetadata(row?.metadata ?? null, {
              refundClaimedAt: new Date().toISOString(),
              refundClaimId: "existing-claim",
            }),
          })
          .where(eq(payments.id, fixture.paymentId));
      });

      await expect(
        refundArcaPayment(
          { paymentId: fixture.paymentId, correlationId: createId() },
          {
            client: createFakeArcaClient({
              amountMinorUnits: fixture.totalAmount * 100,
              orderNumber: fixture.orderNumber,
              providerOrderId,
            }),
          },
        ),
      ).rejects.toBeInstanceOf(PaymentRefundInProgressError);
    } finally {
      await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
    }
  });
});
