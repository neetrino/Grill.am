"use client";

import { Truck, UserRound, type LucideIcon } from "lucide-react";

import { CheckoutPickupBranchList } from "@/features/checkout/ui/CheckoutPickupBranchList";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import {
  CHECKOUT_FIELD_CLASS,
  CHECKOUT_OPTION_BASE_CLASS,
  CHECKOUT_OPTION_DEFAULT_CLASS,
  CHECKOUT_OPTION_SELECTED_CLASS,
  CHECKOUT_RADIO_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import type { StorePickupOption } from "@/features/stores/yandex-map-embed";

type CheckoutFulfillmentLabels = {
  shippingMethod: string;
  storePickup: string;
  storePickupDescription: string;
  delivery: string;
  deliveryDescription: string;
  pickupBranch: string;
  selectPickupBranch: string;
  deliveryLocation: string;
  selectLocation: string;
  address: string;
  addressPlaceholder: string;
};

type CheckoutFulfillmentSectionProps = {
  labels: CheckoutFulfillmentLabels;
  pending: boolean;
  shippingMethod: "pickup" | "delivery";
  onShippingMethodChange: (method: "pickup" | "delivery") => void;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
  pickupStores: StorePickupOption[];
  pickupStoreId: string;
  onPickupStoreChange: (storeId: string) => void;
  defaultLine1: string;
};

function methodOptionClass(selected: boolean): string {
  return `${CHECKOUT_OPTION_BASE_CLASS} ${
    selected ? CHECKOUT_OPTION_SELECTED_CLASS : CHECKOUT_OPTION_DEFAULT_CLASS
  }`;
}

function ShippingMethodToggles({
  labels,
  pending,
  shippingMethod,
  deliveryDisabled,
  onShippingMethodChange,
}: {
  labels: CheckoutFulfillmentLabels;
  pending: boolean;
  shippingMethod: "pickup" | "delivery";
  deliveryDisabled: boolean;
  onShippingMethodChange: (method: "pickup" | "delivery") => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labels.shippingMethod}
      className="flex flex-col gap-3"
    >
      <MethodToggle
        selected={shippingMethod === "pickup"}
        value="pickup"
        disabled={pending}
        icon={UserRound}
        title={labels.storePickup}
        description={labels.storePickupDescription}
        onSelect={() => onShippingMethodChange("pickup")}
      />
      <MethodToggle
        selected={shippingMethod === "delivery"}
        value="delivery"
        disabled={pending || deliveryDisabled}
        icon={Truck}
        title={labels.delivery}
        description={labels.deliveryDescription}
        onSelect={() => onShippingMethodChange("delivery")}
      />
    </div>
  );
}

function MethodToggle({
  selected,
  value,
  disabled,
  icon: Icon,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  value: "pickup" | "delivery";
  disabled: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <label className={methodOptionClass(selected)}>
      <input
        type="radio"
        name="shippingMethod"
        value={value}
        checked={selected}
        onChange={onSelect}
        className={`mr-3 ${CHECKOUT_RADIO_CLASS}`}
        disabled={disabled}
        suppressHydrationWarning
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-medium text-gray-900">
          <Icon
            className={`size-5 shrink-0 ${
              selected ? "text-brand-red" : "text-gray-500"
            }`}
            aria-hidden
          />
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-gray-600">
          {description}
        </span>
      </span>
    </label>
  );
}

export function CheckoutFulfillmentSection({
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
  defaultLine1,
}: CheckoutFulfillmentSectionProps) {
  return (
    <section className={CHECKOUT_SECTION_CARD_CLASS}>
      <h2 className={`${CHECKOUT_SECTION_TITLE_CLASS} mb-6`}>
        {labels.shippingMethod}
      </h2>
      <ShippingMethodToggles
        labels={labels}
        pending={pending}
        shippingMethod={shippingMethod}
        deliveryDisabled={deliveryOptions.length === 0}
        onShippingMethodChange={onShippingMethodChange}
      />
      {shippingMethod === "pickup" ? (
        <CheckoutPickupBranchList
          labels={labels}
          pending={pending}
          pickupStores={pickupStores}
          pickupStoreId={pickupStoreId}
          onPickupStoreChange={onPickupStoreChange}
        />
      ) : (
        <DeliveryAddressFields
          labels={labels}
          pending={pending}
          deliveryOptions={deliveryOptions}
          deliveryRuleId={deliveryRuleId}
          onDeliveryRuleChange={onDeliveryRuleChange}
          defaultLine1={defaultLine1}
        />
      )}
    </section>
  );
}

function DeliveryAddressFields({
  labels,
  pending,
  deliveryOptions,
  deliveryRuleId,
  onDeliveryRuleChange,
  defaultLine1,
}: {
  labels: CheckoutFulfillmentLabels;
  pending: boolean;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
  defaultLine1: string;
}) {
  return (
    <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end">
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
  );
}
