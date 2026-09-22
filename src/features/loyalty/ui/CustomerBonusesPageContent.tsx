import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";

import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";
import { AppLink } from "@/components/ui/AppLink";
import type {
  CustomerBonusLedgerRow,
  CustomerBonusSummary,
} from "@/features/loyalty/application/queries";
import { ProfilePageTitle } from "@/features/profile/ui/ProfilePageTitle";
import { ProfileStatCard } from "@/features/profile/ui/ProfileStatCard";
import {
  PROFILE_CARD_CLASS,
  PROFILE_ICON_TONE,
  PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS,
  PROFILE_PRIMARY_BUTTON_CLASS,
} from "@/features/profile/ui/profile-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { formatMoneyAmount } from "@/lib/money/format";

type CustomerBonusesPageContentProps = {
  locale: Locale;
  summary: CustomerBonusSummary;
  rows: CustomerBonusLedgerRow[];
  copy: Dictionary["profile"]["bonuses"];
  startShoppingLabel: string;
  /** Hide page title when shown inside the mobile profile sheet. */
  hideTitle?: boolean;
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

const LEDGER_CREDIT_COLOR = "#16a34a";
const LEDGER_DEBIT_COLOR = "#db0b20";

function formatCoinsAmount(amount: number, locale: Locale): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return safe.toLocaleString(locale === "en" ? "en-US" : "ru-RU");
}

export function CustomerBonusesPageContent({
  locale,
  summary,
  rows,
  copy,
  startShoppingLabel,
  hideTitle = false,
}: CustomerBonusesPageContentProps) {
  function money(amount: number): string {
    return formatMoneyAmount(amount, "AMD", locale);
  }

  const balance = formatCoinsAmount(summary.balanceAmount, locale);
  const earned = formatCoinsAmount(summary.totalEarnedAmount, locale);
  const spent = formatCoinsAmount(summary.totalSpentAmount, locale);

  return (
    <div className="space-y-6 lg:space-y-8">
      {!hideTitle ? (
        <div>
          <ProfilePageTitle>{copy.title}</ProfilePageTitle>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3 lg:gap-4">
        <ProfileStatCard
          label={copy.balance}
          value={balance}
          iconPlain
          icon={<HeaderCoinsIcon className="size-11 sm:size-14" />}
        />
        <ProfileStatCard
          label={copy.totalEarned}
          value={earned}
          icon={<ArrowUpRight aria-hidden />}
          iconTone={{ background: "#16a34a", foreground: "#ffffff" }}
        />
        <ProfileStatCard
          label={copy.totalSpent}
          value={spent}
          icon={<ArrowDownLeft aria-hidden />}
          iconTone={{ background: "#db0b20", foreground: "#ffffff" }}
        />
      </div>

      <p className="text-sm leading-relaxed text-gray-600">
        {summary.loyalty.earnMinOrderAmount != null
          ? copy.ratesHintWithMin.replace(
              "{min}",
              money(summary.loyalty.earnMinOrderAmount),
            )
          : copy.ratesHint}
      </p>

      <section
        className={`p-5 sm:p-7 ${PROFILE_CARD_CLASS} ${PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS}`}
      >
        <ProfilePageTitle as="h2" size="section">
          {copy.historyTitle}
        </ProfilePageTitle>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-12">
            <div
              className="flex size-14 items-center justify-center rounded-full"
              style={{
                backgroundColor: PROFILE_ICON_TONE.background,
                color: PROFILE_ICON_TONE.foreground,
              }}
            >
              <Coins className="size-6" aria-hidden />
            </div>
            <div className="max-w-sm text-center">
              <p className="text-sm font-medium text-gray-800">{copy.empty}</p>
              <p className="mt-1 text-sm text-gray-500">{copy.emptyHint}</p>
            </div>
            <AppLink
              href={`/${locale}/products`}
              prefetchPolicy="intent"
              className={PROFILE_PRIMARY_BUTTON_CLASS}
            >
              {startShoppingLabel}
            </AppLink>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-dashed divide-gray-200">
            {rows.map((row) => {
              const credit = isCredit(row.entryType);
              return (
                <li
                  key={row.id}
                  className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: PROFILE_ICON_TONE.background,
                        color: PROFILE_ICON_TONE.foreground,
                      }}
                    >
                      {credit ? (
                        <ArrowUpRight className="size-5" aria-hidden />
                      ) : (
                        <ArrowDownLeft className="size-5" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {entryLabel(row.entryType, copy)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                        {new Date(row.createdAt).toLocaleString(locale)}
                        {row.orderNumber
                          ? ` · ${copy.orderLabel} ${row.orderNumber}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <p
                    className="shrink-0 text-sm font-bold tabular-nums sm:text-base"
                    style={{
                      color: credit ? LEDGER_CREDIT_COLOR : LEDGER_DEBIT_COLOR,
                    }}
                  >
                    {`${credit ? "+" : "−"}${formatCoinsAmount(row.amount, locale)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
