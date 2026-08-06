import { NextResponse } from "next/server";

import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";
import { getArcaMockEntryByProviderOrderId } from "@/lib/payments/arca/mock-client";

export const dynamic = "force-dynamic";

/**
 * Local stand-in for ARCA payment page. Redirects to merchant returnUrl.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "missing_orderId" }, { status: 400 });
  }

  const entry = getArcaMockEntryByProviderOrderId(orderId);
  if (!entry?.returnUrl) {
    return NextResponse.json({ error: "unknown_order" }, { status: 404 });
  }

  const returnUrl = new URL(entry.returnUrl);
  returnUrl.searchParams.set("orderId", orderId);
  return NextResponse.redirect(returnUrl, 303);
}
