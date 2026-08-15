import type {
  CartDrawerItemView,
  CartDrawerView,
} from "@/features/cart/get-cart-drawer-view";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { formatMoneyAmount } from "@/lib/money/format";

function recomputeItemCount(items: CartDrawerItemView[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function safeMoneyInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

/**
 * Derives item line totals and cart summary from integer minor-unit prices.
 * Server-only adjustments (coupons, etc.) stay on `adjustmentsAmount`.
 */
export function recalculateLocalCartView(
  current: CartDrawerView,
): CartDrawerView {
  const { locale, currency } = current;
  const adjustmentsAmount = safeMoneyInteger(current.adjustmentsAmount ?? 0);

  const items = current.items.map((item) => {
    const unitPriceAmount = safeMoneyInteger(item.unitPriceAmount ?? 0);
    const lineTotalAmount = unitPriceAmount * item.quantity;
    return {
      ...item,
      unitPriceAmount,
      lineTotalAmount,
      unitPriceFormatted: formatMoneyAmount(
        unitPriceAmount,
        currency,
        locale,
      ),
      lineTotalFormatted: formatMoneyAmount(
        lineTotalAmount,
        currency,
        locale,
      ),
    };
  });

  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.lineTotalAmount,
    0,
  );
  const totalAmount = Math.max(0, subtotalAmount + adjustmentsAmount);
  const shippingAmount = safeMoneyInteger(current.shippingAmount ?? 0);

  return {
    ...current,
    locale,
    currency,
    items,
    itemCount: recomputeItemCount(items),
    subtotalAmount,
    totalAmount,
    adjustmentsAmount,
    shippingAmount,
    subtotalFormatted: formatMoneyAmount(subtotalAmount, currency, locale),
    shippingFormatted:
      current.shippingFormatted ||
      formatMoneyAmount(shippingAmount, currency, locale),
    totalFormatted: formatMoneyAmount(totalAmount, currency, locale),
  };
}

export function emptyCartDrawerView(
  locale: Locale,
  currency: Currency,
): CartDrawerView {
  return recalculateLocalCartView({
    locale,
    currency,
    itemCount: 0,
    items: [],
    subtotalAmount: 0,
    totalAmount: 0,
    adjustmentsAmount: 0,
    shippingAmount: 0,
    subtotalFormatted: formatMoneyAmount(0, currency, locale),
    shippingFormatted: formatMoneyAmount(0, currency, locale),
    totalFormatted: formatMoneyAmount(0, currency, locale),
  });
}
