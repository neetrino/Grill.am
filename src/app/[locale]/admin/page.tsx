import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  DashboardPeriodOverview,
  type DashboardPeriodSnapshot,
} from "@/features/admin/ui/DashboardPeriodOverview";
import { DashboardQuickActions } from "@/features/admin/ui/DashboardQuickActions";
import { DashboardRecentOrders } from "@/features/admin/ui/DashboardRecentOrders";
import { DashboardStatsGrid } from "@/features/admin/ui/DashboardStatsGrid";
import { DashboardTrendChart } from "@/features/admin/ui/DashboardTrendChart";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
} from "@/features/admin/ui/admin-ui";
import { getAnalyticsSummary } from "@/features/analytics/application/queries";
import {
  buildDashboardMonthlySeries,
  parseDashboardChartRange,
  rangeForDashboardChartRange,
  rangeForDashboardMetricPeriod,
} from "@/features/analytics/domain/dashboard-periods";
import { formatPeriodDelta } from "@/features/analytics/domain/date-range";
import { getAdminDashboardMetrics } from "@/features/orders/application/queries";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AdminPageProps = {
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

function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
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

export default async function AdminPage({
  params,
  searchParams,
}: AdminPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const chart = parseDashboardChartRange(firstParam(raw.chart));
  const chartRange = rangeForDashboardChartRange(chart);
  const monthRange = rangeForDashboardMetricPeriod("month");

  const copy = getDictionary(locale).admin.dashboard;
  const [
    metrics,
    chartSummary,
    todaySummary,
    weekSummary,
    monthSummary,
    quarterSummary,
  ] = await Promise.all([
    getAdminDashboardMetrics(monthRange),
    getAnalyticsSummary({ ...chartRange, locale }),
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

  const trendPoints = buildDashboardMonthlySeries(
    chartSummary.dailyRows,
    chartRange,
  );

  const snapshots: DashboardPeriodSnapshot[] = [
    toPeriodSnapshot("today", todaySummary),
    toPeriodSnapshot("week", weekSummary),
    toPeriodSnapshot("month", monthSummary),
    toPeriodSnapshot("quarter", quarterSummary),
  ];

  return (
    <section>
      <div className="mb-3">
        <AdminPageTitle lead={copy.welcomeLead} accent={copy.welcomeAccent} />
      </div>

      <DashboardStatsGrid
        locale={locale}
        users={metrics.users}
        products={metrics.products}
        labels={copy}
      />

      <DashboardPeriodOverview
        locale={locale}
        snapshots={snapshots}
        labels={copy}
      />

      <Suspense fallback={null}>
        <DashboardTrendChart
          locale={locale}
          chart={chart}
          points={trendPoints}
        />
      </Suspense>

      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <DashboardRecentOrders
          locale={locale}
          orders={metrics.recentOrders.slice(0, 5).map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            contactEmail: order.contactEmail,
            totalAmount: order.totalAmount,
          }))}
        />

        <div className={`${ADMIN_CARD_CLASS} p-4`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {copy.topProducts}
            </h2>
            <Link
              href={`/${locale}/admin/products`}
              className="rounded-[12px] px-2 py-1 text-xs font-medium text-brand-red hover:bg-brand-red/5"
            >
              {copy.viewAll}
            </Link>
          </div>
          <div className="space-y-2">
            {metrics.topProducts.map((product, index) => (
              <div
                key={product.productId}
                className={`flex items-center gap-3 rounded-[12px] px-2.5 py-2 ring-1 ring-gray-100/80 ${ADMIN_CARD_HOVER_CLASS}`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow/25 text-[11px] font-bold text-brand-ink">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {product.title}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {fillTemplate(copy.soldCount, {
                      quantity: String(product.quantity),
                    })}
                  </p>
                </div>
              </div>
            ))}
            {metrics.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-600">
                {copy.noProductSales}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <DashboardQuickActions locale={locale} labels={copy} />
    </section>
  );
}
