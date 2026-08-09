"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TrendingUp } from "lucide-react";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
} from "@/features/admin/ui/admin-ui";
import {
  DASHBOARD_ORDERS_COLOR,
  DASHBOARD_REVENUE_COLOR,
  DashboardTrendSvg,
} from "@/features/admin/ui/DashboardTrendSvg";
import {
  DASHBOARD_CHART_RANGES,
  type DashboardChartRange,
  type DashboardTrendPoint,
} from "@/features/analytics/domain/dashboard-periods";
import { formatMoneyAmount } from "@/lib/money/format";

type DashboardTrendChartProps = {
  locale: string;
  chart: DashboardChartRange;
  points: DashboardTrendPoint[];
};

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  nextChart: DashboardChartRange,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("period");
  params.set("chart", nextChart);
  return `${pathname}?${params.toString()}`;
}

function pickBestMonth(
  points: DashboardTrendPoint[],
): DashboardTrendPoint | null {
  if (points.length === 0) {
    return null;
  }
  return points.reduce((best, point) =>
    point.revenueAmount > best.revenueAmount ? point : best,
  );
}

function StackStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "red" | "yellow" | "ink" | "surface";
}) {
  const toneClass =
    tone === "red"
      ? "bg-brand-red/10 ring-brand-red/15"
      : tone === "yellow"
        ? "bg-brand-yellow/20 ring-brand-yellow/35"
        : tone === "ink"
          ? "bg-brand-ink/5 ring-gray-200"
          : "bg-brand-surface ring-gray-100";

  return (
    <div
      className={`rounded-[12px] px-3.5 py-3 ring-1 ${toneClass} ${ADMIN_CARD_HOVER_CLASS}`}
    >
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="mt-1 break-words text-base font-bold leading-snug text-gray-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 break-words text-[11px] leading-snug text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardTrendChart({
  locale,
  chart,
  points,
}: DashboardTrendChartProps) {
  const copy = useAdminDictionary().dashboard;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalRevenue = points.reduce(
    (sum, point) => sum + point.revenueAmount,
    0,
  );
  const totalOrders = points.reduce((sum, point) => sum + point.orderCount, 0);
  const averageOrderValue =
    totalOrders > 0
      ? Math.round((totalRevenue / totalOrders) * 100) / 100
      : 0;
  const bestMonth = pickBestMonth(points);

  const rangeLabels: Record<DashboardChartRange, string> = {
    months_6: copy.chartRange6Months,
    year: copy.chartRangeYear,
  };

  const isEmpty = points.every(
    (point) => point.orderCount === 0 && point.revenueAmount === 0,
  );

  return (
    <div className={`mb-3 ${ADMIN_CARD_CLASS} p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">
              {copy.chartTitle}
            </h2>
            <p className="text-xs text-gray-500">{copy.chartSubtitle}</p>
          </div>
        </div>

        <div
          className="relative inline-grid grid-cols-2 rounded-[12px] bg-brand-surface p-0.5"
          role="tablist"
          aria-label={copy.chartRangeLabel}
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-[10px] bg-white shadow-sm ring-1 ring-gray-100 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
              chart === "year" ? "translate-x-full" : ""
            }`}
          />
          {DASHBOARD_CHART_RANGES.map((option) => {
            const active = option === chart;
            return (
              <Link
                key={option}
                href={buildHref(pathname, searchParams, option)}
                role="tab"
                aria-selected={active}
                className={`relative z-[1] rounded-[10px] px-2.5 py-1 text-center text-xs font-semibold transition-colors duration-300 ${
                  active
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {rangeLabels[option]}
              </Link>
            );
          })}
        </div>
      </div>

      {isEmpty ? (
        <p className="py-10 text-center text-sm text-gray-500">
          {copy.chartEmpty}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0 rounded-[12px] bg-gradient-to-b from-brand-surface/70 to-white p-2 ring-1 ring-gray-100/80">
            <DashboardTrendSvg points={points} chartAria={copy.chartAria} />
            <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DASHBOARD_REVENUE_COLOR }}
                />
                {copy.chartRevenue}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DASHBOARD_ORDERS_COLOR }}
                />
                {copy.chartOrders}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <StackStat
              label={copy.chartRevenue}
              value={formatMoneyAmount(totalRevenue, "AMD", locale)}
              tone="red"
            />
            <StackStat
              label={copy.chartOrders}
              value={String(totalOrders)}
              tone="yellow"
            />
            <StackStat
              label={copy.aov}
              value={formatMoneyAmount(averageOrderValue, "AMD", locale)}
              tone="ink"
            />
            <StackStat
              label={copy.chartBestMonth}
              value={
                bestMonth && bestMonth.revenueAmount > 0
                  ? bestMonth.label
                  : copy.chartEmptyShort
              }
              hint={
                bestMonth && bestMonth.revenueAmount > 0
                  ? formatMoneyAmount(bestMonth.revenueAmount, "AMD", locale)
                  : undefined
              }
              tone="surface"
            />
          </div>
        </div>
      )}
    </div>
  );
}
