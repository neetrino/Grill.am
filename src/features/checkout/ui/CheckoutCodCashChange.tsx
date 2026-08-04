"use client";

import Image from "next/image";

import type { CodCashDenomination } from "@/features/checkout/domain/cod-cash-change";
import { eligibleCodCashDenominations } from "@/features/checkout/domain/cod-cash-change";

/** Local `public/` paths — not on R2 yet; do not wrap with `staticAssetUrl`. */
const NOTE_IMAGE_BY_AMOUNT: Record<CodCashDenomination, string> = {
  1_000: "/assets/checkout/note-1000.webp",
  5_000: "/assets/checkout/note-5000.webp",
  10_000: "/assets/checkout/note-10000.webp",
  20_000: "/assets/checkout/note-20000.webp",
  50_000: "/assets/checkout/note-50000.webp",
  100_000: "/assets/checkout/note-100000.webp",
};

/** Nudge large notes left so the portrait sits better in the crop. */
const NOTE_IMAGE_OBJECT_POSITION: Partial<
  Record<CodCashDenomination, string>
> = {
  50_000: "object-[28%_center]",
  100_000: "object-[28%_center]",
};


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
 * so the courier can prepare change (Degusto-style note grid).
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
  const exactSelected = value === null;

  return (
    <div
      className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6"
      role="group"
      aria-labelledby="cod-cash-change-title"
    >
      <h3
        id="cod-cash-change-title"
        className="text-base font-black uppercase tracking-tight text-gray-900 sm:text-lg"
      >
        {title}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
        {description}
      </p>

      {denominations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">{noEligibleLabel}</p>
      ) : null}

      <div
        className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label={title}
      >
        <button
          type="button"
          role="radio"
          aria-checked={exactSelected}
          disabled={disabled}
          onClick={() => onChange(null)}
          className={`block w-full rounded-[18px] border-2 p-0 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:opacity-60 ${
            exactSelected
              ? "border-brand-red bg-brand-red/10"
              : "border-gray-200 bg-white hover:border-brand-red/40"
          }`}
        >
          <span
            className="flex items-center justify-center whitespace-nowrap px-2 text-center text-xs font-semibold text-gray-900 sm:px-3 sm:text-sm"
            style={{ aspectRatio: "2 / 1" }}
          >
            {exactLabel}
          </span>
        </button>

        {denominations.map((amount) => {
          const selected = value === amount;
          return (
            <button
              key={amount}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(amount)}
              className={`block w-full rounded-[18px] border-2 bg-transparent p-0 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:opacity-60 ${
                selected
                  ? "border-brand-red"
                  : "border-gray-200 hover:border-brand-red/40"
              }`}
            >
              <span
                className="relative block overflow-hidden rounded-[16px] leading-[0]"
                style={{ aspectRatio: "2 / 1" }}
              >
                <Image
                  src={NOTE_IMAGE_BY_AMOUNT[amount]}
                  alt={formatMoney(amount)}
                  fill
                  sizes="(max-width: 640px) 45vw, 200px"
                  className={`object-cover ${
                    NOTE_IMAGE_OBJECT_POSITION[amount] ?? "object-center"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>

      {value != null && changeAmount > 0 ? (
        <p className="mt-3 text-sm text-gray-700">
          {changeHintLabel.replace("{amount}", formatMoney(changeAmount))}
        </p>
      ) : null}
    </div>
  );
}
