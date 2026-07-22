"use client";

import type { CodCashDenomination } from "@/features/checkout/domain/cod-cash-change";
import { eligibleCodCashDenominations } from "@/features/checkout/domain/cod-cash-change";

const CHIP_SELECTED =
  "border-gray-900 bg-gray-900 text-white";
const CHIP_IDLE =
  "border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50";

type CheckoutCodCashChangeProps = {
  title: string;
  description: string;
  exactLabel: string;
  changeHintLabel: string;
  noEligibleLabel: string;
  orderTotalAmount: number;
  formatMoney: (amount: number) => string;
  value: CodCashDenomination | null;
  onChange: (amount: CodCashDenomination | null) => void;
  disabled: boolean;
};

/**
 * COD-only control: customer picks the banknote they will pay with
 * so the courier can prepare change.
 */
export function CheckoutCodCashChange({
  title,
  description,
  exactLabel,
  changeHintLabel,
  noEligibleLabel,
  orderTotalAmount,
  formatMoney,
  value,
  onChange,
  disabled,
}: CheckoutCodCashChangeProps) {
  const denominations = eligibleCodCashDenominations(orderTotalAmount);
  const changeAmount =
    value != null && value >= orderTotalAmount
      ? value - orderTotalAmount
      : 0;

  return (
    <div
      className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4"
      role="group"
      aria-labelledby="cod-cash-change-title"
    >
      <h3
        id="cod-cash-change-title"
        className="text-sm font-semibold text-gray-900"
      >
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>

      {denominations.length === 0 ? (
        <p className="mt-3 text-sm text-gray-600">{noEligibleLabel}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={value === null}
            onClick={() => onChange(null)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              value === null ? CHIP_SELECTED : CHIP_IDLE
            }`}
          >
            {exactLabel}
          </button>
          {denominations.map((amount) => {
            const selected = value === amount;
            return (
              <button
                key={amount}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onChange(amount)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors disabled:opacity-60 ${
                  selected ? CHIP_SELECTED : CHIP_IDLE
                }`}
              >
                {formatMoney(amount)}
              </button>
            );
          })}
        </div>
      )}

      {value != null && changeAmount > 0 ? (
        <p className="mt-3 text-sm text-gray-700">
          {changeHintLabel.replace("{amount}", formatMoney(changeAmount))}
        </p>
      ) : null}
    </div>
  );
}
