"use client";

import { type ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import type { CheckoutPaymentMethod } from "@/features/checkout/domain/payment-methods";
import { CheckoutPaymentMethods } from "@/features/checkout/ui/CheckoutPaymentMethods";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";

const FIELD_CLASS =
  "h-11 w-full rounded-lg border border-gray-200 px-3 text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50";

const RADIO_SELECTED = "border-gray-900 bg-gray-50";
const RADIO_IDLE = "border-gray-300 hover:bg-gray-50";

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
  logoSrc: string | null;
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
    <div className="space-y-6 lg:col-span-2">
      <Card className="rounded-2xl border border-gray-200/80 p-6 shadow-none">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {labels.contactInformation}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.firstName}
              <input
                name="firstName"
                required
                defaultValue={defaultFirstName}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="given-name"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.lastName}
              <input
                name="lastName"
                required
                defaultValue={defaultLastName}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="family-name"
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
                className={FIELD_CLASS}
                autoComplete="email"
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
                className={FIELD_CLASS}
                autoComplete="tel"
              />
            </label>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl border border-gray-200/80 p-6 shadow-none">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">
          {labels.shippingMethod}
        </h2>
        <div className="space-y-3">
          <label
            className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
              shippingMethod === "pickup" ? RADIO_SELECTED : RADIO_IDLE
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value="pickup"
              checked={shippingMethod === "pickup"}
              onChange={() => onShippingMethodChange("pickup")}
              className="mr-4"
              disabled={pending}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{labels.storePickup}</div>
              <div className="text-sm text-gray-600">
                {labels.storePickupDescription}
              </div>
            </div>
          </label>
          <label
            className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-all ${
              shippingMethod === "delivery" ? RADIO_SELECTED : RADIO_IDLE
            }`}
          >
            <input
              type="radio"
              name="shippingMethod"
              value="delivery"
              checked={shippingMethod === "delivery"}
              onChange={() => onShippingMethodChange("delivery")}
              className="mr-4"
              disabled={pending || deliveryOptions.length === 0}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{labels.delivery}</div>
              <div className="text-sm text-gray-600">
                {labels.deliveryDescription}
              </div>
            </div>
          </label>
        </div>
      </Card>

      {shippingMethod === "delivery" ? (
        <Card className="rounded-2xl border border-gray-200/80 p-6 shadow-none">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            {labels.shippingAddress}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.deliveryLocation}
              <select
                name="deliveryRuleId"
                required
                value={deliveryRuleId}
                onChange={(event) => onDeliveryRuleChange(event.target.value)}
                disabled={pending || deliveryOptions.length === 0}
                className={FIELD_CLASS}
              >
                <option value="">{labels.selectLocation}</option>
                {deliveryOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.address}
              <input
                name="line1"
                required
                defaultValue={defaultLine1}
                placeholder={labels.addressPlaceholder}
                disabled={pending}
                className={FIELD_CLASS}
                autoComplete="street-address"
              />
            </label>
          </div>
        </Card>
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
