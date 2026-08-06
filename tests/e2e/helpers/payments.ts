import { createHash } from "node:crypto";

import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { fillCheckoutContact, seedCartViaUi } from "./seed-cart";

export type E2eOrderStateResponse = {
  ok: boolean;
  state?: {
    order: {
      id: string;
      orderNumber: string;
      status: string;
      paymentStatus: string;
      totalAmount: number;
      hasGuestAccessToken: boolean;
      guestAccessExpiresAt: string | null;
    };
    payments: Array<{
      id: string;
      provider: string;
      method: string;
      status: string;
      attemptNumber: number;
      providerReference: string | null;
      providerOrderNumber: string | null;
      amount: number;
    }>;
    events: Array<{
      eventType: string;
      provider: string | null;
      providerEventId: string | null;
      toState: string | null;
      kind: string | null;
    }>;
    outbox: Array<{
      id: string;
      eventType: string;
      status: string;
      dedupeKey: string | null;
      aggregateId: string;
    }>;
    cart: { id: string; status: string; itemCount: number } | null;
    productStock: number | null;
    adminReview: { visible: boolean; title: string };
  };
};

export async function resetPaymentE2eControls(
  request: APIRequestContext,
  baseURL: string,
): Promise<void> {
  await request.post(`${baseURL}/api/e2e/arca-mock`, {
    data: { action: "reset" },
  });
  await request.post(`${baseURL}/api/e2e/arca-mock`, {
    data: { action: "setDefaultStatus", status: "captured" },
  });
  await request.post(`${baseURL}/api/e2e/state`, {
    data: { action: "clearAvailabilityOverride" },
  });
  await request.post(`${baseURL}/api/e2e/state`, {
    data: { action: "setProductStock", stockOnHand: 100 },
  });
  await request.delete(`${baseURL}/api/e2e/inbox?inbox=e2e`);
}

export async function selectArca(page: Page): Promise<void> {
  const radio = page.locator('input[name="paymentMethod"][value="arca"]');
  await expect(radio).toBeVisible({ timeout: 15_000 });
  await expect(radio).toBeEnabled();
  await radio.check();
}

export async function selectIdram(page: Page): Promise<void> {
  const radio = page.locator('input[name="paymentMethod"][value="idram"]');
  await expect(radio).toBeVisible({ timeout: 15_000 });
  await expect(radio).toBeEnabled();
  await radio.check();
}

