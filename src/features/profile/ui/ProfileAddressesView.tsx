"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { useConfirmDelete } from "@/components/modal/ConfirmDeleteProvider";
import { Button } from "@/components/ui/Button";
import {
  CHECKOUT_DELIVERY_CITY_PRIMARY,
  resolveCheckoutDeliveryCity,
} from "@/features/checkout/domain/checkout-delivery-cities";
import { CheckoutSelect } from "@/features/checkout/ui/CheckoutSelect";
import {
  createCustomerAddressAction,
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
  updateCustomerAddressAction,
} from "@/features/profile/application/manage-addresses";
import type { CustomerAddressListItem } from "@/features/profile/application/address-queries";
import { ProfileAddressCard } from "@/features/profile/ui/ProfileAddressCard";
import {
  PROFILE_BTN_PRIMARY_CLASS,
  PROFILE_BTN_SECONDARY_CLASS,
  PROFILE_CARD_CLASS,
  PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS,
  PROFILE_SECTION_TITLE_CLASS,
} from "@/features/profile/ui/profile-ui";

const FIELD_CLASS =
  "h-11 w-full rounded-[15px] border border-gray-200 px-3 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15";

type CityOption = {
  value: string;
  label: string;
};

type AddressFormState = {
  line1: string;
  city: string;
  isDefault: boolean;
};

type ProfileAddressesViewProps = {
  locale: string;
  addresses: CustomerAddressListItem[];
  cityOptions: readonly CityOption[];
  labels: {
    title: string;
    addNew: string;
    defaultBadge: string;
    setDefault: string;
    setDefaultConfirm: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    noAddresses: string;
    formAddTitle: string;
    formEditTitle: string;
    line1: string;
    city: string;
    selectCity: string;
    isDefault: string;
    cancel: string;
    add: string;
    update: string;
    saving: string;
  };
};

const emptyForm: AddressFormState = {
  line1: "",
  city: CHECKOUT_DELIVERY_CITY_PRIMARY,
  isDefault: false,
};

function resolveCityValue(
  city: string,
  cityOptions: readonly CityOption[],
): string {
  const resolved = resolveCheckoutDeliveryCity(city);
  if (resolved) {
    return resolved;
  }
  const byLabel = cityOptions.find((option) => option.label === city.trim());
  return byLabel?.value ?? CHECKOUT_DELIVERY_CITY_PRIMARY;
}

function displayCityLabel(
  city: string,
  cityOptions: readonly CityOption[],
): string {
  const resolved = resolveCheckoutDeliveryCity(city);
  if (resolved) {
    return (
      cityOptions.find((option) => option.value === resolved)?.label ?? city
    );
  }
  const byLabel = cityOptions.find((option) => option.label === city.trim());
  return byLabel?.label ?? city;
}

