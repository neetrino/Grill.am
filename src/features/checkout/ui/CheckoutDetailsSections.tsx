"use client";

import { type ReactNode } from "react";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import { CheckoutPaymentMethods } from "@/features/checkout/ui/CheckoutPaymentMethods";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import {
  CHECKOUT_FIELD_CLASS,
  CHECKOUT_OPTION_BASE_CLASS,
  CHECKOUT_OPTION_DEFAULT_CLASS,
  CHECKOUT_OPTION_SELECTED_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";

type CheckoutDetailsLabels = {
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  deliveryLocation: string;
  selectLocation: string;
  phonePlaceholder: string;
  cityPlaceholder: string;
  addressPlaceholder: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
};

type PaymentOption = {
  id: CheckoutPaymentMethod;
  name: string;
  description: string;
};

type CheckoutDetailsSectionsProps = {
  labels: CheckoutDetailsLabels;
  pending: boolean;
  shippingMethod: "pickup" | "delivery";
  onShippingMethodChange: (method: "pickup" | "delivery") => void;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
  paymentMethod: CheckoutPaymentMethod;
  onPaymentMethodChange: (method: CheckoutPaymentMethod) => void;
  paymentOptions: PaymentOption[];
  cashOnDeliveryExtra?: ReactNode;
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
  defaultLine1: string;
};

function optionClass(selected: boolean): string {
  return `${CHECKOUT_OPTION_BASE_CLASS} ${
    selected ? CHECKOUT_OPTION_SELECTED_CLASS : CHECKOUT_OPTION_DEFAULT_CLASS
  }`;
}

export function CheckoutDetailsSections({
  labels,
  pending,
  shippingMethod,
  onShippingMethodChange,
  deliveryOptions,
  deliveryRuleId,
  onDeliveryRuleChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentOptions,
  cashOnDeliveryExtra,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
  defaultLine1,
}: CheckoutDetailsSectionsProps) {
  return (
    <div className="flex flex-col gap-4">
      <section className={CHECKOUT_SECTION_CARD_CLASS}>
        <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>
          {labels.contactInformation}
        </h2>
        <div
          className="space-y-4"
          key={`${defaultFirstName}|${defaultLastName}|${defaultEmail}|${defaultPhone}`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.firstName}
              <input
                name="firstName"
                required
                defaultValue={defaultFirstName}
                disabled={pending}
                className={CHECKOUT_FIELD_CLASS}
                autoComplete="given-name"
                suppressHydrationWarning
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.lastName}
              <input
                name="lastName"
                required
                defaultValue={defaultLastName}
                disabled={pending}
                className={CHECKOUT_FIELD_CLASS}
                autoComplete="family-name"
                suppressHydrationWarning
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.email}
              <input
                name="contactEmail"
                type="email"
                required
                defaultValue={defaultEmail}
                disabled={pending}
                className={CHECKOUT_FIELD_CLASS}
                autoComplete="email"
                suppressHydrationWarning
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.phone}
              <input
                name="contactPhone"
                type="tel"
                required
                defaultValue={defaultPhone}
                placeholder={labels.phonePlaceholder}
                disabled={pending}
                className={CHECKOUT_FIELD_CLASS}
                autoComplete="tel"
                suppressHydrationWarning
              />
            </label>
          </div>
        </div>
      </section>

      <section className={CHECKOUT_SECTION_CARD_CLASS}>
        <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>
          {labels.shippingMethod}
        </h2>
        <div className="space-y-3">
          <label className={optionClass(shippingMethod === "pickup")}>
            <input
              type="radio"
              name="shippingMethod"
              value="pickup"
              checked={shippingMethod === "pickup"}
              onChange={() => onShippingMethodChange("pickup")}
              className="mr-4 accent-brand-red"
              disabled={pending}
              suppressHydrationWarning
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{labels.storePickup}</div>
              <div className="text-sm text-gray-600">
                {labels.storePickupDescription}
              </div>
            </div>
          </label>
          <label className={optionClass(shippingMethod === "delivery")}>
            <input
              type="radio"
              name="shippingMethod"
              value="delivery"
              checked={shippingMethod === "delivery"}
              onChange={() => onShippingMethodChange("delivery")}
              className="mr-4 accent-brand-red"
              disabled={pending || deliveryOptions.length === 0}
              suppressHydrationWarning
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{labels.delivery}</div>
              <div className="text-sm text-gray-600">
                {labels.deliveryDescription}
              </div>
            </div>
          </label>
        </div>
      </section>

      {shippingMethod === "delivery" ? (
        <section className={CHECKOUT_SECTION_CARD_CLASS}>
          <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>
            {labels.shippingAddress}
          </h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full shrink-0 md:w-[150px]">
              <CheckoutSelect
                label={labels.deliveryLocation}
                name="deliveryRuleId"
                required
                value={deliveryRuleId}
                onChange={onDeliveryRuleChange}
                disabled={pending || deliveryOptions.length === 0}
                placeholder={labels.selectLocation}
                options={deliveryOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                className="w-full"
              />
            </div>
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.address}
              <input
                name="line1"
                required
                defaultValue={defaultLine1}
                placeholder={labels.addressPlaceholder}
                disabled={pending}
                className={CHECKOUT_FIELD_CLASS}
                autoComplete="street-address"
                suppressHydrationWarning
              />
            </label>
          </div>
        </section>
      ) : null}

      <CheckoutPaymentMethods
        title={labels.paymentMethod}
        options={paymentOptions}
        value={paymentMethod}
        onChange={onPaymentMethodChange}
        disabled={pending}
        cashOnDeliveryExtra={cashOnDeliveryExtra}
      />
    </div>
  );
}
