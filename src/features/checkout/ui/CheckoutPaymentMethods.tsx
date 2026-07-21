"use client";

import { useState } from "react";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";

const RADIO_SELECTED = "border-gray-900 bg-gray-50";
const RADIO_IDLE = "border-gray-300 hover:bg-gray-50";

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
};

export function CheckoutPaymentMethods({
  title,
  options,
  value,
  onChange,
  disabled,
}: CheckoutPaymentMethodsProps) {
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-6">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3">
        {options.map((option) => {
          const selected = value === option.id;
          const showFallback = !option.logoSrc || logoErrors[option.id];

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
                selected ? RADIO_SELECTED : RADIO_IDLE
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="mr-4"
                disabled={disabled}
              />
              <div className="flex flex-1 items-center gap-4">
                <div className="relative flex h-12 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
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
                        setLogoErrors((prev) => ({ ...prev, [option.id]: true }))
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
          );
        })}
      </div>
    </section>
  );
}
