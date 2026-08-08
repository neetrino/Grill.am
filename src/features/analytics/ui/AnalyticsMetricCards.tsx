"use client";

import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { periodDeltaToneClass } from "@/features/analytics/domain/date-range";

type AnalyticsMetricCardsProps = {
  orderCount: number;
  revenueLabel: string;
  averageOrderValueLabel: string;
  userCount: number;
  orderDelta: string;
  revenueDelta: string;
  aovDelta: string;
};

function MetricCell({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: string;
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
    <div className={`rounded-[12px] px-3 py-2.5 ring-1 ${toneClass}`}>
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 break-words text-lg font-bold leading-snug text-gray-900">
        {value}
      </p>
      {delta ? (
        <p
          className={`mt-0.5 text-[11px] font-semibold ${periodDeltaToneClass(delta)}`}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

export function AnalyticsMetricCards({
  orderCount,
  revenueLabel,
  averageOrderValueLabel,
  userCount,
  orderDelta,
  revenueDelta,
  aovDelta,
}: AnalyticsMetricCardsProps) {
  const metrics = useAdminDictionary().analytics.metrics;
  const dashboard = useAdminDictionary().dashboard;

  return (
    <div className="mb-3">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {metrics.rangeTitle}
      </h2>
      <div className={`grid grid-cols-2 gap-2 lg:grid-cols-4 ${ADMIN_CARD_CLASS} p-3`}>
        <MetricCell
          label={dashboard.chartRevenue}
          value={revenueLabel}
          delta={revenueDelta}
          tone="red"
        />
        <MetricCell
          label={dashboard.chartOrders}
          value={String(orderCount)}
          delta={orderDelta}
          tone="yellow"
        />
        <MetricCell
          label={dashboard.aov}
          value={averageOrderValueLabel}
          delta={aovDelta}
          tone="ink"
        />
        <MetricCell
          label={metrics.totalUsers}
          value={String(userCount)}
          tone="surface"
        />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">{metrics.vsPreviousHint}</p>
    </div>
  );
}
