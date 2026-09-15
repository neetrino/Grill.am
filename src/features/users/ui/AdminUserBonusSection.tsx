"use client";

import { Gift } from "lucide-react";

import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminSectionCard } from "@/features/admin/ui/AdminSectionCard";
import type { CustomerBonusLedgerRow } from "@/features/loyalty/application/queries";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import { useAdminOrderDrawer } from "@/features/orders/ui/useAdminOrderDrawer";
import { formatMoneyAmount } from "@/lib/money/format";
import type { Locale } from "@/lib/i18n/config";
import { isLocale } from "@/lib/i18n/config";
import {
  formatAppDateTimeMinutes,
} from "@/lib/datetime/app-timezone";

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

/**
 * Loyalty wallet summary + ledger on the admin user detail page.
 * Earn rows link to the shared order drawer when an order number exists.
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

  function money(amount: number): string {
    return formatMoneyAmount(amount, "AMD", moneyLocale);
  }

  const earnRows = ledger.filter((row) => row.entryType === "EARN");

  return (
    <>
      <AdminSectionCard
        className="mb-4"
        icon={<Gift className="h-5 w-5" />}
        title={copy.bonusesTitle}
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[15px] border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {copy.bonusBalance}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
              {money(balanceAmount)}
            </p>
          </div>
          <div className="rounded-[15px] border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {copy.bonusTotalEarned}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-700">
              {money(totalEarnedAmount)}
            </p>
          </div>
          <div className="rounded-[15px] border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              {copy.bonusTotalSpent}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
              {money(totalSpentAmount)}
            </p>
          </div>
        </div>

        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          {copy.bonusFromOrders}
        </h3>
        {earnRows.length === 0 ? (
          <p className="mb-5 text-sm text-gray-600">{copy.noBonusFromOrders}</p>
        ) : (
          <ul className="mb-5 divide-y divide-gray-100 overflow-hidden rounded-[15px] border border-gray-200">
            {earnRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  {row.orderNumber ? (
                    <button
                      type="button"
                      onClick={() => drawer.openOrder(row.orderNumber!)}
                      className="text-sm font-medium text-brand-red hover:underline"
                      aria-label={formatAdminMessage(
                        dictionary.orders.list.openOrder,
                        { orderNumber: row.orderNumber },
                      )}
                    >
                      {row.orderNumber}
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-gray-800">
                      {copy.bonusNoOrder}
                    </span>
                  )}
                  <p className="text-xs text-gray-500">
                    {formatAppDateTimeMinutes(new Date(row.createdAt))}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-emerald-700">
                  +{money(row.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          {copy.bonusHistory}
        </h3>
        {ledger.length === 0 ? (
          <p className="text-sm text-gray-600">{copy.noBonusHistory}</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-[15px] border border-gray-200">
            {ledger.map((row) => (
              <li
                key={`full-${row.id}`}
                className="flex items-start justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {entryLabel(row.entryType, copy)}
                    {row.orderNumber ? (
                      <>
                        {" · "}
                        <button
                          type="button"
                          onClick={() => drawer.openOrder(row.orderNumber!)}
                          className="text-brand-red hover:underline"
                        >
                          {row.orderNumber}
                        </button>
                      </>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatAppDateTimeMinutes(new Date(row.createdAt))}
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
      </AdminSectionCard>

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
