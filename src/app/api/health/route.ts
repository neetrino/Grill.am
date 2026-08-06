import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Internal health probe for Playwright webServer / ops.
 * Exposes no secrets.
 */
export async function GET(): Promise<NextResponse> {
  let database: "up" | "down" = "down";
  try {
    await getDb().execute(sql`select 1`);
    database = "up";
  } catch {
    database = "down";
  }

  const ok = database === "up";
  return NextResponse.json(
    {
      ok,
      service: "white-shop",
      database,
      time: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
