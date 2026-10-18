/** Client-side checkout field keys used for highlight + scroll-into-view. */
export type CheckoutInvalidField =
  | "firstName"
  | "lastName"
  | "contactPhone"
  | "contactEmail"
  | "shipping"
  | "pickup"
  | "address"
  | "payment"
  | "minimum";

/** Focus targets (inputs / interactive blocks). */
export const CHECKOUT_FIELD_ELEMENT_IDS: Record<CheckoutInvalidField, string> =
  {
    firstName: "checkout-field-firstName",
    lastName: "checkout-field-lastName",
    contactPhone: "checkout-field-contactPhone",
    contactEmail: "checkout-field-contactEmail",
    shipping: "checkout-field-shipping",
    pickup: "checkout-field-pickup",
    address: "checkout-field-address",
    payment: "checkout-field-payment",
    minimum: "checkout-field-minimum",
  };

/** Scroll targets — section titles for validation feedback. */
export const CHECKOUT_SCROLL_TARGET_IDS: Record<CheckoutInvalidField, string> = {
  firstName: "checkout-title-contact",
  lastName: "checkout-title-contact",
  contactPhone: "checkout-title-contact",
  contactEmail: "checkout-title-contact",
  shipping: "checkout-title-shipping",
  pickup: "checkout-title-shipping",
  address: "checkout-title-shipping",
  payment: "checkout-title-payment",
  minimum: "checkout-field-minimum",
};

export function scrollToCheckoutField(field: CheckoutInvalidField): void {
  const scrollEl = document.getElementById(CHECKOUT_SCROLL_TARGET_IDS[field]);
  if (scrollEl) {
    scrollEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const focusEl = document.getElementById(CHECKOUT_FIELD_ELEMENT_IDS[field]);
  if (!focusEl) {
    return;
  }
  if (
    focusEl instanceof HTMLInputElement ||
    focusEl instanceof HTMLTextAreaElement ||
    focusEl instanceof HTMLSelectElement ||
    focusEl instanceof HTMLButtonElement
  ) {
    focusEl.focus({ preventScroll: true });
    return;
  }
  const focusable = focusEl.querySelector<HTMLElement>(
    "input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])",
  );
  focusable?.focus({ preventScroll: true });
}

export function isCheckoutEmailValid(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
