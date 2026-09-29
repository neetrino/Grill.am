import "server-only";

import {
  analyticsPeriodUtcBounds,
  formatPeriodDelta,
  type AnalyticsDateRange,
} from "@/features/analytics/domain/date-range";
import { rangeForDashboardMetricPeriod } from "@/features/analytics/domain/dashboard-periods";
import {
  queryCoinDailyRows,
  queryLedgerFlowTotals,
  queryOutstandingBalances,
  type CoinAnalyticsTopUser,
} from "@/features/loyalty/application/coin-analytics-ledger";
import {
  buildCoinTrendSeries,
  coinNetIssued,
  deriveCoinFlow,
  previousEqualWindow,
  type CoinDailyRow,
  type CoinFlow,
  type CoinTrendPoint,
} from "@/features/loyalty/domain/coin-analytics";
import type { Locale } from "@/lib/i18n/config";
import { formatAppIsoDate } from "@/lib/datetime/app-timezone";

export type { CoinAnalyticsTopUser } from "@/features/loyalty/application/coin-analytics-ledger";

export type CoinAnalyticsPeriodSnapshot = {
  period: "today" | "week" | "month" | "quarter";
  netSpent: number;
  netEarned: number;
  spentDelta: string;
  earnedDelta: string;
};

export type CoinAnalyticsSummary = {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  flow: CoinFlow;
  previousFlow: CoinFlow;
  outstandingBalance: number;
  dailyRows: CoinDailyRow[];
  walletUsers: CoinAnalyticsTopUser[];
};

async function computeFlowForBounds(input: {
  start: Date;
  end: Date;
}): Promise<CoinFlow> {
  const totals = await queryLedgerFlowTotals(input);
  return deriveCoinFlow({
    ...totals,
    spenderCount: 0,
    positiveSpent: 0,
  });
}

/** Loads coin analytics for an inclusive app-timezone date range (ledger only). */
export async function getCoinAnalyticsSummary(
  range: AnalyticsDateRange,
  input?: { userQuery?: string },
): Promise<CoinAnalyticsSummary> {
  const { start, end } = analyticsPeriodUtcBounds(range.from, range.to);
  const previous = previousEqualWindow(range);

  const [flow, previousFlow, dailyRows, outstanding] = await Promise.all([
    computeFlowForBounds({ start, end }),
    computeFlowForBounds({ start: previous.start, end: previous.end }),
    queryCoinDailyRows({ start, end }),
    queryOutstandingBalances({ userQuery: input?.userQuery }),
  ]);

  return {
    from: range.from,
    to: range.to,
    previousFrom: formatAppIsoDate(previous.start),
    previousTo: formatAppIsoDate(previous.end),
    flow,
    previousFlow,
    outstandingBalance: outstanding.outstandingBalance,
    dailyRows,
    walletUsers: outstanding.walletUsers,
  };
}

/** Today / week / month / quarter coin movement (not wallet balances). */
export async function getCoinPeriodSnapshots(): Promise<
  CoinAnalyticsPeriodSnapshot[]
> {
  const periods = ["today", "week", "month", "quarter"] as const;

  return Promise.all(
    periods.map(async (period) => {
      const range = rangeForDashboardMetricPeriod(period);
      const { start, end } = analyticsPeriodUtcBounds(range.from, range.to);
      const previous = previousEqualWindow(range);

      const [current, previousFlow] = await Promise.all([
        computeFlowForBounds({ start, end }),
        computeFlowForBounds({
          start: previous.start,
          end: previous.end,
        }),
      ]);

      return {
        period,
        netSpent: current.netSpent,
        netEarned: current.netEarned,
        spentDelta: formatPeriodDelta(current.netSpent, previousFlow.netSpent),
        earnedDelta: formatPeriodDelta(
          current.netEarned,
          previousFlow.netEarned,
        ),
      };
    }),
  );
}

export function buildCoinAnalyticsTrend(
  summary: CoinAnalyticsSummary,
  locale: Locale,
): CoinTrendPoint[] {
  return buildCoinTrendSeries(
    summary.dailyRows,
    { from: summary.from, to: summary.to },
    locale,
  );
}

/** CSV body for coin daily rows (no order prices). */
export function buildCoinAnalyticsCsv(rows: CoinDailyRow[]): string {
  const header = "date,net_spent,net_earned,net_issued";
  const lines = rows.map((row) => {
    const issued = coinNetIssued({
      netSpent: row.netSpent,
      netEarned: row.netEarned,
    });
    return `${row.date},${row.netSpent},${row.netEarned},${issued}`;
  });
  return [header, ...lines].join("\n");
}
