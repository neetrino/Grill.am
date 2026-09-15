"use client";

import { Check, ChevronDown, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type KeyboardEvent } from "react";

import {
  CHECKOUT_DELIVERY_CITY_PRIMARY,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import {
  CHECKOUT_FIELD_CLASS,
  CHECKOUT_PICKUP_BRANCH_LIST_CLASS,
  CHECKOUT_PICKUP_BRANCH_ROW_CLASS,
  CHECKOUT_PICKUP_BRANCH_ROW_DEFAULT_CLASS,
  CHECKOUT_PICKUP_BRANCH_ROW_SELECTED_CLASS,
  CHECKOUT_PICKUP_TRIGGER_CLASS,
  CHECKOUT_PRIMARY_BUTTON_CLASS,
} from "@/features/checkout/ui/checkout-ui";
import type { CheckoutDeliveryOption } from "@/features/delivery/application/queries";
import { createCustomerAddressAction } from "@/features/profile/application/manage-addresses";
import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";
import { createId } from "@/lib/id";
import type { Locale } from "@/lib/i18n/config";

export type CheckoutAddressChoice = {
  id: string;
  label: string | null;
  line1: string;
  city: string;
  isDefault: boolean;
  source: "saved" | "session";
};

export type CheckoutAddressDrawerLabels = {
  title: string;
  close: string;
  addAddress: string;
  noAddresses: string;
  newBadge: string;
  defaultBadge: string;
  line1: string;
  addressPlaceholder: string;
  city: string;
  selectLocation: string;
  cancel: string;
  add: string;
  saving: string;
  loginToSave: string;
};

type CheckoutAddressListProps = {
  locale: Locale;
  labels: CheckoutAddressDrawerLabels;
  selectAddressLabel: string;
  pending: boolean;
  canSaveAddresses: boolean;
  savedAddresses: CustomerAddressListItem[];
  sessionAddresses: CheckoutAddressChoice[];
  onSessionAddressesChange: (addresses: CheckoutAddressChoice[]) => void;
  selectedAddressId: string | null;
  selectedLine1: string;
  selectedCityLabel: string | null;
  onSelect: (address: CheckoutAddressChoice) => void;
  deliveryOptions: CheckoutDeliveryOption[];
  draftLine1: string;
  draftCity: string;
};

function addressRowClass(selected: boolean): string {
  return `${CHECKOUT_PICKUP_BRANCH_ROW_CLASS} ${
    selected
      ? CHECKOUT_PICKUP_BRANCH_ROW_SELECTED_CLASS
      : CHECKOUT_PICKUP_BRANCH_ROW_DEFAULT_CLASS
  }`;
}

function cityLabelFor(
  city: string,
  deliveryOptions: CheckoutDeliveryOption[],
): string {
  const resolved = resolveCheckoutDeliveryCity(city);
  if (!resolved) {
    return city;
  }
  return (
    deliveryOptions.find(
      (option) => resolveCheckoutDeliveryCity(option.city) === resolved,
    )?.label ?? city
  );
}

function toChoice(address: CustomerAddressListItem): CheckoutAddressChoice {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    city: address.city,
    isDefault: address.isDefaultShipping,
    source: "saved",
  };
}

function sameAddress(
  left: { line1: string; city: string },
  right: { line1: string; city: string },
): boolean {
  const leftCity =
    resolveCheckoutDeliveryCity(left.city) ?? left.city.trim().toLowerCase();
  const rightCity =
    resolveCheckoutDeliveryCity(right.city) ?? right.city.trim().toLowerCase();
  return (
    left.line1.trim().toLowerCase() === right.line1.trim().toLowerCase() &&
    leftCity === rightCity
  );
}

function resolveInitialCity(deliveryOptions: CheckoutDeliveryOption[]): string {
  const first = deliveryOptions[0]?.city ?? CHECKOUT_DELIVERY_CITY_PRIMARY;
  return resolveCheckoutDeliveryCity(first) ?? CHECKOUT_DELIVERY_CITY_PRIMARY;
}

/**
 * Inline expandable address list for checkout delivery.
 * New-address fields sit above the saved/session address rows.
 */
