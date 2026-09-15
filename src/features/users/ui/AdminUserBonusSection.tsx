"use client";

import { Coins } from "lucide-react";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { Card } from "@/components/ui/Card";
import type { CustomerBonusLedgerRow } from "@/features/loyalty/application/queries";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import { useAdminOrderDrawer } from "@/features/orders/ui/useAdminOrderDrawer";
import { formatAppDateTimeMinutes } from "@/lib/datetime/app-timezone";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";

type AdminUserBonusSectionProps = {
  locale: string;
  balanceAmount: number;
  totalEarnedAmount: number;
  totalSpentAmount: number;
  ledger: CustomerBonusLedgerRow[];
};

function entryLabel(
  entryType: CustomerBonusLedgerRow["entryType"],
  copy: {
    entryEarn: string;
    entrySpend: string;
    entrySpendReversal: string;
    entryEarnReversal: string;
  },
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

function formatBonusAmount(amount: number, locale: Locale): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return `${safe.toLocaleString(locale === "en" ? "en-US" : "ru-RU")} ֏`;
}

/**
 * Loyalty wallet summary + ledger on the admin user detail page.
 */
export function AdminUserBonusSection({
  locale,
  balanceAmount,
  totalEarnedAmount,
  totalSpentAmount,
  ledger,
}: AdminUserBonusSectionProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.users.detail;
  const drawer = useAdminOrderDrawer(locale);
  const moneyLocale: Locale = isLocale(locale) ? locale : "en";

  const stats = [
    { label: copy.bonusBalance, value: formatBonusAmount(balanceAmount, moneyLocale) },
    {
      label: copy.bonusTotalEarned,
      value: formatBonusAmount(totalEarnedAmount, moneyLocale),
    },
    {
      label: copy.bonusTotalSpent,
      value: formatBonusAmount(totalSpentAmount, moneyLocale),
    },
  ] as const;

  return (
    <>
      <Card className={`mb-4 p-5 sm:p-6 ${ADMIN_CARD_CLASS}`}>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red">
            <Coins className="size-5" aria-hidden />
          </span>
          <h2 className={`${ADMIN_SECTION_TITLE} uppercase tracking-wide`}>
            {copy.bonusesTitle}
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[14px] bg-[#FFF4D4] px-4 py-4"
            >
              <p className="text-[11px] font-semibold tracking-wide text-brand-ink/70 uppercase sm:text-xs">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-brand-ink sm:text-[1.65rem]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          {ledger.length === 0 ? (
            <p className="text-sm text-gray-600">{copy.noBonusHistory}</p>
          ) : (
            <ul className="space-y-3">
              {ledger.map((row) => {
                const credit = isCredit(row.entryType);
                return (
                  <li
                    key={row.id}
                    className="rounded-[14px] border border-gray-200 bg-white px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold tracking-wide text-brand-ink uppercase">
                          {entryLabel(row.entryType, copy)}
                        </p>
                        <p
                          className={`mt-1 text-sm font-semibold tabular-nums ${
                            credit ? "text-brand-red" : "text-brand-ink"
                          }`}
                        >
                          {credit ? "+" : "−"}
                          {formatBonusAmount(row.amount, moneyLocale)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-gray-400 sm:text-sm">
                        {row.orderNumber ? (
                          <button
                            type="button"
                            onClick={() => drawer.openOrder(row.orderNumber!)}
                            className="block text-gray-400 transition hover:text-brand-red hover:underline"
                            aria-label={formatAdminMessage(
                              dictionary.orders.list.openOrder,
                              { orderNumber: row.orderNumber },
                            )}
                          >
                            {formatAdminMessage(copy.bonusOrderLabel, {
                              orderNumber: row.orderNumber,
                            })}
                          </button>
                        ) : (
                          <p>{copy.bonusNoOrder}</p>
                        )}
                        <p className="mt-1">
                          {formatAppDateTimeMinutes(new Date(row.createdAt))}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <OrderDetailsDrawer
        open={drawer.open}
        onClose={drawer.closeDrawer}
        detail={drawer.detail}
        error={drawer.error}
        isLoading={drawer.isLoading}
        adminControls={{
          locale,
          onStatusUpdated: drawer.refreshOpenOrder,
        }}
      />
    </>
  );
}