export function ProfileAddressesView({
  locale,
  addresses,
  cityOptions,
  labels,
}: ProfileAddressesViewProps) {
  const router = useRouter();
  const { confirmDelete } = useConfirmDelete();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm(): void {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openAddForm(): void {
    resetForm();
    setShowForm(true);
    setError(null);
    setMessage(null);
  }

  function startEdit(address: CustomerAddressListItem): void {
    setEditingId(address.id);
    setForm({
      line1: address.line1,
      city: resolveCityValue(address.city, cityOptions),
      isDefault: address.isDefaultShipping,
    });
    setShowForm(true);
    setError(null);
    setMessage(null);
  }

  function onSave(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = editingId
        ? await updateCustomerAddressAction(locale, editingId, form)
        : await createCustomerAddressAction(locale, form);

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setMessage(editingId ? "Address updated." : "Address added.");
      setShowForm(false);
      resetForm();
      router.refresh();
    });
  }

  function onDelete(addressId: string): void {
    void (async () => {
      const accepted = await confirmDelete({
        title: labels.delete,
        message: labels.deleteConfirm,
        confirmText: labels.delete,
        cancelText: labels.cancel,
      });
      if (!accepted) {
        return;
      }

      setError(null);
      setMessage(null);
      startTransition(async () => {
        const result = await deleteCustomerAddressAction(locale, addressId);
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        setMessage("Address deleted.");
        if (editingId === addressId) {
          setShowForm(false);
          resetForm();
        }
        router.refresh();
      });
    })();
  }

  function onSetDefault(addressId: string): void {
    void (async () => {
      const accepted = await confirmDelete({
        title: labels.setDefault,
        message: labels.setDefaultConfirm,
        confirmText: labels.setDefault,
        cancelText: labels.cancel,
        confirmTone: "info",
      });
      if (!accepted) {
        return;
      }

      setError(null);
      setMessage(null);
      startTransition(async () => {
        const result = await setDefaultCustomerAddressAction(locale, addressId);
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        setMessage("Default address updated.");
        router.refresh();
      });
    })();
  }

  const sortedAddresses = [...addresses].sort((left, right) => {
    const leftDefault = left.isDefaultShipping ? 0 : 1;
    const rightDefault = right.isDefaultShipping ? 0 : 1;
    return leftDefault - rightDefault;
  });

  return (
    <section className={`p-5 sm:p-7 lg:p-8 ${PROFILE_CARD_CLASS} ${PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS}`}>
      <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={PROFILE_SECTION_TITLE_CLASS}>{labels.title}</h1>
        {!showForm ? (
          <Button
            type="button"
            variant="primary"
            className={`${PROFILE_BTN_PRIMARY_CLASS} w-full shrink-0 sm:w-auto`}
            onClick={openAddForm}
            disabled={isPending}
          >
            {`+ ${labels.addNew}`}
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <form
          onSubmit={onSave}
          className={`mb-8 space-y-5 p-4 sm:mb-10 sm:p-6 ${PROFILE_CARD_CLASS}`}
        >
          <h2 className="text-base font-semibold text-gray-900">
            {editingId ? labels.formEditTitle : labels.formAddTitle}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 sm:items-end">
            <CheckoutSelect
              label={labels.city}
              name="city"
              required
              value={form.city}
              onChange={(city) => setForm((prev) => ({ ...prev, city }))}
              disabled={isPending}
              placeholder={labels.selectCity}
              options={cityOptions}
              className="w-full"
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
              {labels.line1}
              <input
                required
                value={form.line1}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, line1: event.target.value }))
                }
                className={FIELD_CLASS}
                autoComplete="street-address"
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  isDefault: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-gray-300 accent-brand-yellow text-brand-yellow focus:ring-brand-yellow"
            />
            <span className="text-sm text-gray-700">{labels.isDefault}</span>
          </label>
          <div className="flex flex-row items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className={`${PROFILE_BTN_SECONDARY_CLASS} min-w-0 flex-1 sm:flex-none`}
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              disabled={isPending}
            >
              {labels.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={`${PROFILE_BTN_PRIMARY_CLASS} min-w-0 flex-1 sm:flex-none`}
              disabled={isPending}
            >
              {isPending
                ? labels.saving
                : editingId
                  ? labels.update
                  : labels.add}
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 text-sm text-green-700" role="status">
          {message}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {sortedAddresses.length > 0 ? (
          sortedAddresses.map((address) => (
            <ProfileAddressCard
              key={address.id}
              address={address}
              cityLabel={displayCityLabel(address.city, cityOptions)}
              disabled={isPending}
              labels={{
                defaultBadge: labels.defaultBadge,
                setDefault: labels.setDefault,
                edit: labels.edit,
                delete: labels.delete,
              }}
              onSetDefault={onSetDefault}
              onEdit={startEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <p className="col-span-full py-12 text-center text-sm text-gray-500 sm:py-16">
            {labels.noAddresses}
          </p>
        )}
      </div>
    </section>
  );
}
