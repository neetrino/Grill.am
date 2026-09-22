"use client";

import { HeaderCoinsIcon } from "@/components/layout/HeaderCoinsIcon";
import {
  CHECKOUT_ALERT_CLASS,
  CHECKOUT_ORDER_SUMMARY_WRAP_CLASS,
  CHECKOUT_PRIMARY_BUTTON_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import {
  CheckoutGrillCoinProgress,
  type CheckoutGrillCoinProgressCopy,
} from "@/features/checkout/ui/CheckoutGrillCoinProgress";

type CheckoutGrillCoinProgressView = {
  productsHref: string;
  targetFormatted: string;
  progressRatio: number;
  copy: CheckoutGrillCoinProgressCopy;
};

type CheckoutOrderSummaryProps = {
  title: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApplyLabel: string;
  couponApplyingLabel: string;
  discountLabel: string;
  bonusTitle: string;
  bonusAvailableFormatted: string | null;
  bonusMaxButtonLabel: string;
  bonusAppliedLabel: string;
  bonusLoginRequired: string | null;
  grillCoinLabel: string | null;
  grillCoinAmountFormatted: string | null;
  grillCoinProgress: CheckoutGrillCoinProgressView | null;
  useBonus: boolean;
  canUseBonus: boolean;
  bonusDraft: string;
  onUseBonusChange: (next: boolean) => void;
  onBonusDraftChange: (value: string) => void;
  onBonusMaxClick: () => void;
  bonusFormatted: string | null;
  subtotalLabel: string;
  shippingLabel: string;
  taxLabel: string;
  totalLabel: string;
  subtotalFormatted: string;
  shippingFormatted: string;
  taxFormatted: string | null;
  discountFormatted: string | null;
  totalFormatted: string;
  couponDraft: string;
  onCouponDraftChange: (value: string) => void;
  onApplyCoupon: () => void;
  couponError: string | null;
  isApplyingCoupon: boolean;
  error: string | null;
  isSubmitting: boolean;
  canPlaceOrder: boolean;
  placeOrderLabel: string;
  processingLabel: string;
};

export function CheckoutOrderSummary({
  title,
  couponTitle,
  couponPlaceholder,
  couponApplyLabel,
  couponApplyingLabel,
  discountLabel,
  bonusTitle,
  bonusAvailableFormatted,
  bonusMaxButtonLabel,
  bonusAppliedLabel,
  bonusLoginRequired,
  grillCoinLabel,
  grillCoinAmountFormatted,
  grillCoinProgress,
  useBonus,
  canUseBonus,
  bonusDraft,
  onUseBonusChange,
  onBonusDraftChange,
  onBonusMaxClick,
  bonusFormatted,
  subtotalLabel,
  shippingLabel,
  taxLabel,
  totalLabel,
  subtotalFormatted,
  shippingFormatted,
  taxFormatted,
  discountFormatted,
  totalFormatted,
  couponDraft,
  onCouponDraftChange,
  onApplyCoupon,
  couponError,
  isApplyingCoupon,
  error,
  isSubmitting,
  canPlaceOrder,
  placeOrderLabel,
  processingLabel,
}: CheckoutOrderSummaryProps) {
  return (
    <div className={CHECKOUT_ORDER_SUMMARY_WRAP_CLASS}>
      <section
        className={`${CHECKOUT_SECTION_CARD_CLASS} w-full`}
        aria-labelledby="checkout-order-summary-heading"
      >
        <h2
          id="checkout-order-summary-heading"
          className={CHECKOUT_SECTION_TITLE_CLASS}
        >
          {title}
        </h2>

        <div className="mt-5 rounded-[15px] border border-gray-200 p-4 lg:p-3.5">
          {/* Mobile: title + apply on top, input below */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-700">{couponTitle}</p>
              <button
                type="button"
                disabled={
                  isSubmitting || isApplyingCoupon || !couponDraft.trim()
                }
                onClick={onApplyCoupon}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-[15px] border border-gray-300 bg-white px-3 text-sm font-semibold whitespace-nowrap text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isApplyingCoupon ? couponApplyingLabel : couponApplyLabel}
              </button>
            </div>
            <input
              type="text"
              name="couponCodeDraft"
              value={couponDraft}
              onChange={(event) => onCouponDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onApplyCoupon();
                }
              }}
              placeholder={couponPlaceholder}
              autoComplete="off"
              disabled={isSubmitting || isApplyingCoupon}
              className="mt-3 h-11 w-full rounded-[15px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50"
              suppressHydrationWarning
            />
          </div>

          {/* Desktop: input + apply in one row */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <input
              type="text"
              name="couponCodeDraftDesktop"
              value={couponDraft}
              onChange={(event) => onCouponDraftChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onApplyCoupon();
                }
              }}
              placeholder={couponTitle}
              aria-label={couponTitle}
              autoComplete="off"
              disabled={isSubmitting || isApplyingCoupon}
              className="h-10 min-w-0 flex-1 rounded-[15px] border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50"
              suppressHydrationWarning
            />
            <button
              type="button"
              disabled={
                isSubmitting || isApplyingCoupon || !couponDraft.trim()
              }
              onClick={onApplyCoupon}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-[15px] border border-gray-300 bg-gray-100 px-3 text-sm font-semibold whitespace-nowrap text-gray-800 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isApplyingCoupon ? couponApplyingLabel : couponApplyLabel}
            </button>
          </div>

          {couponError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {couponError}
            </p>
          ) : null}
        </div>

        <div className="mt-4 rounded-[15px] border border-gray-200 bg-gray-50 p-4">
          {bonusLoginRequired ? (
            <p className="text-sm text-gray-500">{bonusLoginRequired}</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={useBonus}
                    disabled={isSubmitting || !canUseBonus}
                    onChange={(event) => onUseBonusChange(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red/30 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {bonusTitle}
                  </span>
                </label>
                {bonusAvailableFormatted ? (
                  <span className="shrink-0 text-sm text-gray-600">
                    {bonusAvailableFormatted}
                  </span>
                ) : null}
              </div>

              {useBonus ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    name="bonusSpendDraft"
                    value={bonusDraft}
                    onChange={(event) =>
                      onBonusDraftChange(event.target.value)
                    }
                    disabled={isSubmitting || !canUseBonus}
                    className="h-11 min-w-0 flex-1 rounded-[15px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-100"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    disabled={isSubmitting || !canUseBonus}
                    onClick={onBonusMaxClick}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-[15px] border border-gray-300 bg-white px-4 text-sm font-semibold whitespace-nowrap text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bonusMaxButtonLabel}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-5 space-y-3 text-sm text-gray-600">
          <div className="flex justify-between gap-3">
            <span>{subtotalLabel}</span>
            <span className="font-medium text-gray-900">{subtotalFormatted}</span>
          </div>
          {discountFormatted ? (
            <div className="flex justify-between gap-3">
              <span>{discountLabel}</span>
              <span className="font-medium text-emerald-700">
                -{discountFormatted}
              </span>
            </div>
          ) : null}
          {bonusFormatted ? (
            <div className="flex justify-between gap-3">
              <span>{bonusAppliedLabel}</span>
              <span className="font-medium text-emerald-700">
                -{bonusFormatted}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <span className="shrink-0">{shippingLabel}</span>
            <span className="min-w-0 text-right font-medium text-gray-900">
              {shippingFormatted}
            </span>
          </div>
          {taxFormatted ? (
            <div className="flex justify-between gap-3">
              <span>{taxLabel}</span>
              <span className="font-medium text-gray-900">{taxFormatted}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 border-t border-dashed border-gray-300 pt-4">
          <div className="flex justify-between gap-3 text-base font-bold text-gray-900 sm:text-lg">
            <span>{totalLabel}</span>
            <span>{totalFormatted}</span>
          </div>
          {grillCoinLabel && grillCoinAmountFormatted ? (
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-1.5 font-bold text-gray-900">
                <HeaderCoinsIcon className="size-5 shrink-0" />
                <span>{grillCoinLabel}</span>
              </span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {grillCoinAmountFormatted}
              </span>
            </div>
          ) : null}
        </div>

        {grillCoinProgress ? (
          <div className="mt-3">
            <CheckoutGrillCoinProgress {...grillCoinProgress} />
          </div>
        ) : null}

        {error ? (
          <div
            className={`mt-4 border border-red-200 bg-red-50 p-3 ${CHECKOUT_ALERT_CLASS}`}
          >
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          className={`${CHECKOUT_PRIMARY_BUTTON_CLASS} mt-6`}
          disabled={isSubmitting || !canPlaceOrder}
        >
          {isSubmitting ? processingLabel : placeOrderLabel}
        </button>
      </section>
    </div>
  );
}
