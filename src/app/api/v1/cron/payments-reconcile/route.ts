import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/features/payments/application/authorize-cron-request";
import { runScheduledPaymentReconcile } from "@/features/payments/application/run-scheduled-payment-reconcile";
import { logger } from "@/lib/observability/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Batch provider status checks + local expiry may need headroom. */
export const maxDuration = 60;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
};

/**
 * Scheduled payment reconcile — Vercel Cron every
 * `PAYMENT_RECONCILE_INTERVAL_MINUTES` (default 30 → twice per hour).
 * Requires `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }

  try {
    const summary = await runScheduledPaymentReconcile();
    return NextResponse.json(
      { ok: true, summary },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    logger.error("payments.reconcile.cron_failed", {
      errorCode: error instanceof Error ? error.name : "RECONCILE_CRON_ERROR",
    });
    return NextResponse.json(
      { ok: false, error: "reconcile_failed" },
      { status: 500, headers: NO_STORE },
    );
  }
}
