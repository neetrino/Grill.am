import { NextResponse } from "next/server";

import { processArcaPaymentStatus } from "@/features/payments/providers/arca/process-arca-status";
import { arcaReturnQuerySchema } from "@/lib/payments/arca/schemas";
import { isArcaProtocolError } from "@/lib/payments/arca/errors";
import { isPaymentDomainError } from "@/features/payments/domain/errors";
import { logger } from "@/lib/observability/logger";
import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isLocale } from "@/lib/i18n/config";
import { consumeRateLimit } from "@/features/payments/providers/arca/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

function safeLocalRedirect(
  locale: string,
  path: string,
): NextResponse {
  const safeLocale = isLocale(locale) ? locale : "en";
  const url = `/${safeLocale}${path.startsWith("/") ? path : `/${path}`}`;
  const response = NextResponse.redirect(
    new URL(url, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    303,
  );
  for (const [key, value] of Object.entries(NO_STORE)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * ARCA browser return — Merchant Manual §5.1.1 steps 16–20.
 * Never marks CAPTURED from query params; always verifies via getOrderStatusExtended.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = arcaReturnQuerySchema.safeParse({
    pid: url.searchParams.get("pid") ?? undefined,
    orderId: url.searchParams.get("orderId") ?? undefined,
    mdOrder: url.searchParams.get("mdOrder") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
  });

  const rate = consumeRateLimit({
    key: `arca:return:${parsed.success ? parsed.data.pid : url.pathname}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.ok) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: NO_STORE,
    });
  }

  if (!parsed.success) {
    return safeLocalRedirect("en", "/checkout");
  }

  const locale = parsed.data.locale && isLocale(parsed.data.locale)
    ? parsed.data.locale
    : "en";

  try {
    const [payment] = await getDb()
      .select()
      .from(payments)
      .where(eq(payments.id, parsed.data.pid))
      .limit(1);

    if (!payment || payment.provider !== "arca") {
      return safeLocalRedirect(locale, "/checkout");
    }

    const [order] = await getDb()
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1);

    if (!order) {
      return safeLocalRedirect(locale, "/checkout");
    }

    const claimed =
      parsed.data.orderId ?? parsed.data.mdOrder ?? undefined;

    const result = await processArcaPaymentStatus({
      paymentId: payment.id,
      claimedProviderOrderId: claimed,
      language: locale,
    });

    const base = `/checkout/success/${order.orderNumber}`;

    switch (result.outcome) {
      case "captured":
      case "already_processed":
        return safeLocalRedirect(locale, base);
      case "captured_requires_review":
        return safeLocalRedirect(locale, `${base}?state=review`);
      case "failed":
        return safeLocalRedirect(locale, `${base}?state=failed`);
      case "cancelled":
        return safeLocalRedirect(locale, `${base}?state=cancelled`);
      case "pending":
      case "authorized":
        return safeLocalRedirect(locale, `${base}?state=pending`);
      case "reconciliation_required":
      case "unknown":
      case "refunded":
      case "reversed":
        return safeLocalRedirect(locale, `${base}?state=review`);
      default:
        return safeLocalRedirect(locale, `${base}?state=pending`);
    }
  } catch (error) {
    logger.error("arca.return.error", {
      provider: "arca",
      errorCode:
        isArcaProtocolError(error) || isPaymentDomainError(error)
          ? error.code
          : "ARCA_RETURN_ERROR",
    });
    return safeLocalRedirect(locale, "/checkout");
  }
}
