import { NextResponse } from "next/server";

import { HEALTH_SERVICE_NAME } from "./constants";

export const dynamic = "force-dynamic";

/**
 * Lightweight runtime probe for frequent uptime checks.
 * Must not touch the database or any external dependency.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      service: HEALTH_SERVICE_NAME,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
