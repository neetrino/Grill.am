import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

import { resetEnvCacheForTests } from "@/config/env";
import { carts, orderEvents, orders, payments, products, stockMovements } from "@/db/schema";
import { processIdramConfirmation } from "@/features/payments/providers/idram/process-idram-confirmation";
import { processIdramPrecheck } from "@/features/payments/providers/idram/process-idram-precheck";
import { computeIdramChecksum } from "@/lib/payments/idram/checksum";
import {
  IDRAM_RESULT_FAIL_BODY,
  IDRAM_RESULT_OK_BODY,
} from "@/lib/payments/idram/types";
import { openIntegrationDb, type IntegrationDb } from "../helpers/test-db";
import {
  cleanupPaymentFixture,
  createPaymentFixture,
} from "../helpers/payment-fixtures";

const TEST_SECRET = "test-idram-integration-secret";
const TEST_ACCOUNT = "100000114";

function stubIdramEnv(): void {
  vi.stubEnv("PAYMENT_ENABLE_IDRAM", "true");
  vi.stubEnv("IDRAM_REC_ACCOUNT", TEST_ACCOUNT);
  vi.stubEnv("IDRAM_SECRET_KEY", TEST_SECRET);
  vi.stubEnv(
    "IDRAM_PAYMENT_URL",
    "https://banking.idram.am/Payment/GetPayment",
  );
  vi.stubEnv(
    "IDRAM_RESULT_URL",
    "https://example.com/api/v1/payments/idram/result",
  );
  vi.stubEnv(
    "IDRAM_SUCCESS_URL",
    "https://example.com/api/v1/payments/idram/success",
  );
  vi.stubEnv(
    "IDRAM_FAIL_URL",
    "https://example.com/api/v1/payments/idram/fail",
  );
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
  vi.stubEnv("NODE_ENV", "development");
  resetEnvCacheForTests();
}

function confirmationPayload(input: {
  billNo: string;
  amount: string;
  transId: string;
  recAccount?: string;
  payer?: string;
  date?: string;
  secret?: string;
}) {
  const fields = {
    edpRecAccount: input.recAccount ?? TEST_ACCOUNT,
    edpAmount: input.amount,
    secretKey: input.secret ?? TEST_SECRET,
    edpBillNo: input.billNo,
    edpPayerAccount: input.payer ?? "100000001",
    edpTransId: input.transId,
    edpTransDate: input.date ?? "06/08/2026",
  };
  return {
    EDP_BILL_NO: input.billNo,
    EDP_REC_ACCOUNT: fields.edpRecAccount,
    EDP_PAYER_ACCOUNT: fields.edpPayerAccount,
    EDP_AMOUNT: input.amount,
    EDP_TRANS_ID: input.transId,
    EDP_TRANS_DATE: fields.edpTransDate,
    EDP_CHECKSUM: computeIdramChecksum(fields),
  };
}

