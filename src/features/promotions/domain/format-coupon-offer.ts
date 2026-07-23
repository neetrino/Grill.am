import type { DiscountType } from "@/features/promotions/domain/promotion-rules";
import { isCurrency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

/**
 * Formats the coupon's configured offer (e.g. "10%" or "1 000 ֏") for display.
 */
export function formatCouponOffer(
  discountType: string | null,
  discountValue: number | null,
  currency: string,
  locale: string,
): string {
  if (discountValue === null || discountValue === undefined) {
    return "—";
  }

  if (discountType === ("PERCENTAGE" satisfies DiscountType)) {
    return `${discountValue}%`;
  }

  if (discountType === ("FIXED" satisfies DiscountType) && isCurrency(currency)) {
    return formatMoneyAmount(discountValue, currency, locale);
  }

  if (discountType === ("FIXED" satisfies DiscountType)) {
    return String(discountValue);
  }

  return "—";
}

/** Formats the amount actually saved on an order. */
export function formatCouponSavings(
  amount: number,
  currency: string,
  locale: string,
): string {
  if (!isCurrency(currency)) {
    return String(amount);
  }
  return formatMoneyAmount(amount, currency, locale);
}
