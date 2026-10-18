import { NextResponse } from "next/server";

import {
  buildCoinAnalyticsCsv,
  getCoinAnalyticsSummary,
} from "@/features/loyalty/application/coin-analytics-queries";
import { analyticsDateRangeSchema } from "@/features/analytics/domain/date-range";
import { getCurrentUser } from "@/lib/auth/session";

function firstQueryParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/** Admin-only coin analytics CSV (ledger amounts only — no order prices). */
export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = analyticsDateRangeSchema.safeParse({
    from: firstQueryParam(url.searchParams.get("from") ?? undefined),
    to: firstQueryParam(url.searchParams.get("to") ?? undefined),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid date range", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const summary = await getCoinAnalyticsSummary(parsed.data);
  const csv = buildCoinAnalyticsCsv(summary.dailyRows);
  const filename = `coin-analytics-${parsed.data.from}-${parsed.data.to}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
