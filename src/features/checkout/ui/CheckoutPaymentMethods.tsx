"use client";

import { useState, type ReactNode } from "react";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import {
  CHECKOUT_OPTION_BASE_CLASS,
  CHECKOUT_OPTION_DEFAULT_CLASS,
  CHECKOUT_OPTION_SELECTED_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";

type PaymentOption = {
  id: CheckoutPaymentMethod;
  name: string;
  description: string;
  logoSrc: string | null;
};

type CheckoutPaymentMethodsProps = {
  title: string;
  options: PaymentOption[];
  value: CheckoutPaymentMethod;
  onChange: (method: CheckoutPaymentMethod) => void;
  disabled: boolean;
  cashOnDeliveryExtra?: ReactNode;
};

function optionClass(selected: boolean): string {
  return `${CHECKOUT_OPTION_BASE_CLASS} ${
    selected ? CHECKOUT_OPTION_SELECTED_CLASS : CHECKOUT_OPTION_DEFAULT_CLASS
  }`;
}

export function CheckoutPaymentMethods({
  title,
  options,
  value,
  onChange,
  disabled,
  cashOnDeliveryExtra,
}: CheckoutPaymentMethodsProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  return (
    <section className={CHECKOUT_SECTION_CARD_CLASS}>
      <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>{title}</h2>
      <div className="space-y-3">
        {options.map((option) => {
          const selected = value === option.id;
          const showFallback = !option.logoSrc || logoErrors[option.id];

          return (
            <div key={option.id}>
              <label className={optionClass(selected)}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={selected}
                  onChange={() => onChange(option.id)}
                  className="mr-4 accent-brand-red"
                  disabled={disabled}
                />
                <div className="flex flex-1 items-center gap-4">
                  <div className="relative flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-gray-200 bg-white">
                    {showFallback ? (
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    ) : (
                      <img
                        src={option.logoSrc ?? ""}
                        alt={option.name}
                        className="h-full w-full object-contain p-1.5"
                        loading="lazy"
                        onError={() =>
                          setLogoErrors((prev) => ({
                            ...prev,
                            [option.id]: true,
                          }))
                        }
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-600">
                      {option.description}
                    </div>
                  </div>
                </div>
              </label>
              {option.id === "cash_on_delivery" &&
              selected &&
              cashOnDeliveryExtra
                ? cashOnDeliveryExtra
                : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
