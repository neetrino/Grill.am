"use client";

import Image from "next/image";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import {
  CHECKOUT_CARD_BADGES,
  FOOTER_PAYMENT_ASSETS,
  checkoutPaymentIconKind,
} from "@/features/checkout/ui/checkout-payment-assets";

type CheckoutPaymentMethodIconsProps = {
  methodId: CheckoutPaymentMethod;
};

function CashIcon({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="3"
        y="9"
        width="26"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle
        cx="16"
        cy="16"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M3 13h26" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function FramedBadge({
  src,
  alt,
  boxClassName,
}: {
  src: string;
  alt: string;
  boxClassName: string;
}) {
  return (
    <div
      className={`relative box-border flex shrink-0 items-center justify-center overflow-hidden border border-gray-200 bg-white ${boxClassName}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="72px"
        className="object-contain p-1"
      />
    </div>
  );
}

/** Payment method icons — MaMarie layout, footer payment assets. */
export function CheckoutPaymentMethodIcons({
  methodId,
}: CheckoutPaymentMethodIconsProps) {
  const kind = checkoutPaymentIconKind(methodId);

  if (kind === "cash") {
    return (
      <>
        <div className="flex shrink-0 items-center justify-center lg:hidden">
          <CashIcon className="size-[42px] text-brand-red" />
        </div>
        <div className="hidden shrink-0 items-center justify-center lg:flex">
          <CashIcon className="size-9 text-brand-red" />
        </div>
      </>
    );
  }

  if (kind === "idram") {
    return (
      <>
        <FramedBadge
          src={FOOTER_PAYMENT_ASSETS.idram}
          alt="Idram"
          boxClassName="h-10 w-24 rounded-lg lg:hidden"
        />
        <FramedBadge
          src={FOOTER_PAYMENT_ASSETS.idram}
          alt="Idram"
          boxClassName="hidden h-10 w-[112px] rounded-lg lg:flex"
        />
      </>
    );
  }

  return (
    <>
      <div className="flex max-w-full flex-wrap items-center gap-1 self-start lg:hidden">
        {CHECKOUT_CARD_BADGES.map((badge) => (
          <FramedBadge
            key={badge.alt}
            src={badge.src}
            alt={badge.alt}
            boxClassName="h-[30px] w-[52px] rounded-[5px]"
          />
        ))}
      </div>
      <div className="hidden shrink-0 flex-nowrap items-center gap-2 lg:flex">
        {CHECKOUT_CARD_BADGES.map((badge) => (
          <FramedBadge
            key={badge.alt}
            src={badge.src}
            alt={badge.alt}
            boxClassName="h-10 w-[72px] rounded-lg"
          />
        ))}
      </div>
    </>
  );
}
