import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lightweight readiness probe for container orchestration.
 * External dependencies are intentionally excluded.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      service: "white-shop",
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
