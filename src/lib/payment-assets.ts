/** Shared footer payment badge assets (SiteFooter + checkout). */
export const FOOTER_PAYMENT_ASSETS = {
  idram: "/assets/payments/footer-idram.webp",
  mastercard: "/assets/payments/footer-mastercard.webp",
  arca: "/assets/payments/footer-arca.webp",
  visa: "/assets/payments/footer-visa.webp",
  telcell: "/assets/payments/footer-telcell.webp",
} as const;

export type CheckoutCardBadge = {
  alt: string;
  src: string;
};

/** Card-rail badges for ArCa / bank-card payment option. */
export const CHECKOUT_CARD_BADGES: readonly CheckoutCardBadge[] = [
  { alt: "Visa", src: FOOTER_PAYMENT_ASSETS.visa },
  { alt: "Mastercard", src: FOOTER_PAYMENT_ASSETS.mastercard },
  { alt: "ArCa", src: FOOTER_PAYMENT_ASSETS.arca },
  { alt: "Telcell", src: FOOTER_PAYMENT_ASSETS.telcell },
] as const;
