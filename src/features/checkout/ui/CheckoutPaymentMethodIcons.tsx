"use client";

import Image from "next/image";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import {
  CHECKOUT_CARD_BADGES,
  CHECKOUT_CASH_ICON,
  FOOTER_PAYMENT_ASSETS,
  checkoutPaymentIconKind,
} from "@/features/checkout/ui/checkout-payment-assets";

type CheckoutPaymentMethodIconsProps = {
  methodId: CheckoutPaymentMethod;
};

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
      <Image
        src={CHECKOUT_CASH_ICON}
        alt=""
        width={48}
        height={48}
        className="size-[42px] shrink-0 object-contain lg:size-12"
        aria-hidden
      />
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
