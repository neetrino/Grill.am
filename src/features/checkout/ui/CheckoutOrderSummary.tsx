"use client";

import {
  CHECKOUT_ALERT_CLASS,
  CHECKOUT_ORDER_SUMMARY_WRAP_CLASS,
  CHECKOUT_PRIMARY_BUTTON_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";

type CheckoutOrderSummaryProps = {
  title: string;
  couponTitle: string;
  couponPlaceholder: string;
  couponApplyLabel: string;
  couponApplyingLabel: string;
  discountLabel: string;
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
        className={CHECKOUT_SECTION_CARD_CLASS}
        aria-labelledby="checkout-order-summary-heading"
      >
        <h2
          id="checkout-order-summary-heading"
          className={CHECKOUT_SECTION_TITLE_CLASS}
        >
          {title}
        </h2>

        <div className="mt-5 rounded-[15px] border border-gray-200 p-4">
          <p className="mb-3 text-sm text-gray-700">{couponTitle}</p>
          <div className="flex items-center gap-2">
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
              size={Math.max(couponPlaceholder.length, 8)}
              className="h-11 max-w-full rounded-[15px] border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50"
              style={{
                width: `calc(${Math.max(couponPlaceholder.length, 8)}ch + 1.5rem)`,
              }}
              suppressHydrationWarning
            />
            <button
              type="button"
              disabled={isSubmitting || isApplyingCoupon || !couponDraft.trim()}
              onClick={onApplyCoupon}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold whitespace-nowrap text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="flex justify-between gap-3">
            <span>{shippingLabel}</span>
            <span className="text-right font-medium text-gray-900">
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
        </div>

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