describe("iDram RESULT_URL precheck/confirmation integration", () => {
  let db: IntegrationDb;

  beforeAll(async () => {
    db = await openIntegrationDb();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(() => {
    stubIdramEnv();
  });

  afterEach(() => {
    resetEnvCacheForTests();
    vi.unstubAllEnvs();
  });

  it("accepts valid precheck with exact OK and no stock mutation", async () => {
    const billNo = `bill-pre-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
        stockOnHand: 8,
      }),
    );

    const body = await processIdramPrecheck({
      EDP_PRECHECK: "YES",
      EDP_BILL_NO: billNo,
      EDP_REC_ACCOUNT: TEST_ACCOUNT,
      EDP_AMOUNT: String(fixture.totalAmount),
    });

    expect(body).toBe(IDRAM_RESULT_OK_BODY);
    expect(body).toBe("OK");
    expect(Buffer.from(body, "utf8").equals(Buffer.from("OK", "utf8"))).toBe(
      true,
    );

    const [product] = await db.withTx(async (tx) =>
      tx
        .select({ stockOnHand: products.stockOnHand })
        .from(products)
        .where(eq(products.id, fixture.productId))
        .limit(1),
    );
    expect(product?.stockOnHand).toBe(8);

    const [cart] = await db.withTx(async (tx) =>
      tx.select().from(carts).where(eq(carts.id, fixture.cartId)).limit(1),
    );
    expect(cart?.status).toBe("ACTIVE");

    // Duplicate precheck is harmless
    const again = await processIdramPrecheck({
      EDP_PRECHECK: "YES",
      EDP_BILL_NO: billNo,
      EDP_REC_ACCOUNT: TEST_ACCOUNT,
      EDP_AMOUNT: String(fixture.totalAmount),
    });
    expect(again).toBe(IDRAM_RESULT_OK_BODY);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("rejects wrong account/amount/unknown bill on precheck", async () => {
    const billNo = `bill-bad-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
      }),
    );

    expect(
      await processIdramPrecheck({
        EDP_PRECHECK: "YES",
        EDP_BILL_NO: billNo,
        EDP_REC_ACCOUNT: "999999999",
        EDP_AMOUNT: String(fixture.totalAmount),
      }),
    ).toBe(IDRAM_RESULT_FAIL_BODY);

    expect(
      await processIdramPrecheck({
        EDP_PRECHECK: "YES",
        EDP_BILL_NO: billNo,
        EDP_REC_ACCOUNT: TEST_ACCOUNT,
        EDP_AMOUNT: "1",
      }),
    ).toBe(IDRAM_RESULT_FAIL_BODY);

    expect(
      await processIdramPrecheck({
        EDP_PRECHECK: "YES",
        EDP_BILL_NO: "missing-bill",
        EDP_REC_ACCOUNT: TEST_ACCOUNT,
        EDP_AMOUNT: String(fixture.totalAmount),
      }),
    ).toBe(IDRAM_RESULT_FAIL_BODY);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("captures on valid confirmation once; duplicate is idempotent", async () => {
    const billNo = `bill-ok-${Date.now()}`;
    const transId = `T${Date.now()}`.slice(0, 14).padEnd(14, "0");
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
        stockOnHand: 5,
      }),
    );

    const payload = confirmationPayload({
      billNo,
      amount: String(fixture.totalAmount),
      transId,
    });

    expect(await processIdramConfirmation(payload)).toBe(IDRAM_RESULT_OK_BODY);
    expect(await processIdramConfirmation(payload)).toBe(IDRAM_RESULT_OK_BODY);

    const [payment] = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.id, fixture.paymentId)).limit(1),
    );
    expect(payment?.status).toBe("CAPTURED");
    expect(payment?.providerReference).toBe(transId);

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

    const [cart] = await db.withTx(async (tx) =>
      tx.select().from(carts).where(eq(carts.id, fixture.cartId)).limit(1),
    );
    expect(cart?.status).toBe("CONVERTED");

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("does not capture on invalid checksum", async () => {
    const billNo = `bill-cs-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
        stockOnHand: 5,
      }),
    );

    const payload = confirmationPayload({
      billNo,
      amount: String(fixture.totalAmount),
      transId: "12345678901234",
    });
    payload.EDP_CHECKSUM = "f".repeat(32);

    expect(await processIdramConfirmation(payload)).toBe(IDRAM_RESULT_FAIL_BODY);

    const [payment] = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.id, fixture.paymentId)).limit(1),
    );
    expect(payment?.status).toBe("PENDING");

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("provider-paid stock-unavailable becomes REQUIRES_REVIEW and still OK", async () => {
    const billNo = `bill-rev-${Date.now()}`;
    const transId = `R${Date.now()}`.slice(0, 14).padEnd(14, "0");
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
        stockOnHand: 0,
      }),
    );

    const payload = confirmationPayload({
      billNo,
      amount: String(fixture.totalAmount),
      transId,
    });

    expect(await processIdramConfirmation(payload)).toBe(IDRAM_RESULT_OK_BODY);

    const [payment] = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.id, fixture.paymentId)).limit(1),
    );
    expect(payment?.status).toBe("CAPTURED");

    const [order] = await db.withTx(async (tx) =>
      tx.select().from(orders).where(eq(orders.id, fixture.orderId)).limit(1),
    );
    expect(order?.status).toBe("REQUIRES_REVIEW");
    expect(order?.paymentStatus).toBe("CAPTURED");

    const events = await db.withTx(async (tx) =>
      tx.select().from(orderEvents).where(eq(orderEvents.orderId, fixture.orderId)),
    );
    expect(
      events.some((e) => {
        const payloadJson = e.payload as { kind?: string } | null;
        return payloadJson?.kind === "PROVIDER_PAID_STOCK_UNAVAILABLE";
      }),
    ).toBe(true);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("concurrent confirmations produce one capture", async () => {
    const billNo = `bill-c-${Date.now()}`;
    const transId = `C${Date.now()}`.slice(0, 14).padEnd(14, "0");
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
        stockOnHand: 3,
      }),
    );

    const payload = confirmationPayload({
      billNo,
      amount: String(fixture.totalAmount),
      transId,
    });

    const results = await Promise.all([
      processIdramConfirmation(payload),
      processIdramConfirmation(payload),
    ]);
    expect(results.every((r) => r === IDRAM_RESULT_OK_BODY)).toBe(true);

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

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
