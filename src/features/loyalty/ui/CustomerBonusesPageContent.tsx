import { formatMoneyAmount } from "@/lib/money/format";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type {
  CustomerBonusLedgerRow,
  CustomerBonusSummary,
} from "@/features/loyalty/application/queries";
import {
  PROFILE_CARD_CLASS,
  PROFILE_CARD_RADIUS_CLASS,
} from "@/features/profile/ui/profile-ui";

type CustomerBonusesPageContentProps = {
  locale: Locale;
  summary: CustomerBonusSummary;
  rows: CustomerBonusLedgerRow[];
  copy: Dictionary["profile"]["bonuses"];
};

function entryLabel(
  entryType: CustomerBonusLedgerRow["entryType"],
  copy: Dictionary["profile"]["bonuses"],
): string {
  switch (entryType) {
    case "EARN":
      return copy.entryEarn;
    case "SPEND":
      return copy.entrySpend;
    case "SPEND_REVERSAL":
      return copy.entrySpendReversal;
    case "EARN_REVERSAL":
      return copy.entryEarnReversal;
  }
}

function isCredit(entryType: CustomerBonusLedgerRow["entryType"]): boolean {
  return entryType === "EARN" || entryType === "SPEND_REVERSAL";
}

export function CustomerBonusesPageContent({
  locale,
  summary,
  rows,
  copy,
}: CustomerBonusesPageContentProps) {
  function money(amount: number): string {
    return formatMoneyAmount(amount, "AMD", locale);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{copy.subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`p-4 ${PROFILE_CARD_CLASS}`}>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            {copy.balance}
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">
            {money(summary.balanceAmount)}
          </p>
        </div>
        <div className={`p-4 ${PROFILE_CARD_CLASS}`}>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            {copy.totalEarned}
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums text-emerald-700">
            {money(summary.totalEarnedAmount)}
          </p>
        </div>
        <div className={`p-4 ${PROFILE_CARD_CLASS}`}>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            {copy.totalSpent}
          </p>
          <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">
            {money(summary.totalSpentAmount)}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        {summary.loyalty.earnMinOrderAmount != null
          ? copy.ratesHintWithMin.replace(
              "{min}",
              money(summary.loyalty.earnMinOrderAmount),
            )
          : copy.ratesHint}
      </p>

      <section className={`overflow-hidden ${PROFILE_CARD_CLASS}`}>
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">
            {copy.historyTitle}
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-800">{copy.empty}</p>
            <p className="mt-1 text-sm text-gray-500">{copy.emptyHint}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`flex items-start justify-between gap-3 px-4 py-3 ${PROFILE_CARD_RADIUS_CLASS}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {entryLabel(row.entryType, copy)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(row.createdAt).toLocaleString(locale)}
                    {row.orderNumber
                      ? ` · ${copy.orderLabel} ${row.orderNumber}`
                      : ""}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    isCredit(row.entryType)
                      ? "text-emerald-700"
                      : "text-gray-900"
                  }`}
                >
                  {isCredit(row.entryType) ? "+" : "−"}
                  {money(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
