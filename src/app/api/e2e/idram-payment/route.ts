import { NextResponse } from "next/server";

import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";

export const dynamic = "force-dynamic";

type StoredIdramPayment = {
  billNo: string;
  amount: string;
  recAccount: string;
  orderNumber?: string;
  locale?: string;
  receivedAt: string;
};

const GLOBAL_KEY = "__grill_am_idram_e2e_payments__";

function payments(): Map<string, StoredIdramPayment> {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: Map<string, StoredIdramPayment>;
  };
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map();
  }
  return g[GLOBAL_KEY];
}

export function getStoredIdramPayment(
  billNo: string,
): StoredIdramPayment | undefined {
  return payments().get(billNo);
}

export function clearStoredIdramPayments(): void {
  payments().clear();
}

/**
 * Local stand-in for iDram GetPayment. Accepts the merchant POST form.
 * Does not auto-confirm — E2E tests call RESULT_URL with a real checksum.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const form = await request.formData();
  const billNo = String(form.get("EDP_BILL_NO") ?? "").trim();
  const amount = String(form.get("EDP_AMOUNT") ?? "").trim();
  const recAccount = String(form.get("EDP_REC_ACCOUNT") ?? "").trim();
  const orderNumber = String(form.get("gm_order") ?? "").trim() || undefined;
  const locale = String(form.get("gm_locale") ?? "").trim() || undefined;

  if (!billNo || !amount || !recAccount) {
    return new NextResponse("FAIL", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Secret must never appear in the merchant form.
  if (form.has("EDP_SECRET") || form.has("SECRET_KEY")) {
    return new NextResponse("SECRET_LEAK", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  payments().set(billNo, {
    billNo,
    amount,
    recAccount,
    orderNumber,
    locale,
    receivedAt: new Date().toISOString(),
  });

  const successBase =
    process.env.IDRAM_SUCCESS_URL?.trim() ||
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3100"}/api/v1/payments/idram/success`;
  const successUrl = new URL(successBase);
  if (orderNumber) successUrl.searchParams.set("gm_order", orderNumber);
  if (locale) successUrl.searchParams.set("gm_locale", locale);
  successUrl.searchParams.set("EDP_BILL_NO", billNo);

  // Return a tiny page so Playwright can assert POST receipt, then navigate.
  const html = `<!doctype html><html><body>
    <p data-testid="idram-mock-received">iDram mock received ${billNo}</p>
    <a data-testid="idram-mock-success" href="${successUrl.toString()}">Continue</a>
  </body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const billNo = new URL(request.url).searchParams.get("bill")?.trim();
  if (!billNo) {
  return NextResponse.json({
    ok: true,
    count: payments().size,
  });
  }
  return NextResponse.json({
    ok: true,
    payment: payments().get(billNo) ?? null,
  });
}
