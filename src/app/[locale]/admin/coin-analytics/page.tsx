import { notFound } from "next/navigation";

import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import { countAnalyticsRangeDays } from "@/features/analytics/domain/dashboard-periods";
import {
  analyticsDateRangeSchema,
  matchAnalyticsPeriodPreset,
  rangeForAnalyticsPeriod,
} from "@/features/analytics/domain/date-range";
import {
  buildCoinAnalyticsTrend,
  getCoinAnalyticsSummary,
  getCoinPeriodSnapshots,
} from "@/features/loyalty/application/coin-analytics-queries";
import { CoinAnalyticsPeriodCard } from "@/features/loyalty/ui/CoinAnalyticsPeriodCard";
import { CoinAnalyticsTrend } from "@/features/loyalty/ui/CoinAnalyticsTrend";
import { CoinAnalyticsUserRankings } from "@/features/loyalty/ui/CoinAnalyticsUserRankings";
import { CoinPeriodOverview } from "@/features/loyalty/ui/CoinPeriodOverview";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminCoinAnalyticsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AdminCoinAnalyticsPage({
  params,
  searchParams,
}: AdminCoinAnalyticsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getDictionary(locale).admin.coinAnalytics;
  const raw = await searchParams;
  const defaults = rangeForAnalyticsPeriod("last_7_days");
  const parsed = analyticsDateRangeSchema.safeParse({
    from: firstParam(raw.from) ?? defaults.from,
    to: firstParam(raw.to) ?? defaults.to,
  });

  const range = parsed.success ? parsed.data : defaults;
  const preset = matchAnalyticsPeriodPreset(range);
  const userQuery = (firstParam(raw.q) ?? "").trim().slice(0, 80);

  const [summary, periodSnapshots] = await Promise.all([
    getCoinAnalyticsSummary(range, { userQuery }),
    getCoinPeriodSnapshots(),
  ]);

  const exportQuery = new URLSearchParams({
    from: range.from,
    to: range.to,
  }).toString();

  const trendPoints = buildCoinAnalyticsTrend(summary, locale);
  const aggregatedMonthly = countAnalyticsRangeDays(range) > 45;

  return (
    <section>
      <div className="mb-4">
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{copy.subtitle}</p>
      </div>

      <CoinPeriodOverview
        locale={locale}
        snapshots={periodSnapshots}
        labels={copy.periods}
      />

      <CoinAnalyticsPeriodCard
        key={`${range.from}:${range.to}`}
        locale={locale}
        from={range.from}
        to={range.to}
        preset={preset}
        exportQuery={exportQuery}
        rangeInvalid={!parsed.success}
      />

      <CoinAnalyticsTrend
        locale={locale}
        points={trendPoints}
        aggregatedMonthly={aggregatedMonthly}
      />

      <CoinAnalyticsUserRankings
        locale={locale}
        users={summary.walletUsers}
        outstandingBalance={summary.outstandingBalance}
        from={range.from}
        to={range.to}
        query={userQuery}
      />
    </section>
  );
}
