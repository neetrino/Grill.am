import "server-only";

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import {
  orderAccessCookieName,
  verifyGuestOrderAccessToken,
} from "@/features/payments/domain/order-access-token";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { idramBrowserReturnSchema } from "@/lib/payments/idram/schemas";
import { logger } from "@/lib/observability/logger";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

function redirectLocal(locale: string, path: string): NextResponse {
  const safeLocale = isLocale(locale) ? locale : "en";
  const url = new URL(
    `/${safeLocale}${path.startsWith("/") ? path : `/${path}`}`,
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  );
  const response = NextResponse.redirect(url, 303);
  for (const [k, v] of Object.entries(NO_STORE)) {
    response.headers.set(k, v);
  }
  return response;
}

type BrowserParams = {
  billNo?: string;
  orderNumber?: string;
  locale?: string;
};

function parseBrowserParams(raw: Record<string, string | undefined>): BrowserParams {
  const parsed = idramBrowserReturnSchema.safeParse(raw);
  if (!parsed.success) {
    return {};
  }
  return {
    billNo: parsed.data.EDP_BILL_NO ?? parsed.data.bill,
    orderNumber: parsed.data.gm_order,
    locale: parsed.data.gm_locale ?? parsed.data.locale,
  };
}

/**
 * SUCCESS_URL / FAIL_URL handler — UX only (Merchant API §1).
 * Never captures or fails payment from browser redirects.
 */
export async function handleIdramBrowserReturn(
  request: Request,
  kind: "success" | "fail",
): Promise<NextResponse> {
  const url = new URL(request.url);
  let params: BrowserParams = {};

  if (request.method === "POST") {
    try {
      const form = await request.formData();
      params = parseBrowserParams({
        EDP_BILL_NO: form.get("EDP_BILL_NO")?.toString(),
        bill: form.get("bill")?.toString(),
        gm_order: form.get("gm_order")?.toString(),
        gm_locale: form.get("gm_locale")?.toString(),
        locale: form.get("locale")?.toString(),
      });
    } catch {
      params = {};
    }
  } else {
    params = parseBrowserParams({
      EDP_BILL_NO: url.searchParams.get("EDP_BILL_NO") ?? undefined,
      bill: url.searchParams.get("bill") ?? undefined,
      gm_order: url.searchParams.get("gm_order") ?? undefined,
      gm_locale: url.searchParams.get("gm_locale") ?? undefined,
      locale: url.searchParams.get("locale") ?? undefined,
    });
  }

  const safeLocale =
    params.locale && isLocale(params.locale) ? params.locale : "en";

  let payment =
    params.billNo != null
      ? (
          await getDb()
            .select()
            .from(payments)
            .where(
              and(
                eq(payments.provider, "idram"),
                eq(payments.providerOrderNumber, params.billNo),
              ),
            )
            .limit(1)
        )[0]
      : undefined;

  let order =
    payment != null
      ? (
          await getDb()
            .select()
            .from(orders)
            .where(eq(orders.id, payment.orderId))
            .limit(1)
        )[0]
      : undefined;

  if (!order && params.orderNumber) {
    const [byNumber] = await getDb()
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, params.orderNumber))
      .limit(1);
    order = byNumber;
    if (order && !payment) {
      const [latest] = await getDb()
        .select()
        .from(payments)
        .where(
          and(eq(payments.orderId, order.id), eq(payments.provider, "idram")),
        )
        .orderBy(desc(payments.attemptNumber))
        .limit(1);
      payment = latest;
    }
  }

  if (!order) {
    return redirectLocal(safeLocale, "/checkout");
  }

  const user = await getCurrentUser();
  const isStaff = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const isOwner = Boolean(user && order.userId && order.userId === user.id);

  if (order.userId) {
    if (!isOwner && !isStaff) {
      return redirectLocal(safeLocale, "/checkout");
    }
  } else {
    const cookieStore = await cookies();
    const raw = cookieStore.get(orderAccessCookieName(order.orderNumber))?.value;
    const ok = verifyGuestOrderAccessToken(
      raw ?? "",
      order.guestAccessTokenHash,
      order.guestAccessExpiresAt,
    );
    if (!ok && !isStaff) {
      return redirectLocal(safeLocale, "/checkout");
    }
  }

  logger.info(kind === "success" ? "idram.success_redirect" : "idram.fail_redirect", {
    provider: "idram",
    paymentId: payment?.id,
    orderId: order.id,
  });

  const base = `/checkout/success/${order.orderNumber}`;
  if (order.paymentStatus === "CAPTURED") {
    if (order.status === "REQUIRES_REVIEW") {
      return redirectLocal(safeLocale, `${base}?state=review`);
    }
    return redirectLocal(safeLocale, base);
  }

  return redirectLocal(safeLocale, `${base}?state=pending`);
}
