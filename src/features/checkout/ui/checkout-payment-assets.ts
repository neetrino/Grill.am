import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import {
  CHECKOUT_CARD_BADGES,
  FOOTER_PAYMENT_ASSETS,
} from "@/lib/payment-assets";

export { CHECKOUT_CARD_BADGES, FOOTER_PAYMENT_ASSETS };

export function checkoutPaymentIconKind(
  methodId: CheckoutPaymentMethod,
): "cash" | "idram" | "cards" {
  if (methodId === "cash_on_delivery") return "cash";
  if (methodId === "idram") return "idram";
  return "cards";
}
