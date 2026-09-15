"use client";

import { Truck, UserRound, type LucideIcon } from "lucide-react";
import { useState } from "react";

import {
  CheckoutAddressList,
  type CheckoutAddressChoice,
  type CheckoutAddressDrawerLabels,
} from "@/features/checkout/ui/CheckoutAddressDrawer";
import { CheckoutPickupBranchList } from "@/features/checkout/ui/CheckoutPickupBranchList";
import {
  CHECKOUT_OPTION_BASE_CLASS,
  CHECKOUT_OPTION_DEFAULT_CLASS,
  CHECKOUT_OPTION_SELECTED_CLASS,
  CHECKOUT_RADIO_CLASS,
  CHECKOUT_SECTION_CARD_CLASS,
  CHECKOUT_SECTION_TITLE_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import {
  normalizeCheckoutDeliveryCity,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";
import type { StorePickupOption } from "@/features/stores/yandex-map-embed";
import type { Locale } from "@/lib/i18n/config";

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
  selectAddress: string;
  addressBook: CheckoutAddressDrawerLabels;
};

type CheckoutShippingMethod = "pickup" | "delivery";

type CheckoutFulfillmentSectionProps = {
  locale: Locale;
  labels: CheckoutFulfillmentLabels;
  pending: boolean;
  shippingMethod: CheckoutShippingMethod | null;
  onShippingMethodChange: (method: CheckoutShippingMethod) => void;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
  pickupStores: StorePickupOption[];
  pickupStoreId: string;
  onPickupStoreChange: (storeId: string) => void;
  canSaveAddresses: boolean;
  savedAddresses: CustomerAddressListItem[];
  selectedAddressId: string | null;
  line1: string;
  onAddressSelect: (address: CheckoutAddressChoice) => void;
};

function methodOptionClass(selected: boolean): string {
  return `${CHECKOUT_OPTION_BASE_CLASS} ${
    selected ? CHECKOUT_OPTION_SELECTED_CLASS : CHECKOUT_OPTION_DEFAULT_CLASS
  }`;
}

function resolveRuleIdForCity(
  deliveryOptions: CheckoutDeliveryOption[],
  city: string,
): string {
  const preferred = resolveCheckoutDeliveryCity(city) ?? city.trim();
  const preferredKey = normalizeCheckoutDeliveryCity(preferred);
  return (
    deliveryOptions.find(
      (option) =>
        normalizeCheckoutDeliveryCity(option.city) === preferredKey,
    )?.id ??
    deliveryOptions[0]?.id ??
    ""
  );
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
  shippingMethod: CheckoutShippingMethod | null;
  deliveryDisabled: boolean;
  onShippingMethodChange: (method: CheckoutShippingMethod) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={labels.shippingMethod}
      className="flex flex-row gap-3"
    >
      <MethodToggle
        selected={shippingMethod === "pickup"}
        value="pickup"
        disabled={pending}
        icon={UserRound}
        title={labels.storePickup}
        description={labels.storePickupDescription}
        className="min-w-0 flex-1"
        onSelect={() => onShippingMethodChange("pickup")}
      />
      <MethodToggle
        selected={shippingMethod === "delivery"}
        value="delivery"
        disabled={pending || deliveryDisabled}
        icon={Truck}
        title={labels.delivery}
        description={labels.deliveryDescription}
        className="min-w-0 flex-1"
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
  className,
  onSelect,
}: {
  selected: boolean;
  value: CheckoutShippingMethod;
  disabled: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  onSelect: () => void;
}) {
  return (
    <label className={`${methodOptionClass(selected)} ${className ?? ""}`}>
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
  locale,
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
  canSaveAddresses,
  savedAddresses,
  selectedAddressId,
  line1,
  onAddressSelect,
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
      ) : null}
      {shippingMethod === "delivery" ? (
        <DeliveryAddressPicker
          locale={locale}
          labels={labels}
          pending={pending}
          deliveryOptions={deliveryOptions}
          deliveryRuleId={deliveryRuleId}
          onDeliveryRuleChange={onDeliveryRuleChange}
          canSaveAddresses={canSaveAddresses}
          savedAddresses={savedAddresses}
          selectedAddressId={selectedAddressId}
          line1={line1}
          onAddressSelect={onAddressSelect}
        />
      ) : null}
    </section>
  );
}

function DeliveryAddressPicker({
  locale,
  labels,
  pending,
  deliveryOptions,
  deliveryRuleId,
  onDeliveryRuleChange,
  canSaveAddresses,
  savedAddresses,
  selectedAddressId,
  line1,
  onAddressSelect,
}: {
  locale: Locale;
  labels: CheckoutFulfillmentLabels;
  pending: boolean;
  deliveryOptions: CheckoutDeliveryOption[];
  deliveryRuleId: string;
  onDeliveryRuleChange: (ruleId: string) => void;
  canSaveAddresses: boolean;
  savedAddresses: CustomerAddressListItem[];
  selectedAddressId: string | null;
  line1: string;
  onAddressSelect: (address: CheckoutAddressChoice) => void;
}) {
  const [sessionAddresses, setSessionAddresses] = useState<
    CheckoutAddressChoice[]
  >([]);
  const selectedDelivery = deliveryOptions.find(
    (option) => option.id === deliveryRuleId,
  );

  function handleSelect(address: CheckoutAddressChoice): void {
    onAddressSelect(address);
    const ruleId = resolveRuleIdForCity(deliveryOptions, address.city);
    if (ruleId) {
      onDeliveryRuleChange(ruleId);
    }
  }

  return (
    <CheckoutAddressList
      locale={locale}
      labels={labels.addressBook}
      selectAddressLabel={labels.selectAddress}
      pending={pending}
      canSaveAddresses={canSaveAddresses}
      savedAddresses={savedAddresses}
      sessionAddresses={sessionAddresses}
      onSessionAddressesChange={setSessionAddresses}
      selectedAddressId={selectedAddressId}
      selectedLine1={line1}
      selectedCityLabel={selectedDelivery?.label ?? null}
      onSelect={handleSelect}
      deliveryOptions={deliveryOptions}
      draftLine1={line1}
      draftCity={selectedDelivery?.city ?? ""}
    />
  );
}
