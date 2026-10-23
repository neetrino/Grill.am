import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { logger } from "@/lib/observability/logger";

import { HEALTH_SERVICE_NAME } from "../constants";

export const dynamic = "force-dynamic";

type DeepHealthBody = {
  status: "ok" | "error";
  service: typeof HEALTH_SERVICE_NAME;
  database: "ok" | "error";
  timestamp: string;
};

function respond(body: DeepHealthBody, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Infrequent dependency probe. Not for 1–5 minute uptime checks:
 * a sleeping database must not fail `/api/health`.
 */
export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();

  try {
    await getDb().execute(sql`select 1`);
    return respond(
      {
        status: "ok",
        service: HEALTH_SERVICE_NAME,
        database: "ok",
        timestamp,
      },
      200,
    );
  } catch (error) {
    logger.error("health.deep.database_unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return respond(
      {
        status: "error",
        service: HEALTH_SERVICE_NAME,
        database: "error",
        timestamp,
      },
      503,
    );
  }
}
