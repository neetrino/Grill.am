import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { eq } from "drizzle-orm";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

import { resetEnvCacheForTests } from "@/config/env";
import { orders, payments } from "@/db/schema";
import { handleIdramBrowserReturn } from "@/features/payments/providers/idram/browser-return";
import { handleIdramResultPost } from "@/features/payments/providers/idram/handle-idram-result";
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

const TEST_SECRET = "test-idram-legacy-secret";
const TEST_ACCOUNT = "100000114";

function stubIdramEnv(): void {
  vi.stubEnv("PAYMENT_ENABLE_IDRAM", "true");
  vi.stubEnv("IDRAM_REC_ACCOUNT", TEST_ACCOUNT);
  vi.stubEnv("IDRAM_SECRET_KEY", TEST_SECRET);
  vi.stubEnv(
    "IDRAM_PAYMENT_URL",
    "https://banking.idram.am/Payment/GetPayment",
  );
  vi.stubEnv("IDRAM_RESULT_URL", "https://grill.am/wc-api/idram_result");
  vi.stubEnv("IDRAM_SUCCESS_URL", "https://grill.am/wc-api/idram_complete");
  vi.stubEnv("IDRAM_FAIL_URL", "https://grill.am/wc-api/idram_fail");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
  vi.stubEnv("NODE_ENV", "development");
  resetEnvCacheForTests();
}

function formRequest(
  path: string,
  fields: Record<string, string>,
): Request {
  const body = new URLSearchParams(fields);
  return new Request(`https://example.com${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "content-length": String(Buffer.byteLength(body.toString(), "utf8")),
    },
    body: body.toString(),
  });
}

function confirmationFields(input: {
  billNo: string;
  amount: string;
  transId: string;
}): Record<string, string> {
  const payer = "100000001";
  const date = "06/08/2026";
  const checksum = computeIdramChecksum({
    edpRecAccount: TEST_ACCOUNT,
    edpAmount: input.amount,
    secretKey: TEST_SECRET,
    edpBillNo: input.billNo,
    edpPayerAccount: payer,
    edpTransId: input.transId,
    edpTransDate: date,
  });
  return {
    EDP_BILL_NO: input.billNo,
    EDP_REC_ACCOUNT: TEST_ACCOUNT,
    EDP_PAYER_ACCOUNT: payer,
    EDP_AMOUNT: input.amount,
    EDP_TRANS_ID: input.transId,
    EDP_TRANS_DATE: date,
    EDP_CHECKSUM: checksum,
  };
}

describe("iDram legacy /wc-api HTTP compatibility", () => {
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

  it("legacy precheck returns exact OK", async () => {
    const billNo = `leg-pre-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
      }),
    );

    const response = await handleIdramResultPost(
      formRequest("/wc-api/idram_result", {
        EDP_PRECHECK: "YES",
        EDP_BILL_NO: billNo,
        EDP_REC_ACCOUNT: TEST_ACCOUNT,
        EDP_AMOUNT: String(fixture.totalAmount),
      }),
    );

    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toBe(IDRAM_RESULT_OK_BODY);
    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    expect(response.headers.get("cache-control")).toMatch(/no-store/);
    expect(body).not.toContain(TEST_SECRET);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("legacy valid confirmation captures once; duplicate stays one capture", async () => {
    const billNo = `leg-ok-${Date.now()}`;
    const transId = `L${Date.now()}`.slice(0, 14).padEnd(14, "0");
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
        stockOnHand: 3,
      }),
    );
    const fields = confirmationFields({
      billNo,
      amount: String(fixture.totalAmount),
      transId,
    });

    const first = await handleIdramResultPost(
      formRequest("/wc-api/idram_result", fields),
    );
    const second = await handleIdramResultPost(
      formRequest("/wc-api/idram_result", fields),
    );
    expect(await first.text()).toBe(IDRAM_RESULT_OK_BODY);
    expect(await second.text()).toBe(IDRAM_RESULT_OK_BODY);

    const [payment] = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.id, fixture.paymentId)).limit(1),
    );
    expect(payment?.status).toBe("CAPTURED");
    expect(payment?.providerReference).toBe(transId);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("legacy invalid checksum does not capture and does not leak secret", async () => {
    const billNo = `leg-bad-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
      }),
    );
    const fields = confirmationFields({
      billNo,
      amount: String(fixture.totalAmount),
      transId: "12345678901234",
    });
    fields.EDP_CHECKSUM = "a".repeat(32);

    const response = await handleIdramResultPost(
      formRequest("/wc-api/idram_result", fields),
    );
    const body = await response.text();
    expect(body).toBe(IDRAM_RESULT_FAIL_BODY);
    expect(body.toUpperCase()).not.toContain(TEST_SECRET.toUpperCase());

    const [payment] = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.id, fixture.paymentId)).limit(1),
    );
    expect(payment?.status).toBe("PENDING");

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("legacy and modern result paths produce equivalent OK bodies", async () => {
    const billNo = `leg-eq-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
      }),
    );
    const fields = {
      EDP_PRECHECK: "YES",
      EDP_BILL_NO: billNo,
      EDP_REC_ACCOUNT: TEST_ACCOUNT,
      EDP_AMOUNT: String(fixture.totalAmount),
    };

    const legacy = await handleIdramResultPost(
      formRequest("/wc-api/idram_result", fields),
    );
    const modern = await handleIdramResultPost(
      formRequest("/api/v1/payments/idram/result", fields),
    );
    expect(await legacy.text()).toBe(await modern.text());
    expect(legacy.status).toBe(modern.status);

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });

  it("legacy success and fail browser routes do not capture", async () => {
    const billNo = `leg-ux-${Date.now()}`;
    const fixture = await db.withTx((tx) =>
      createPaymentFixture(tx, {
        provider: "idram",
        providerOrderNumber: billNo,
      }),
    );

    const success = await handleIdramBrowserReturn(
      new Request(
        `https://example.com/wc-api/idram_complete?EDP_BILL_NO=${encodeURIComponent(billNo)}&gm_order=${fixture.orderNumber}&gm_locale=en`,
        { method: "GET" },
      ),
      "success",
    );
    const fail = await handleIdramBrowserReturn(
      new Request(
        `https://example.com/wc-api/idram_fail?EDP_BILL_NO=${encodeURIComponent(billNo)}&gm_order=${fixture.orderNumber}&gm_locale=en`,
        { method: "GET" },
      ),
      "fail",
    );

    expect(success.status).toBe(303);
    expect(fail.status).toBe(303);
    expect(success.headers.get("cache-control")).toMatch(/no-store/);
    expect(fail.headers.get("cache-control")).toMatch(/no-store/);
    // Without guest cookie, UX may redirect to checkout — still must not capture.
    expect(success.headers.get("location")).toMatch(/\/(en\/)?checkout/);
    expect(fail.headers.get("location")).toMatch(/\/(en\/)?checkout/);

    const [payment] = await db.withTx(async (tx) =>
      tx.select().from(payments).where(eq(payments.id, fixture.paymentId)).limit(1),
    );
    const [order] = await db.withTx(async (tx) =>
      tx.select().from(orders).where(eq(orders.id, fixture.orderId)).limit(1),
    );
    expect(payment?.status).toBe("PENDING");
    expect(order?.paymentStatus).not.toBe("CAPTURED");

    await db.withTx((tx) => cleanupPaymentFixture(tx, fixture));
  });
});
