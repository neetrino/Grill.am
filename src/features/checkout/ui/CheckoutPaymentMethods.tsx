"use client";

import type { ReactNode } from "react";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import { CheckoutPaymentMethodIcons } from "@/features/checkout/ui/CheckoutPaymentMethodIcons";
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
  return (
    <section className={CHECKOUT_SECTION_CARD_CLASS}>
      <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>{title}</h2>
      <div className="space-y-3">
        {options.map((option) => {
          const selected = value === option.id;
          const isCardMethod = option.id === "arca";

          return (
            <div key={option.id}>
              <label className={optionClass(selected)}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={selected}
                  onChange={() => onChange(option.id)}
                  className="mr-3 accent-brand-red self-center"
                  disabled={disabled}
                  suppressHydrationWarning
                />

                {isCardMethod ? (
                  <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-1.5">
                    <span className="font-medium text-gray-900">
                      {option.name}
                    </span>
                    <CheckoutPaymentMethodIcons methodId={option.id} />
                  </div>
                ) : option.id === "idram" ? (
                  <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-1.5">
                    <span className="font-medium text-gray-900">
                      {option.name}
                    </span>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex shrink-0 items-center">
                        <CheckoutPaymentMethodIcons methodId={option.id} />
                      </div>
                      {option.description ? (
                        <div className="min-w-0 text-sm text-gray-600">
                          {option.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
                    <div className="flex shrink-0 items-center">
                      <CheckoutPaymentMethodIcons methodId={option.id} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900 lg:hidden">
                        {option.name}
                      </span>
                      <div className="hidden lg:block">
                        <div className="font-medium text-gray-900">
                          {option.name}
                        </div>
                        {option.description ? (
                          <div className="text-sm text-gray-600">
                            {option.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
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
