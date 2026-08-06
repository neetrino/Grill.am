import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db/client";
import { orders, products } from "@/db/schema";
import {
  getPaymentMethodAvailability,
  isPaymentMethodEnabled,
} from "@/features/payments/application/get-payment-method-availability";
import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";
import { inspectE2eOrderState } from "@/lib/e2e/inspect-order-state";
import {
  getE2ePaymentAvailabilityOverride,
  setE2ePaymentAvailabilityOverride,
} from "@/lib/e2e/payment-availability-override";
import { E2E_PAYMENT_PRODUCT_SKU } from "@/lib/e2e/payment-product";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("setProductStock"),
    sku: z.string().min(1).max(64).optional(),
    stockOnHand: z.number().int().min(0).max(1_000_000),
  }),
  z.object({
    action: z.literal("expireGuestAccess"),
    orderNumber: z.string().min(1).max(64),
  }),
  z.object({
    action: z.literal("setAvailabilityOverride"),
    cash_on_delivery: z.boolean().optional(),
    arca: z.boolean().optional(),
    idram: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("clearAvailabilityOverride"),
  }),
  z.object({
    action: z.literal("assertMethodEnabled"),
    method: z.enum(["cash_on_delivery", "arca", "idram"]),
  }),
]);

function gate(): NextResponse | null {
  try {
    assertE2eControlSurfaceEnabled();
    return null;
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = gate();
  if (denied) return denied;

  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderNumber")?.trim();
  if (!orderNumber) {
    return NextResponse.json(
      {
        ok: true,
        availability: getPaymentMethodAvailability(),
        override: getE2ePaymentAvailabilityOverride(),
        diagnostics: {
          e2eProviderMode: process.env.E2E_PROVIDER_MODE ?? null,
          e2eEmailMode: process.env.E2E_EMAIL_MODE ?? null,
          paymentEnableArca: process.env.PAYMENT_ENABLE_ARCA ?? null,
          paymentEnableIdram: process.env.PAYMENT_ENABLE_IDRAM ?? null,
          arcaMockEnabled: process.env.E2E_PROVIDER_MODE?.trim().toLowerCase() === "mock",
        },
      },
      { status: 200 },
    );
  }

  const state = await inspectE2eOrderState(orderNumber);
  if (!state) {
    return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, state });
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = gate();
  if (denied) return denied;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const body = parsed.data;
  const db = getDb();
  const now = new Date();

  if (body.action === "setProductStock") {
    const sku = body.sku ?? E2E_PAYMENT_PRODUCT_SKU;
    const updated = await db
      .update(products)
      .set({ stockOnHand: body.stockOnHand, updatedAt: now })
      .where(eq(products.sku, sku))
      .returning({ id: products.id, stockOnHand: products.stockOnHand });
    if (updated.length === 0) {
      return NextResponse.json({ error: "product_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, stockOnHand: updated[0]?.stockOnHand });
  }

  if (body.action === "expireGuestAccess") {
    const [order] = await db
      .update(orders)
      .set({
        guestAccessExpiresAt: new Date(Date.now() - 60_000),
        updatedAt: now,
      })
      .where(eq(orders.orderNumber, body.orderNumber))
      .returning({ id: orders.id });
    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "setAvailabilityOverride") {
    setE2ePaymentAvailabilityOverride({
      cash_on_delivery: body.cash_on_delivery,
      arca: body.arca,
      idram: body.idram,
    });
    return NextResponse.json({
      ok: true,
      availability: getPaymentMethodAvailability(),
    });
  }

  if (body.action === "clearAvailabilityOverride") {
    setE2ePaymentAvailabilityOverride(null);
    return NextResponse.json({
      ok: true,
      availability: getPaymentMethodAvailability(),
    });
  }

  const enabled = isPaymentMethodEnabled(body.method);
  return NextResponse.json({
    ok: true,
    method: body.method,
    enabled,
    availability: getPaymentMethodAvailability(),
  });
}