export function CheckoutAddressList({
  locale,
  labels,
  selectAddressLabel,
  pending,
  canSaveAddresses,
  savedAddresses,
  sessionAddresses,
  onSessionAddressesChange,
  selectedAddressId,
  selectedLine1,
  selectedCityLabel,
  onSelect,
  deliveryOptions,
  draftLine1,
  draftCity,
}: CheckoutAddressListProps) {
  const hasSelection = selectedLine1.trim().length > 0;
  const [isOpen, setIsOpen] = useState(!hasSelection);
  const showList = isOpen || !hasSelection;

  function handleSelect(address: CheckoutAddressChoice): void {
    onSelect(address);
    setIsOpen(false);
  }

  return (
    <div className="mt-4">
      <p className="sr-only">{labels.title}</p>
      <input
        type="hidden"
        name="line1"
        value={selectedLine1}
        required
        suppressHydrationWarning
      />
      {hasSelection && !showList ? (
        <button
          type="button"
          className={CHECKOUT_PICKUP_TRIGGER_CLASS}
          disabled={pending}
          aria-expanded={false}
          aria-haspopup="listbox"
          aria-label={labels.title}
          onClick={() => setIsOpen(true)}
        >
          <MapPin className="size-4 shrink-0 text-brand-red" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm">
            {selectedLine1}
            {selectedCityLabel ? (
              <span className="text-gray-500"> · {selectedCityLabel}</span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Check className="size-4 text-brand-red" aria-hidden />
            <ChevronDown className="size-4 text-gray-400" aria-hidden />
          </span>
        </button>
      ) : (
        <ExpandedAddressPanel
          locale={locale}
          labels={labels}
          selectAddressLabel={selectAddressLabel}
          pending={pending}
          canSaveAddresses={canSaveAddresses}
          savedAddresses={savedAddresses}
          sessionAddresses={sessionAddresses}
          onSessionAddressesChange={onSessionAddressesChange}
          selectedAddressId={selectedAddressId}
          onSelect={handleSelect}
          onCollapse={hasSelection ? () => setIsOpen(false) : undefined}
          deliveryOptions={deliveryOptions}
          draftLine1={draftLine1}
          draftCity={draftCity}
        />
      )}
    </div>
  );
}

function ExpandedAddressPanel({
  locale,
  labels,
  selectAddressLabel,
  pending,
  canSaveAddresses,
  savedAddresses,
  sessionAddresses,
  onSessionAddressesChange,
  selectedAddressId,
  onSelect,
  onCollapse,
  deliveryOptions,
  draftLine1,
  draftCity,
}: {
  locale: Locale;
  labels: CheckoutAddressDrawerLabels;
  selectAddressLabel: string;
  pending: boolean;
  canSaveAddresses: boolean;
  savedAddresses: CustomerAddressListItem[];
  sessionAddresses: CheckoutAddressChoice[];
  onSessionAddressesChange: (addresses: CheckoutAddressChoice[]) => void;
  selectedAddressId: string | null;
  onSelect: (address: CheckoutAddressChoice) => void;
  onCollapse?: () => void;
  deliveryOptions: CheckoutDeliveryOption[];
  draftLine1: string;
  draftCity: string;
}) {
  const router = useRouter();
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState(() => resolveInitialCity(deliveryOptions));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const savedChoices = savedAddresses.map(toChoice);
  const draftChoice =
    draftLine1.trim().length > 0
      ? ({
          id: "checkout-draft",
          label: null,
          line1: draftLine1.trim(),
          city: draftCity || CHECKOUT_DELIVERY_CITY_PRIMARY,
          isDefault: false,
          source: "session" as const,
        } satisfies CheckoutAddressChoice)
      : null;

  const combined: CheckoutAddressChoice[] = [];
  for (const choice of [...savedChoices, ...sessionAddresses]) {
    if (!combined.some((item) => sameAddress(item, choice))) {
      combined.push(choice);
    }
  }
  if (
    draftChoice &&
    !combined.some((item) => sameAddress(item, draftChoice))
  ) {
    combined.unshift(draftChoice);
  }

  function clearDraftFields(): void {
    setLine1("");
    setCity(resolveInitialCity(deliveryOptions));
    setError(null);
  }

  function submitNewAddress(): void {
    const trimmed = line1.trim();
    const resolvedCity = resolveCheckoutDeliveryCity(city);
    if (!trimmed || !resolvedCity) {
      return;
    }

    setError(null);

    if (!canSaveAddresses) {
      const local: CheckoutAddressChoice = {
        id: `session-${createId()}`,
        label: null,
        line1: trimmed,
        city: resolvedCity,
        isDefault: false,
        source: "session",
      };
      if (!sessionAddresses.some((item) => sameAddress(item, local))) {
        onSessionAddressesChange([...sessionAddresses, local]);
      }
      onSelect(local);
      clearDraftFields();
      return;
    }

    startSaving(async () => {
      const result = await createCustomerAddressAction(locale, {
        line1: trimmed,
        city: resolvedCity,
        isDefault: savedAddresses.length === 0,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      const created: CheckoutAddressChoice = {
        id: result.value.addressId,
        label: null,
        line1: trimmed,
        city: resolvedCity,
        isDefault: savedAddresses.length === 0,
        source: "saved",
      };
      onSelect(created);
      clearDraftFields();
      router.refresh();
    });
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      submitNewAddress();
    }
  }

  return (
    <div className="overflow-hidden rounded-[15px] border border-gray-200">
      <div className="space-y-3 border-b border-gray-100 bg-gray-50/80 px-3 py-3">
        <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
          {labels.addAddress}
        </p>
        {!canSaveAddresses ? (
          <p className="text-xs text-gray-600">{labels.loginToSave}</p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
            <span className="sr-only">{labels.line1}</span>
            <input
              value={line1}
              onChange={(event) => setLine1(event.target.value)}
              onKeyDown={onDraftKeyDown}
              maxLength={200}
              placeholder={labels.addressPlaceholder}
              disabled={pending || isSaving}
              className={CHECKOUT_FIELD_CLASS}
              autoComplete="street-address"
            />
          </label>
          <div className="w-full shrink-0 sm:w-[150px]">
            <CheckoutSelect
              label={labels.city}
              name="addressCity"
              hideLabel
              value={city}
              onChange={setCity}
              disabled={pending || isSaving || deliveryOptions.length === 0}
              placeholder={labels.selectLocation}
              options={deliveryOptions.map((option) => {
                const value =
                  resolveCheckoutDeliveryCity(option.city) ?? option.city;
                return {
                  value,
                  label: option.label,
                };
              })}
              className="w-full"
            />
          </div>
          <button
            type="button"
            disabled={pending || isSaving || !line1.trim()}
            onClick={submitNewAddress}
            className={`${CHECKOUT_PRIMARY_BUTTON_CLASS} h-11 w-full shrink-0 sm:w-auto sm:px-5`}
          >
            {isSaving ? labels.saving : labels.add}
          </button>
        </div>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div
        role="listbox"
        aria-label={labels.title}
        className={`${CHECKOUT_PICKUP_BRANCH_LIST_CLASS} !rounded-none !border-0`}
      >
        {combined.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-gray-500">
            {labels.noAddresses || selectAddressLabel}
          </p>
        ) : (
          combined.map((choice) => {
            const selected = selectedAddressId === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={pending || isSaving}
                className={`${addressRowClass(selected)} w-full text-left`}
                onClick={() => {
                  if (selected) {
                    onCollapse?.();
                    return;
                  }
                  onSelect(choice);
                }}
              >
                <span
                  className={`mr-2.5 size-[1.125rem] shrink-0 rounded-full border-[1.5px] ${
                    selected
                      ? "border-brand-red bg-brand-red shadow-[inset_0_0_0_3px_#fff]"
                      : "border-gray-300 bg-white"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">
                      {choice.label?.trim() || choice.line1}
                    </span>
                    {choice.isDefault ? (
                      <span className="rounded-full bg-[#e8f4fd] px-2 py-0.5 text-[11px] font-medium text-[#5281e1]">
                        {labels.defaultBadge}
                      </span>
                    ) : null}
                    {choice.source === "session" ||
                    choice.id === "checkout-draft" ? (
                      <span className="rounded-full bg-brand-yellow/20 px-2 py-0.5 text-[11px] font-medium text-gray-800">
                        {labels.newBadge}
                      </span>
                    ) : null}
                  </span>
                  {choice.label?.trim() ? (
                    <span className="mt-0.5 block truncate text-xs text-gray-700">
                      {choice.line1}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block truncate text-xs text-gray-600">
                    {cityLabelFor(choice.city, deliveryOptions)}
                  </span>
                </span>
                {selected ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Check className="size-4 text-brand-red" aria-hidden />
                    <ChevronDown
                      className="size-4 rotate-180 text-gray-400"
                      aria-hidden
                    />
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

