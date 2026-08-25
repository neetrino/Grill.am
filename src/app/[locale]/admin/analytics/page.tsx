import { notFound } from "next/navigation";

import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  DashboardPeriodOverview,
  type DashboardPeriodSnapshot,
} from "@/features/admin/ui/DashboardPeriodOverview";
import { getAnalyticsSummary } from "@/features/analytics/application/queries";
import {
  buildAnalyticsTrendSeries,
  countAnalyticsRangeDays,
  rangeForDashboardMetricPeriod,
} from "@/features/analytics/domain/dashboard-periods";
import {
  analyticsDateRangeSchema,
  formatPeriodDelta,
  matchAnalyticsPeriodPreset,
  rangeForAnalyticsPeriod,
} from "@/features/analytics/domain/date-range";
import { AnalyticsMetricCards } from "@/features/analytics/ui/AnalyticsMetricCards";
import { AnalyticsOrdersByDay } from "@/features/analytics/ui/AnalyticsOrdersByDay";
import { AnalyticsPeriodCard } from "@/features/analytics/ui/AnalyticsPeriodCard";
import { AnalyticsTopRankings } from "@/features/analytics/ui/AnalyticsTopRankings";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminAnalyticsPageProps = {
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

function toPeriodSnapshot(
  period: DashboardPeriodSnapshot["period"],
  summary: {
    orderCount: number;
    revenueAmount: number;
    averageOrderValue: number;
    previousOrderCount: number;
    previousRevenueAmount: number;
  },
): DashboardPeriodSnapshot {
  return {
    period,
    orderCount: summary.orderCount,
    revenueAmount: summary.revenueAmount,
    averageOrderValue: summary.averageOrderValue,
    revenueDelta: formatPeriodDelta(
      summary.revenueAmount,
      summary.previousRevenueAmount,
    ),
    orderDelta: formatPeriodDelta(
      summary.orderCount,
      summary.previousOrderCount,
    ),
  };
}

export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: AdminAnalyticsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);
  const copy = dict.admin.analytics;
  const dashboardCopy = dict.admin.dashboard;
  const raw = await searchParams;
  const defaults = rangeForAnalyticsPeriod("last_7_days");
  const parsed = analyticsDateRangeSchema.safeParse({
    from: firstParam(raw.from) ?? defaults.from,
    to: firstParam(raw.to) ?? defaults.to,
  });

  const range = parsed.success ? parsed.data : defaults;
  const preset = matchAnalyticsPeriodPreset(range);
  const [
    summary,
    todaySummary,
    weekSummary,
    monthSummary,
    quarterSummary,
  ] = await Promise.all([
    getAnalyticsSummary({ ...range, locale }),
    getAnalyticsSummary({
      ...rangeForDashboardMetricPeriod("today"),
      locale,
    }),
    getAnalyticsSummary({
      ...rangeForDashboardMetricPeriod("week"),
      locale,
    }),
    getAnalyticsSummary({
      ...rangeForDashboardMetricPeriod("month"),
      locale,
    }),
    getAnalyticsSummary({
      ...rangeForDashboardMetricPeriod("quarter"),
      locale,
    }),
  ]);

  const exportQuery = new URLSearchParams({
    from: range.from,
    to: range.to,
  }).toString();

  const trendPoints = buildAnalyticsTrendSeries(
    summary.dailyRows,
    range,
    locale,
  );
  const aggregatedMonthly = countAnalyticsRangeDays(range) > 45;

  const snapshots: DashboardPeriodSnapshot[] = [
    toPeriodSnapshot("today", todaySummary),
    toPeriodSnapshot("week", weekSummary),
    toPeriodSnapshot("month", monthSummary),
    toPeriodSnapshot("quarter", quarterSummary),
  ];

  return (
    <section>
      <div className="mb-3">
        <AdminPageTitle>{copy.title}</AdminPageTitle>
        <p className="mt-0.5 text-xs text-gray-500">{copy.subtitle}</p>
      </div>

      <DashboardPeriodOverview
        locale={locale}
        snapshots={snapshots}
        labels={dashboardCopy}
        showAnalyticsLink={false}
      />

      <AnalyticsPeriodCard
        key={`${range.from}:${range.to}`}
        locale={locale}
        from={range.from}
        to={range.to}
        preset={preset}
        exportQuery={exportQuery}
        rangeInvalid={!parsed.success}
      />

      <AnalyticsMetricCards
        orderCount={summary.orderCount}
        revenueLabel={formatMoneyAmount(summary.revenueAmount, "AMD", locale)}
        averageOrderValueLabel={formatMoneyAmount(
          summary.averageOrderValue,
          "AMD",
          locale,
        )}
        userCount={summary.userCount}
        orderDelta={formatPeriodDelta(
          summary.orderCount,
          summary.previousOrderCount,
        )}
        revenueDelta={formatPeriodDelta(
          summary.revenueAmount,
          summary.previousRevenueAmount,
        )}
        aovDelta={formatPeriodDelta(
          summary.averageOrderValue,
          summary.previousAverageOrderValue,
        )}
      />

      <AnalyticsOrdersByDay
        locale={locale}
        points={trendPoints}
        aggregatedMonthly={aggregatedMonthly}
      />

      <AnalyticsTopRankings
        locale={locale}
        products={summary.topProducts}
        categories={summary.topCategories}
      />
    </section>
  );
}
