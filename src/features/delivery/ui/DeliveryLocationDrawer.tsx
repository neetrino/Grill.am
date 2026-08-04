"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SideSheet } from "@/components/drawer/SideSheet";
import { Button } from "@/components/ui/Button";
import {
  ADMIN_INPUT,
  ADMIN_LABEL,
} from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  createDeliveryLocationAction,
  updateDeliveryLocationAction,
} from "@/features/delivery/application/manage-delivery";
import type { AdminDeliveryLocation } from "@/features/delivery/application/queries";

const DELIVERY_LOCATION_FORM_ID = "delivery-location-form";

type DeliveryLocationDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  location?: AdminDeliveryLocation | null;
};

type DeliveryLocationEditorProps = {
  locale: string;
  location: AdminDeliveryLocation | null;
  onClose: () => void;
  drawerTitle: string;
  open: boolean;
};

function DeliveryLocationEditor({
  locale,
  location,
  onClose,
  drawerTitle,
  open,
}: DeliveryLocationEditorProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.delivery.drawer;
  const common = dictionary.common;
  const router = useRouter();
  const isEdit = location != null;
  const [country, setCountry] = useState(location?.country ?? "");
  const [city, setCity] = useState(location?.city ?? "");
  const [priceAmount, setPriceAmount] = useState(
    location ? String(location.priceAmount) : "",
  );
  const [freeThresholdAmount, setFreeThresholdAmount] = useState(
    location?.freeThresholdAmount != null
      ? String(location.freeThresholdAmount)
      : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title={drawerTitle}
      closeLabel={common.close}
      footer={
        <div className="flex items-center gap-4 border-t border-gray-100 px-5 py-4 lg:px-4">
          <Button
            type="submit"
            form={DELIVERY_LOCATION_FORM_ID}
            disabled={isPending}
          >
            {isPending ? common.saving : common.save}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {common.cancel}
          </button>
        </div>
      }
    >
      <form
        id={DELIVERY_LOCATION_FORM_ID}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();

          const payload = {
            country,
            city,
            priceAmount: Number(priceAmount),
            freeThresholdAmount:
              freeThresholdAmount.trim() === ""
                ? null
                : Number(freeThresholdAmount),
          };

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && location
                ? await updateDeliveryLocationAction(
                    locale,
                    location.id,
                    payload,
                  )
                : await createDeliveryLocationAction(locale, payload);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            onClose();
            router.refresh();
          });
        }}
      >
        <label>
          <span className={ADMIN_LABEL}>{copy.country}</span>
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder={copy.countryPlaceholder}
            required
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label>
          <span className={ADMIN_LABEL}>{copy.city}</span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder={copy.cityPlaceholder}
            required
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label>
          <span className={ADMIN_LABEL}>{copy.price}</span>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={priceAmount}
            onChange={(event) => setPriceAmount(event.target.value)}
            placeholder="1500"
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label>
          <span className={ADMIN_LABEL}>{copy.freeFrom}</span>
          <input
            type="number"
            min={0}
            step={1}
            value={freeThresholdAmount}
            onChange={(event) => setFreeThresholdAmount(event.target.value)}
            placeholder="50000"
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </SideSheet>
  );
}

export function DeliveryLocationDrawer({
  locale,
  open,
  onClose,
  location = null,
}: DeliveryLocationDrawerProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.delivery.drawer;
  const drawerTitle = location ? copy.editTitle : copy.addTitle;
  const formKey = location?.id ?? "new";

  return (
    <DeliveryLocationEditor
      key={formKey}
      open={open}
      locale={locale}
      location={location}
      onClose={onClose}
      drawerTitle={drawerTitle}
    />
  );
}
