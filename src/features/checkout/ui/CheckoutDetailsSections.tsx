"use client";

import { type ReactNode } from "react";

import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import { CUSTOMER_NOTE_MAX_LENGTH } from "@/features/checkout/domain/customer-note";
import { CheckoutFulfillmentSection } from "@/features/checkout/ui/CheckoutFulfillmentSection";
import { CheckoutPaymentMethods } from "@/features/checkout/ui/CheckoutPaymentMethods";
import {
  CHECKOUT_FIELD_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import type { StorePickupOption } from "@/features/stores/yandex-map-embed";

type CheckoutDetailsLabels = {
  contactInformation: string;
  shippingMethod: string;
  shippingAddress: string;
  paymentMethod: string;
  orderComment: string;
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
  orderCommentPlaceholder: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
  pickupBranch: string;
  selectPickupBranch: string;
};

type PaymentOption = {
  id: CheckoutPaymentMethod;
  name: string;
  description: string;
  enabled: boolean;
  unavailableLabel?: string;
};

type CheckoutDetailsSectionsProps = {
  labels: CheckoutDetailsLabels;
  pending: boolean;
  shippingMethod: "pickup" | "delivery" | null;
  onShippingMethodChange: (method: "pickup" | "delivery") => void;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
  pickupStores: StorePickupOption[];
  pickupStoreId: string;
  onPickupStoreChange: (storeId: string) => void;
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

export function CheckoutDetailsSections({
  labels,
  pending,
  shippingMethod,
  onShippingMethodChange,
  deliveryOptions,
  deliveryRuleId,
  onDeliveryRuleChange,
  pickupStores,
  pickupStoreId,
  onPickupStoreChange,
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

      <CheckoutFulfillmentSection
        labels={labels}
        pending={pending}
        shippingMethod={shippingMethod}
        onShippingMethodChange={onShippingMethodChange}
        deliveryOptions={deliveryOptions}
        deliveryRuleId={deliveryRuleId}
        onDeliveryRuleChange={onDeliveryRuleChange}
        pickupStores={pickupStores}
        pickupStoreId={pickupStoreId}
        onPickupStoreChange={onPickupStoreChange}
        defaultLine1={defaultLine1}
      />

      <CheckoutPaymentMethods
        title={labels.paymentMethod}
        options={paymentOptions}
        value={paymentMethod}
        onChange={onPaymentMethodChange}
        disabled={pending}
        cashOnDeliveryExtra={cashOnDeliveryExtra}
      />

      <section className={CHECKOUT_SECTION_CARD_CLASS}>
        <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>
          {labels.orderComment}
        </h2>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          <span className="sr-only">{labels.orderComment}</span>
          <textarea
            name="customerNote"
            rows={4}
            maxLength={CUSTOMER_NOTE_MAX_LENGTH}
            placeholder={labels.orderCommentPlaceholder}
            disabled={pending}
            className={`${CHECKOUT_FIELD_CLASS} min-h-[96px] resize-y`}
            autoComplete="off"
            suppressHydrationWarning
          />
        </label>
      </section>
    </div>
  );
}
