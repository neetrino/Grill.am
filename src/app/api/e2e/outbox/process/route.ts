import { NextResponse } from "next/server";

import { processOutboxOnce } from "@/features/outbox/application/process-outbox";
import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";
import { createCaptureEmailDelivery } from "@/lib/email/capture-adapter";

export const dynamic = "force-dynamic";

/**
 * E2E-only one-shot outbox drain into the capture inbox.
 */
export async function POST(): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const summary = await processOutboxOnce({
    batchSize: 20,
    delivery: createCaptureEmailDelivery("e2e"),
    workerId: "e2e-http-worker",
  });

  return NextResponse.json({ ok: true, summary });
}
