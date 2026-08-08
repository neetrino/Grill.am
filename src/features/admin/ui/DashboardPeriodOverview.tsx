import Link from "next/link";

import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import {
  DASHBOARD_METRIC_PERIODS,
  type DashboardMetricPeriod,
} from "@/features/analytics/domain/dashboard-periods";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

export type DashboardPeriodSnapshot = {
  period: DashboardMetricPeriod;
  orderCount: number;
  revenueAmount: number;
  averageOrderValue: number;
  revenueDelta: string;
  orderDelta: string;
};

type DashboardPeriodOverviewProps = {
  locale: string;
  snapshots: DashboardPeriodSnapshot[];
  labels: AdminDictionary["dashboard"];
};

function periodTitle(
  period: DashboardMetricPeriod,
  labels: AdminDictionary["dashboard"],
): string {
  switch (period) {
    case "today":
      return labels.periodToday;
    case "week":
      return labels.periodWeek;
    case "month":
      return labels.periodMonth;
    case "quarter":
      return labels.periodQuarter;
  }
}

function deltaClass(delta: string): string {
  if (delta.startsWith("+") && delta !== "+0.0%") {
    return "text-emerald-600";
  }
  if (delta.startsWith("-")) {
    return "text-brand-red";
  }
  return "text-gray-500";
}

export function DashboardPeriodOverview({
  locale,
  snapshots,
  labels,
}: DashboardPeriodOverviewProps) {
  const byPeriod = new Map(
    snapshots.map((snapshot) => [snapshot.period, snapshot]),
  );

  return (
    <div className="mb-3">
      <div className="mb-2 flex items-end justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {labels.periodsTitle}
        </h2>
        <Link
          href={`/${locale}/admin/analytics`}
          className="text-xs font-medium text-brand-red hover:underline"
        >
          {labels.viewAnalytics}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {DASHBOARD_METRIC_PERIODS.map((period) => {
          const snapshot = byPeriod.get(period);
          if (!snapshot) {
            return null;
          }

          return (
            <div
              key={period}
              className={`${ADMIN_CARD_CLASS} px-3.5 py-3`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {periodTitle(period, labels)}
                </p>
                <span
                  className={`text-[11px] font-semibold ${deltaClass(snapshot.revenueDelta)}`}
                >
                  {snapshot.revenueDelta}
                </span>
              </div>

              <p className="text-xl font-bold leading-none text-gray-900">
                {formatMoneyAmount(snapshot.revenueAmount, "AMD", locale)}
              </p>
              <p className="mt-1 text-xs text-gray-500">{labels.chartRevenue}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {snapshot.orderCount}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {labels.chartOrders}
                  </p>
                  <p
                    className={`mt-0.5 text-[11px] font-medium ${deltaClass(snapshot.orderDelta)}`}
                  >
                    {snapshot.orderDelta}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMoneyAmount(
                      snapshot.averageOrderValue,
                      "AMD",
                      locale,
                    )}
                  </p>
                  <p className="text-[11px] text-gray-500">{labels.aov}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
