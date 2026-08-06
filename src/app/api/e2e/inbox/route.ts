import { NextResponse } from "next/server";

import { assertE2eControlSurfaceEnabled } from "@/lib/e2e/guard";
import {
  clearCapturedEmails,
  getCapturedEmails,
} from "@/lib/email/capture-adapter";

export const dynamic = "force-dynamic";

/**
 * E2E-only captured email inbox. Never available in production.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const key =
    new URL(request.url).searchParams.get("inbox")?.trim() || "e2e";
  const messages = getCapturedEmails(key).map((message) => ({
    id: message.id,
    to: message.to,
    subject: message.subject,
    text: message.text,
    capturedAt: message.capturedAt,
  }));

  return NextResponse.json({ ok: true, messages });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    assertE2eControlSurfaceEnabled();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const key =
    new URL(request.url).searchParams.get("inbox")?.trim() || "e2e";
  clearCapturedEmails(key);
  return NextResponse.json({ ok: true });
}
