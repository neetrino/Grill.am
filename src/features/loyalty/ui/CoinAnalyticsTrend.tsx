"use client";

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
import type { DashboardTrendPoint } from "@/features/analytics/domain/dashboard-periods";
import type { CoinTrendPoint } from "@/features/loyalty/domain/coin-analytics";
import { formatCoinAmount } from "@/features/loyalty/domain/coin-analytics";
import type { Locale } from "@/lib/i18n/config";

type CoinAnalyticsTrendProps = {
  locale: Locale;
  points: CoinTrendPoint[];
  aggregatedMonthly: boolean;
};

function toDashboardPoints(points: CoinTrendPoint[]): DashboardTrendPoint[] {
  return points.map((point) => ({
    key: point.key,
    label: point.label,
    // Reuse the dual-series chart: primary = spent, secondary = earned.
    revenueAmount: point.netSpent,
    orderCount: point.netEarned,
  }));
}

function pickPeakSpend(points: CoinTrendPoint[]): CoinTrendPoint | null {
  if (points.length === 0) {
    return null;
  }
  return points.reduce((best, point) =>
    point.netSpent > best.netSpent ? point : best,
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

export function CoinAnalyticsTrend({
  locale,
  points,
  aggregatedMonthly,
}: CoinAnalyticsTrendProps) {
  const copy = useAdminDictionary().coinAnalytics.trend;
  const metrics = useAdminDictionary().coinAnalytics.metrics;

  const totalSpent = points.reduce((sum, point) => sum + point.netSpent, 0);
  const totalEarned = points.reduce((sum, point) => sum + point.netEarned, 0);
  const peak = pickPeakSpend(points);
  const isEmpty = points.every(
    (point) => point.netSpent === 0 && point.netEarned === 0,
  );
  const peakLabel = aggregatedMonthly ? copy.peakMonth : copy.peakDay;

  return (
    <div className={`mb-3 ${ADMIN_CARD_CLASS} p-4`}>
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
          <TrendingUp className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
          <p className="text-xs text-gray-500">{copy.subtitle}</p>
        </div>
      </div>

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-gray-500">{copy.empty}</p>
      ) : (
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-stretch">
          <div className="order-2 flex min-w-0 flex-col items-center justify-center rounded-[12px] bg-gradient-to-b from-brand-surface/70 to-white p-3 ring-1 ring-gray-100/80 lg:order-1">
            <DashboardTrendSvg
              points={toDashboardPoints(points)}
              chartAria={copy.chartAria}
              locale={locale}
              tooltip={{
                revenueLabel: metrics.spent,
                ordersLabel: metrics.earned,
                formatRevenue: (amount) => formatCoinAmount(amount, locale),
                formatOrders: (count) => formatCoinAmount(count, locale),
              }}
            />
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DASHBOARD_REVENUE_COLOR }}
                />
                {metrics.spent}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DASHBOARD_ORDERS_COLOR }}
                />
                {metrics.earned}
              </span>
            </div>
          </div>

          <div className="order-1 flex flex-col gap-2 lg:order-2">
            <StackStat
              label={metrics.spent}
              value={formatCoinAmount(totalSpent, locale)}
              tone="red"
            />
            <StackStat
              label={metrics.earned}
              value={formatCoinAmount(totalEarned, locale)}
              tone="yellow"
            />
            <StackStat
              label={peakLabel}
              value={
                peak && peak.netSpent > 0 ? peak.label : copy.emptyShort
              }
              hint={
                peak && peak.netSpent > 0
                  ? formatCoinAmount(peak.netSpent, locale)
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
