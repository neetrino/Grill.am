"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

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

type DeliveryLocationDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  location?: AdminDeliveryLocation | null;
};

type DeliveryLocationFormProps = {
  locale: string;
  location: AdminDeliveryLocation | null;
  onClose: () => void;
};

function DeliveryLocationForm({
  locale,
  location,
  onClose,
}: DeliveryLocationFormProps) {
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
    <form
      className="flex min-h-0 flex-1 flex-col"
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
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
      </div>

      <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
        <Button type="submit" disabled={isPending}>
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
    </form>
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
  const common = dictionary.common;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const formKey = location?.id ?? "new";
  const drawerTitle = location ? copy.editTitle : copy.addTitle;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={drawerTitle}
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{drawerTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label={common.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <DeliveryLocationForm
          key={formKey}
          locale={locale}
          location={location}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
