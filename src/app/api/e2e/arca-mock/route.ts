import { NextResponse } from "next/server";
import { z } from "zod";

import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";
import {
  listArcaMockEntries,
  resetArcaMockStore,
  setArcaMockDefaultStatus,
  setArcaMockStatusForOrder,
  setArcaMockStatusForProviderOrderId,
  type ArcaMockStatus,
} from "@/lib/payments/arca/mock-client";

export const dynamic = "force-dynamic";

const statusEnum = z.enum([
  "pending",
  "captured",
  "declined",
  "authorized",
  "timeout",
]);

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset") }),
  z.object({
    action: z.literal("setDefaultStatus"),
    status: statusEnum,
  }),
  z.object({
    action: z.literal("setOrderStatus"),
    orderNumber: z.string().min(1).max(64),
    status: statusEnum,
  }),
  z.object({
    action: z.literal("setProviderOrderStatus"),
    providerOrderId: z.string().min(1).max(128),
    status: statusEnum,
  }),
]);

export async function GET(): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, entries: listArcaMockEntries() });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

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
  if (body.action === "reset") {
    resetArcaMockStore();
    return NextResponse.json({ ok: true });
  }
  if (body.action === "setDefaultStatus") {
    setArcaMockDefaultStatus(body.status as ArcaMockStatus);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "setProviderOrderStatus") {
    setArcaMockStatusForProviderOrderId(
      body.providerOrderId,
      body.status as ArcaMockStatus,
    );
    return NextResponse.json({ ok: true });
  }
  setArcaMockStatusForOrder(body.orderNumber, body.status as ArcaMockStatus);
  return NextResponse.json({ ok: true });
}