export function orderNumberFromSuccessUrl(url: string): string {
  const match = url.match(/\/checkout\/success\/([^/?#]+)/);
  if (!match?.[1]) {
    throw new Error(`Success URL missing order number: ${url}`);
  }
  return decodeURIComponent(match[1]);
}

export async function getOrderState(
  request: APIRequestContext,
  baseURL: string,
  orderNumber: string,
): Promise<NonNullable<E2eOrderStateResponse["state"]>> {
  const response = await request.get(
    `${baseURL}/api/e2e/state?orderNumber=${encodeURIComponent(orderNumber)}`,
  );
  expect(response.ok(), `state probe failed for ${orderNumber}`).toBeTruthy();
  const json = (await response.json()) as E2eOrderStateResponse;
  if (!json.ok || !json.state) {
    throw new Error(`Missing order state for ${orderNumber}`);
  }
  return json.state;
}

const PROVIDER_REDIRECT_URL =
  /\/(api\/e2e\/(idram-payment|arca-form)|checkout\/success|api\/v1\/payments\/arca\/return)\//;

function isCheckoutFormUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    return /\/[a-z]{2}\/checkout$/.test(path) || path.endsWith("/checkout");
  } catch {
    return false;
  }
}

/**
 * Place ARCA/iDram checkout. Retries once if Neon drops mid-transaction
 * (`Failed query: rollback`) while still on the checkout form.
 */
export async function placeProviderCheckout(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
  method: "arca" | "idram",
  suffix: string,
): Promise<void> {
  await seedCartViaUi(page, request, baseURL);
  if (method === "arca") {
    await selectArca(page);
  } else {
    await selectIdram(page);
  }
  await fillCheckoutContact(page, suffix);
  const place = page.getByRole("button", { name: /place order/i });
  await expect(place).toBeEnabled();
  await place.click();

  const rollback = page.getByText(/Failed query:\s*rollback/i);
  const outcome = await Promise.race([
    page
      .waitForURL(PROVIDER_REDIRECT_URL, { timeout: 55_000 })
      .then(() => "redirected" as const),
    rollback
      .waitFor({ state: "visible", timeout: 55_000 })
      .then(() => "rollback" as const),
  ]).catch(() => "pending" as const);

  if (outcome === "rollback" && isCheckoutFormUrl(page.url())) {
    await expect(place).toBeEnabled({ timeout: 15_000 });
    await place.click();
  }
}

/**
 * Wait for ARCA/iDram browser success. If ARCA return hits a transient DB
 * error and dumps back to checkout, re-hit the mock return URL once.
 */
export async function awaitCheckoutSuccessUrl(
  page: Page,
  request: APIRequestContext,
  baseURL: string,
): Promise<string> {
  try {
    await page.waitForURL(/\/checkout\/success\//, {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    return orderNumberFromSuccessUrl(page.url());
  } catch {
    const listResponse = await request.get(`${baseURL}/api/e2e/arca-mock`);
    expect(listResponse.ok()).toBeTruthy();
    const listJson = (await listResponse.json()) as {
      ok: boolean;
      entries: Array<{
        providerOrderId: string;
        orderNumber: string;
        returnUrl: string;
      }>;
    };
    const entry = listJson.entries.at(-1);
    if (!entry?.returnUrl) {
      throw new Error(
        `Expected checkout success; got ${page.url()} with no ARCA mock entry`,
      );
    }
    const current = page.url();
    const canRetryReturn =
      isCheckoutFormUrl(current) ||
      /\/api\/e2e\/arca-form|\/api\/v1\/payments\/arca\/return/.test(current);
    if (!canRetryReturn) {
      throw new Error(
        `Expected checkout success (or ARCA retry surface); got ${current}`,
      );
    }
    const returnUrl = new URL(entry.returnUrl);
    returnUrl.searchParams.set("orderId", entry.providerOrderId);
    await page.goto(returnUrl.toString(), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/checkout\/success\//, {
      timeout: 45_000,
      waitUntil: "domcontentloaded",
    });
    return orderNumberFromSuccessUrl(page.url());
  }
}

export async function processOutboxCapture(
  request: APIRequestContext,
  baseURL: string,
): Promise<void> {
  const response = await request.post(`${baseURL}/api/e2e/outbox/process`);
  expect(response.ok()).toBeTruthy();
}

export async function getInboxMessages(
  request: APIRequestContext,
  baseURL: string,
): Promise<Array<{ id: string; to: string; subject: string; text: string }>> {
  const response = await request.get(`${baseURL}/api/e2e/inbox?inbox=e2e`);
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as {
    ok: boolean;
    messages: Array<{ id: string; to: string; subject: string; text: string }>;
  };
  return json.messages;
}

export function computeIdramChecksum(fields: {
  edpRecAccount: string;
  edpAmount: string;
  secretKey: string;
  edpBillNo: string;
  edpPayerAccount: string;
  edpTransId: string;
  edpTransDate: string;
}): string {
  const source = [
    fields.edpRecAccount,
    fields.edpAmount,
    fields.secretKey,
    fields.edpBillNo,
    fields.edpPayerAccount,
    fields.edpTransId,
    fields.edpTransDate,
  ].join(":");
  return createHash("md5").update(source, "utf8").digest("hex");
}

export async function postIdramPrecheck(
  request: APIRequestContext,
  baseURL: string,
  fields: { billNo: string; amount: string; recAccount: string },
  resultPath = "/api/v1/payments/idram/result",
): Promise<{ status: number; body: string }> {
  const response = await request.post(`${baseURL}${resultPath}`, {
    form: {
      EDP_PRECHECK: "YES",
      EDP_BILL_NO: fields.billNo,
      EDP_REC_ACCOUNT: fields.recAccount,
      EDP_AMOUNT: fields.amount,
    },
  });
  return { status: response.status(), body: (await response.text()).trim() };
}

export function uniqueIdramTransId(): string {
  return `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0")}`.slice(0, 14);
}

export async function postIdramConfirmation(
  request: APIRequestContext,
  baseURL: string,
  fields: {
    billNo: string;
    amount: string;
    recAccount: string;
    secretKey: string;
    payerAccount?: string;
    transId?: string;
    transDate?: string;
    checksum?: string;
  },
  resultPath = "/api/v1/payments/idram/result",
): Promise<{ status: number; body: string }> {
  const payerAccount = fields.payerAccount ?? "123456789012";
  const transId = fields.transId ?? uniqueIdramTransId();
  const transDate = fields.transDate ?? "06/08/2026";
  const checksum =
    fields.checksum ??
    computeIdramChecksum({
      edpRecAccount: fields.recAccount,
      edpAmount: fields.amount,
      secretKey: fields.secretKey,
      edpBillNo: fields.billNo,
      edpPayerAccount: payerAccount,
      edpTransId: transId,
      edpTransDate: transDate,
    });

  const response = await request.post(`${baseURL}${resultPath}`, {
    form: {
      EDP_BILL_NO: fields.billNo,
      EDP_REC_ACCOUNT: fields.recAccount,
      EDP_AMOUNT: fields.amount,
      EDP_PAYER_ACCOUNT: payerAccount,
      EDP_TRANS_ID: transId,
      EDP_TRANS_DATE: transDate,
      EDP_CHECKSUM: checksum,
    },
  });
  return { status: response.status(), body: (await response.text()).trim() };
}
