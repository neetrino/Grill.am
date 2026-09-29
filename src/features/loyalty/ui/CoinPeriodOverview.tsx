import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HOVER_CLASS,
} from "@/features/admin/ui/admin-ui";
import { DASHBOARD_METRIC_PERIODS } from "@/features/analytics/domain/dashboard-periods";
import { periodDeltaToneClass } from "@/features/analytics/domain/date-range";
import type { CoinAnalyticsPeriodSnapshot } from "@/features/loyalty/application/coin-analytics-queries";
import { formatCoinAmount } from "@/features/loyalty/domain/coin-analytics";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

type CoinPeriodOverviewProps = {
  locale: string;
  snapshots: CoinAnalyticsPeriodSnapshot[];
  labels: AdminDictionary["coinAnalytics"]["periods"];
};

function periodTitle(
  period: CoinAnalyticsPeriodSnapshot["period"],
  labels: AdminDictionary["coinAnalytics"]["periods"],
): string {
  switch (period) {
    case "today":
      return labels.today;
    case "week":
      return labels.week;
    case "month":
      return labels.month;
    case "quarter":
      return labels.quarter;
  }
}

export function CoinPeriodOverview({
  locale,
  snapshots,
  labels,
}: CoinPeriodOverviewProps) {
  const resolvedLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  const byPeriod = new Map(
    snapshots.map((snapshot) => [snapshot.period, snapshot]),
  );

  return (
    <div className="mb-3">
      <div className="mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          {labels.title}
        </h2>
        <p className="mt-1 text-xs text-gray-500">{labels.hint}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_METRIC_PERIODS.map((period) => {
          const snapshot = byPeriod.get(period);
          if (!snapshot) {
            return null;
          }

          return (
            <div
              key={period}
              className={`${ADMIN_CARD_CLASS} ${ADMIN_CARD_HOVER_CLASS} p-3.5`}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {periodTitle(period, labels)}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[12px] bg-brand-red/10 px-2.5 py-2 ring-1 ring-brand-red/15">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    {labels.spent}
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-none text-gray-900">
                    {formatCoinAmount(snapshot.netSpent, resolvedLocale)}
                  </p>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${periodDeltaToneClass(snapshot.spentDelta)}`}
                  >
                    {snapshot.spentDelta}
                  </p>
                </div>
                <div className="rounded-[12px] bg-brand-yellow/20 px-2.5 py-2 ring-1 ring-brand-yellow/35">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    {labels.earned}
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-none text-gray-900">
                    {formatCoinAmount(snapshot.netEarned, resolvedLocale)}
                  </p>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${periodDeltaToneClass(snapshot.earnedDelta)}`}
                  >
                    {snapshot.earnedDelta}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
