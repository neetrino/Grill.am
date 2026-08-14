import { expect, test } from "@playwright/test";

import { assertAdminRequiresReviewUx } from "./helpers/admin";
import {
  awaitCheckoutSuccessUrl,
  getOrderState,
  orderNumberFromSuccessUrl,
  placeProviderCheckout,
  postIdramConfirmation,
  postIdramPrecheck,
  resetPaymentE2eControls,
  uniqueIdramTransId,
  waitForOrderInboxMessages,
} from "./helpers/payments";
import {
  fillCheckoutContact,
  seedCartViaUi,
  selectCod,
} from "./helpers/seed-cart";

/**
 * Phase 5 payment E2E matrix (mocked providers, DB + capture-inbox email assertions).
 * COD foundation remains in payment-cod.spec.ts — do not regress that seed.
 */

const IDRAM_SECRET = process.env.IDRAM_SECRET_KEY ?? "e2e-idram-secret";
const IDRAM_REC = process.env.IDRAM_REC_ACCOUNT ?? "100000000";

test.describe("payment E2E matrix", () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetPaymentE2eControls(request, baseURL!);
  });

  test("health endpoint is up", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/health`);
    expect(response.ok()).toBeTruthy();
    const json = (await response.json()) as { ok: boolean; database: string };
    expect(json.ok).toBe(true);
    expect(json.database).toBe("up");
  });

  test("e2e control surfaces are available in mock mode", async ({
    request,
    baseURL,
  }) => {
    const inbox = await request.get(`${baseURL}/api/e2e/inbox?inbox=e2e`);
    expect(inbox.status()).toBe(200);
    const arca = await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "reset" },
    });
    expect(arca.status()).toBe(200);
    const fixture = await request.get(`${baseURL}/api/e2e/fixture`);
    expect(fixture.ok()).toBeTruthy();
    const state = await request.get(`${baseURL}/api/e2e/state`);
    expect(state.ok()).toBeTruthy();
  });

  test("provider secrets never appear on checkout", async ({ page }) => {
    await page.goto("/en/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[name="EDP_SECRET"]')).toHaveCount(0);
    await expect(page.locator('input[name="SECRET_KEY"]')).toHaveCount(0);
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
  });

  test("COD checkout shows pay-on-delivery copy", async ({
    page,
    request,
    baseURL,
  }) => {
    await seedCartViaUi(page, request, baseURL!);
    await selectCod(page);
    await fillCheckoutContact(page, "CodMatrix");

    const place = page.getByRole("button", { name: /place order/i });
    await expect(place).toBeEnabled();
    await place.click();

    await page.waitForURL(/\/checkout\/success\//, { timeout: 60_000 });
    await expect(
      page.getByText(/pay cash when you receive|pay when/i),
    ).toBeVisible();
    await expect(
      page.getByText(/paid successfully|payment completed/i),
    ).toHaveCount(0);

    const orderNumber = orderNumberFromSuccessUrl(page.url());
    const state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.payments).toHaveLength(1);
    expect(state.payments[0]?.method).toMatch(/^(cash_on_delivery|COD)$/);
    expect(state.cart?.status).toBe("CONVERTED");
    expect(state.cart?.itemCount).toBe(0);
    const inbox = await waitForOrderInboxMessages(
      request,
      baseURL!,
      orderNumber,
      1,
    );
    expect(inbox.length).toBeGreaterThanOrEqual(1);
  });

  test("ARCA success via mock form and DB-authoritative return", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "arca", "ArcaOk");

    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );
    await expect(page.getByText(/paid successfully/i)).toBeVisible({
      timeout: 30_000,
    });
    const state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.order.paymentStatus).toBe("CAPTURED");
    expect(state.payments).toHaveLength(1);
    expect(state.payments[0]?.status).toBe("CAPTURED");
    expect(state.payments[0]?.attemptNumber).toBe(1);
    expect(state.cart?.status).toBe("CONVERTED");
    expect(state.cart?.itemCount).toBe(0);
    expect(state.productStock).toBe(99);
    await waitForOrderInboxMessages(request, baseURL!, orderNumber, 1);
  });

  test("ARCA pending then recheck captures", async ({
    page,
    request,
    baseURL,
  }) => {
    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "pending" },
    });

    await placeProviderCheckout(page, request, baseURL!, "arca", "ArcaPend");

    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );
    await expect(page.getByText(/awaiting payment confirmation/i)).toBeVisible({
      timeout: 30_000,
    });
    let state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.payments[0]?.status).toBe("PENDING");

    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "captured" },
    });

    await page.getByRole("button", { name: /check payment status/i }).click();
    await expect(page.getByText(/paid successfully/i)).toBeVisible({
      timeout: 30_000,
    });

    state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.order.paymentStatus).toBe("CAPTURED");
    expect(state.payments[0]?.status).toBe("CAPTURED");
    expect(state.cart?.status).toBe("CONVERTED");
  });

  test("ARCA failure then retry attempt 2 captured", async ({
    page,
    request,
    baseURL,
  }) => {
    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "declined" },
    });

    await placeProviderCheckout(page, request, baseURL!, "arca", "ArcaFail");

    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );
    await expect(
      page.getByText(/payment for order .+ was not completed/i),
    ).toBeVisible({
      timeout: 30_000,
    });
    let state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.payments[0]?.status).toMatch(/FAILED|CANCELLED|PENDING/);
    expect(state.payments).toHaveLength(1);

    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "captured" },
    });

    await page.getByRole("button", { name: /retry payment/i }).click();
    await awaitCheckoutSuccessUrl(page, request, baseURL!);
    await expect(page.getByText(/paid successfully/i)).toBeVisible({
      timeout: 30_000,
    });

    state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.payments.length).toBeGreaterThanOrEqual(2);
    expect(state.payments.some((p) => p.attemptNumber === 2 && p.status === "CAPTURED")).toBe(
      true,
    );
    expect(state.order.paymentStatus).toBe("CAPTURED");
  });

  test("ARCA duplicate return keeps one capture", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "arca", "ArcaDup");

    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );
    await expect(page.getByText(/paid successfully/i)).toBeVisible({
      timeout: 30_000,
    });

    const state = await getOrderState(request, baseURL!, orderNumber);
    const payment = state.payments[0];
    expect(payment?.status).toBe("CAPTURED");
    expect(payment?.providerReference).toBeTruthy();

    const returnUrl = `${baseURL}/api/v1/payments/arca/return?pid=${encodeURIComponent(payment!.id)}&orderId=${encodeURIComponent(payment!.providerReference!)}&locale=en`;
    const first = await request.get(returnUrl, { maxRedirects: 0 });
    expect([303, 302, 307, 308]).toContain(first.status());
    const second = await request.get(returnUrl, { maxRedirects: 0 });
    expect([303, 302, 307, 308]).toContain(second.status());

    const after = await getOrderState(request, baseURL!, orderNumber);
    expect(after.payments.filter((p) => p.status === "CAPTURED")).toHaveLength(1);
    await waitForOrderInboxMessages(request, baseURL!, orderNumber, 1);
  });

  test("iDram POST form generation without secret", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramForm");

    await page.waitForURL(/\/api\/e2e\/idram-payment/, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("idram-mock-received")).toBeVisible();
    await expect(page.locator('input[name="EDP_SECRET"]')).toHaveCount(0);
    await expect(page.locator('input[name="SECRET_KEY"]')).toHaveCount(0);

    const orderNumber = page.url().includes("gm_order=")
      ? new URL(page.url()).searchParams.get("gm_order")
      : null;

    const stored = await request.get(`${baseURL}/api/e2e/idram-payment`);
    expect(stored.ok()).toBeTruthy();
    const storedJson = (await stored.json()) as { ok: boolean; count: number };
    expect(storedJson.count).toBeGreaterThanOrEqual(1);

    // Recover bill from latest payment attempt in DB after we know order number.
    // Order number is on success path; from mock page read HTML text for bill.
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    expect(billNo.length).toBeGreaterThan(3);

    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      ok: boolean;
      payment: { billNo: string; amount: string; orderNumber?: string } | null;
    };
    expect(billJson.payment?.billNo).toBe(billNo);
    expect(billJson.payment?.amount).toBeTruthy();
    void orderNumber;
  });

  test("iDram precheck exact OK", async ({ page, request, baseURL }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramPre");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string; orderNumber?: string };
    };

    const precheck = await postIdramPrecheck(request, baseURL!, {
      billNo,
      amount: billJson.payment.amount,
      recAccount: billJson.payment.recAccount || IDRAM_REC,
    });
    expect(precheck.status).toBe(200);
    expect(precheck.body).toBe("OK");
  });

  test("iDram valid confirmation captures once", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramOk");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string; orderNumber?: string };
    };
    const orderNumber = billJson.payment.orderNumber;
    expect(orderNumber).toBeTruthy();

    const precheck = await postIdramPrecheck(request, baseURL!, {
      billNo,
      amount: billJson.payment.amount,
      recAccount: billJson.payment.recAccount || IDRAM_REC,
    });
    expect(precheck.body).toBe("OK");

    const confirm = await postIdramConfirmation(request, baseURL!, {
      billNo,
      amount: billJson.payment.amount,
      recAccount: billJson.payment.recAccount || IDRAM_REC,
      secretKey: IDRAM_SECRET,
    });
    expect(confirm.body).toBe("OK");

    const state = await getOrderState(request, baseURL!, orderNumber!);
    expect(state.order.paymentStatus).toBe("CAPTURED");
    expect(state.payments[0]?.status).toBe("CAPTURED");
    expect(state.cart?.status).toBe("CONVERTED");
    await waitForOrderInboxMessages(request, baseURL!, orderNumber!, 1);

    await page.goto(`/en/checkout/success/${orderNumber}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/paid successfully/i)).toBeVisible();
  });

  test("iDram legacy wc-api result and complete URLs stay compatible", async ({
    page,
    request,
    baseURL,
  }) => {
    const legacyResult = "/wc-api/idram_result";
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramLegacy");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string; orderNumber?: string };
    };
    const orderNumber = billJson.payment.orderNumber;
    expect(orderNumber).toBeTruthy();

    const precheck = await postIdramPrecheck(
      request,
      baseURL!,
      {
        billNo,
        amount: billJson.payment.amount,
        recAccount: billJson.payment.recAccount || IDRAM_REC,
      },
      legacyResult,
    );
    expect(precheck.status).toBe(200);
    expect(precheck.body).toBe("OK");

    const confirm = await postIdramConfirmation(
      request,
      baseURL!,
      {
        billNo,
        amount: billJson.payment.amount,
        recAccount: billJson.payment.recAccount || IDRAM_REC,
        secretKey: IDRAM_SECRET,
      },
      legacyResult,
    );
    expect(confirm.body).toBe("OK");
    expect(confirm.body.toUpperCase()).not.toContain(IDRAM_SECRET.toUpperCase());

    const dup = await postIdramConfirmation(
      request,
      baseURL!,
      {
        billNo,
        amount: billJson.payment.amount,
        recAccount: billJson.payment.recAccount || IDRAM_REC,
        secretKey: IDRAM_SECRET,
      },
      legacyResult,
    );
    expect(dup.body).toBe("OK");

    const state = await getOrderState(request, baseURL!, orderNumber!);
    expect(state.payments.filter((p) => p.status === "CAPTURED")).toHaveLength(1);

    // Browser SUCCESS/FAIL legacy paths are UX only — must not change capture.
    await page.goto(
      `${baseURL}/wc-api/idram_complete?EDP_BILL_NO=${encodeURIComponent(billNo)}&gm_order=${encodeURIComponent(orderNumber!)}&gm_locale=en`,
      { waitUntil: "domcontentloaded" },
    );
    await page.goto(
      `${baseURL}/wc-api/idram_fail?EDP_BILL_NO=${encodeURIComponent(billNo)}&gm_order=${encodeURIComponent(orderNumber!)}&gm_locale=en`,
      { waitUntil: "domcontentloaded" },
    );

    const afterUx = await getOrderState(request, baseURL!, orderNumber!);
    expect(afterUx.payments.filter((p) => p.status === "CAPTURED")).toHaveLength(
      1,
    );
  });

  test("iDram invalid checksum does not capture and does not leak secret", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramBad");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string; orderNumber?: string };
    };

    const bad = await postIdramConfirmation(request, baseURL!, {
      billNo,
      amount: billJson.payment.amount,
      recAccount: billJson.payment.recAccount || IDRAM_REC,
      secretKey: IDRAM_SECRET,
      checksum: "deadbeefdeadbeefdeadbeefdeadbeef",
    });
    expect(bad.body.toUpperCase()).not.toContain("OK");
    expect(bad.body.toUpperCase()).not.toContain(IDRAM_SECRET.toUpperCase());

    const orderNumber = billJson.payment.orderNumber;
    expect(orderNumber).toBeTruthy();
    const state = await getOrderState(request, baseURL!, orderNumber!);
    expect(state.payments[0]?.status).not.toBe("CAPTURED");
    expect(state.order.paymentStatus).not.toBe("CAPTURED");
  });

  test("iDram duplicate confirmation stays one capture", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramDup");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string; orderNumber?: string };
    };
    const orderNumber = billJson.payment.orderNumber!;
    const fields = {
      billNo,
      amount: billJson.payment.amount,
      recAccount: billJson.payment.recAccount || IDRAM_REC,
      secretKey: IDRAM_SECRET,
      transId: uniqueIdramTransId(),
    };

    expect((await postIdramPrecheck(request, baseURL!, fields)).body).toBe("OK");
    expect((await postIdramConfirmation(request, baseURL!, fields)).body).toBe(
      "OK",
    );
    expect((await postIdramConfirmation(request, baseURL!, fields)).body).toBe(
      "OK",
    );

    const state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.payments.filter((p) => p.status === "CAPTURED")).toHaveLength(1);
    await waitForOrderInboxMessages(request, baseURL!, orderNumber, 1);
  });

  test("iDram success redirect before confirmation stays pending then pays", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "IdramRace");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    await page.getByTestId("idram-mock-success").click();

    await page.waitForURL(/\/checkout\/success\//, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/awaiting payment confirmation/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/paid successfully/i)).toHaveCount(0);

    const orderNumber = orderNumberFromSuccessUrl(page.url());
    const stateBefore = await getOrderState(request, baseURL!, orderNumber);
    expect(stateBefore.payments[0]?.status).not.toBe("CAPTURED");
    const billNo = stateBefore.payments[0]?.providerOrderNumber;
    expect(billNo).toBeTruthy();

    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo!)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string } | null;
    };
    expect(billJson.payment).toBeTruthy();

    const fields = {
      billNo: billNo!,
      amount: billJson.payment!.amount,
      recAccount: billJson.payment!.recAccount || IDRAM_REC,
      secretKey: IDRAM_SECRET,
      transId: uniqueIdramTransId(),
    };
    expect((await postIdramPrecheck(request, baseURL!, fields)).body).toBe("OK");
    expect((await postIdramConfirmation(request, baseURL!, fields)).body).toBe(
      "OK",
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/paid successfully/i)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("REQUIRES_REVIEW customer and admin UX", async ({
    page,
    request,
    baseURL,
  }) => {
    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "pending" },
    });
    await placeProviderCheckout(page, request, baseURL!, "arca", "Review");

    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );

    await request.post(`${baseURL}/api/e2e/state`, {
      data: { action: "setProductStock", stockOnHand: 0 },
    });
    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "captured" },
    });

    await page.getByRole("button", { name: /check payment status/i }).click();
    await expect(
      page.getByRole("heading", { name: /order under review/i }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText(/payment was received and the order is being reviewed/i),
    ).toBeVisible();
    await expect(page.getByText(/paid successfully/i)).toHaveCount(0);

    const state = await getOrderState(request, baseURL!, orderNumber);
    expect(state.order.status).toBe("REQUIRES_REVIEW");
    expect(state.order.paymentStatus).toBe("CAPTURED");
    expect(state.adminReview.visible).toBe(true);
    await waitForOrderInboxMessages(request, baseURL!, orderNumber, 2);

    await assertAdminRequiresReviewUx(page, orderNumber);
  });

  test("guest token valid / wrong order / expired / order number alone", async ({
    page,
    request,
    baseURL,
    context,
  }) => {
    await seedCartViaUi(page, request, baseURL!);
    await selectCod(page);
    await fillCheckoutContact(page, "GuestTok");
    await page.getByRole("button", { name: /place order/i }).click();
    await page.waitForURL(/\/checkout\/success\//, { timeout: 60_000 });
    const orderA = orderNumberFromSuccessUrl(page.url());
    await expect(page.getByText(/pay cash when you receive|pay when/i)).toBeVisible();

    // Valid token (cookie set at create).
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/pay cash when you receive|pay when/i)).toBeVisible();

    const cookies = await context.cookies();
    const accessCookie = cookies.find((c) => c.name === `order_access_${orderA}`);
    expect(accessCookie?.value).toBeTruthy();

    // Second order for wrong-token check.
    await seedCartViaUi(page, request, baseURL!);
    await selectCod(page);
    await fillCheckoutContact(page, "GuestTokB");
    await page.getByRole("button", { name: /place order/i }).click();
    await page.waitForURL(/\/checkout\/success\//, { timeout: 60_000 });
    const orderB = orderNumberFromSuccessUrl(page.url());

    async function expectSuccessDenied(): Promise<void> {
      await expect(
        page.getByText(/pay cash when you receive|pay when|paid successfully/i),
      ).toHaveCount(0);
      await expect(page.locator("body")).toContainText(
        /404|not found|this page could not be found/i,
      );
    }

    // Wrong order: token for A presented as cookie for order B.
    await context.clearCookies();
    await context.addCookies([
      {
        name: `order_access_${orderB}`,
        value: accessCookie!.value,
        url: baseURL!,
      },
    ]);
    await page.goto(`/en/checkout/success/${orderB}`, {
      waitUntil: "domcontentloaded",
    });
    await expectSuccessDenied();

    // Expired token for A.
    await context.clearCookies();
    await context.addCookies([
      {
        name: `order_access_${orderA}`,
        value: accessCookie!.value,
        url: baseURL!,
      },
    ]);
    await request.post(`${baseURL}/api/e2e/state`, {
      data: { action: "expireGuestAccess", orderNumber: orderA },
    });
    await page.goto(`/en/checkout/success/${orderA}`, {
      waitUntil: "domcontentloaded",
    });
    await expectSuccessDenied();

    // Order number alone denied.
    await context.clearCookies();
    await page.goto(`/en/checkout/success/${orderA}`, {
      waitUntil: "domcontentloaded",
    });
    await expectSuccessDenied();
  });

  test("provider disabled server-side hides and rejects ARCA", async ({
    page,
    request,
    baseURL,
  }) => {
    await request.post(`${baseURL}/api/e2e/state`, {
      data: { action: "setAvailabilityOverride", arca: false },
    });
    const assertRes = await request.post(`${baseURL}/api/e2e/state`, {
      data: { action: "assertMethodEnabled", method: "arca" },
    });
    const assertJson = (await assertRes.json()) as { enabled: boolean };
    expect(assertJson.enabled).toBe(false);

    await seedCartViaUi(page, request, baseURL!);
    const arca = page.locator('input[name="paymentMethod"][value="arca"]');
    // Disabled methods may render disabled or be omitted.
    if ((await arca.count()) > 0) {
      await expect(arca).toBeDisabled();
    } else {
      await expect(
        page.locator('input[name="paymentMethod"][value="cash_on_delivery"]'),
      ).toBeVisible();
    }
  });

  test("email COD customer notification captured", async ({
    page,
    request,
    baseURL,
  }) => {
    await seedCartViaUi(page, request, baseURL!);
    await selectCod(page);
    await fillCheckoutContact(page, "OutCod");
    await page.getByRole("button", { name: /place order/i }).click();
    await page.waitForURL(/\/checkout\/success\//, { timeout: 60_000 });
    const orderNumber = orderNumberFromSuccessUrl(page.url());

    const forOrder = await waitForOrderInboxMessages(
      request,
      baseURL!,
      orderNumber,
      1,
    );
    expect(forOrder.some((m) => m.to.toLowerCase().includes("e2e-outcod@"))).toBe(
      true,
    );
  });

  test("email ARCA duplicate return does not multiply customer mail", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "arca", "OutArca");
    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );
    await expect(page.getByText(/paid successfully/i)).toBeVisible({
      timeout: 30_000,
    });
    const state = await getOrderState(request, baseURL!, orderNumber);
    const payment = state.payments[0]!;
    const returnUrl = `${baseURL}/api/v1/payments/arca/return?pid=${encodeURIComponent(payment.id)}&orderId=${encodeURIComponent(payment.providerReference!)}&locale=en`;
    await request.get(returnUrl, { maxRedirects: 0 });
    await request.get(returnUrl, { maxRedirects: 0 });

    const forOrder = await waitForOrderInboxMessages(
      request,
      baseURL!,
      orderNumber,
      1,
    );
    const customer = forOrder.filter((m) =>
      m.to.toLowerCase().includes("e2e-outarca@"),
    );
    expect(customer.length).toBe(1);
  });

  test("email iDram duplicate confirmation does not multiply customer mail", async ({
    page,
    request,
    baseURL,
  }) => {
    await placeProviderCheckout(page, request, baseURL!, "idram", "OutIdram");
    await page.waitForURL(/\/api\/e2e\/idram-payment/, { timeout: 60_000 });
    const received = await page.getByTestId("idram-mock-received").innerText();
    const billNo = received.replace(/^.*received\s+/i, "").trim();
    const billProbe = await request.get(
      `${baseURL}/api/e2e/idram-payment?bill=${encodeURIComponent(billNo)}`,
    );
    const billJson = (await billProbe.json()) as {
      payment: { amount: string; recAccount: string; orderNumber?: string };
    };
    const orderNumber = billJson.payment.orderNumber!;
    const fields = {
      billNo,
      amount: billJson.payment.amount,
      recAccount: billJson.payment.recAccount || IDRAM_REC,
      secretKey: IDRAM_SECRET,
      transId: uniqueIdramTransId(),
    };
    expect((await postIdramPrecheck(request, baseURL!, fields)).body).toBe("OK");
    expect((await postIdramConfirmation(request, baseURL!, fields)).body).toBe(
      "OK",
    );
    expect((await postIdramConfirmation(request, baseURL!, fields)).body).toBe(
      "OK",
    );

    const forOrder = await waitForOrderInboxMessages(
      request,
      baseURL!,
      orderNumber,
      1,
    );
    const customer = forOrder.filter((m) =>
      m.to.toLowerCase().includes("e2e-outidram@"),
    );
    expect(customer.length).toBe(1);
  });

  test("email REQUIRES_REVIEW customer and operator", async ({
    page,
    request,
    baseURL,
  }) => {
    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "pending" },
    });
    await placeProviderCheckout(page, request, baseURL!, "arca", "OutRev");
    const orderNumber = await awaitCheckoutSuccessUrl(
      page,
      request,
      baseURL!,
    );

    await request.post(`${baseURL}/api/e2e/state`, {
      data: { action: "setProductStock", stockOnHand: 0 },
    });
    await request.post(`${baseURL}/api/e2e/arca-mock`, {
      data: { action: "setDefaultStatus", status: "captured" },
    });
    await page.getByRole("button", { name: /check payment status/i }).click();
    await expect(
      page.getByRole("heading", { name: /order under review/i }),
    ).toBeVisible({
      timeout: 30_000,
    });

    const forOrder = await waitForOrderInboxMessages(
      request,
      baseURL!,
      orderNumber,
      2,
    );
    expect(forOrder.length).toBe(2);
    expect(forOrder.some((m) => m.to.includes("ops-e2e@example.com"))).toBe(
      true,
    );
    expect(
      forOrder.some((m) => m.to.toLowerCase().includes("e2e-outrev@")),
    ).toBe(true);
  });
});
