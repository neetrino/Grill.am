"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { upsertStoreSettingAction } from "@/features/settings/application/upsert-settings";
import type { StoreLoyalty } from "@/features/settings/domain/store-settings";

type AdminLoyaltySettingsFormProps = {
  locale: string;
  initial: StoreLoyalty;
};

export function AdminLoyaltySettingsForm({
  locale,
  initial,
}: AdminLoyaltySettingsFormProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.bonuses;
  const common = dictionary.common;
  const router = useRouter();
  const [earnMinOrderAmount, setEarnMinOrderAmount] = useState(
    initial.earnMinOrderAmount == null
      ? ""
      : String(initial.earnMinOrderAmount),
  );
  const [synced, setSynced] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (initial.earnMinOrderAmount !== synced.earnMinOrderAmount) {
    setSynced(initial);
    setEarnMinOrderAmount(
      initial.earnMinOrderAmount == null
        ? ""
        : String(initial.earnMinOrderAmount),
    );
  }

  function parseMinOrder(raw: string): number | null | "invalid" {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const next = Number(trimmed);
    if (!Number.isInteger(next) || next < 1 || next > 100_000_000) {
      return "invalid";
    }
    return next;
  }

  function onSave(): void {
    const minOrder = parseMinOrder(earnMinOrderAmount);
    if (minOrder === "invalid") {
      setError(copy.invalidMinOrder);
      return;
    }

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await upsertStoreSettingAction(locale, {
        key: "store.loyalty",
        // Global earn % removed: bonuses come from product/category rules only.
        value: { earnPercent: 0, earnMinOrderAmount: minOrder },
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSynced({ earnPercent: 0, earnMinOrderAmount: minOrder });
      setMessage(copy.saved);
      router.refresh();
    });
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{copy.formTitle}</h2>
          <p className="text-sm text-gray-500">{copy.formSubtitle}</p>
        </div>
      </div>

      <div className="max-w-md">
        <label
          htmlFor="loyalty-earn-min-order"
          className="mb-1.5 block text-sm font-medium text-gray-800"
        >
          {copy.earnMinOrderLabel}
        </label>
        <div className="relative">
          <input
            id="loyalty-earn-min-order"
            type="number"
            min={1}
            max={100_000_000}
            inputMode="numeric"
            value={earnMinOrderAmount}
            disabled={isPending}
            placeholder={copy.earnMinOrderPlaceholder}
            onChange={(event) => setEarnMinOrderAmount(event.target.value)}
            className={`${ADMIN_INPUT} pr-14`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
            AMD
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">{copy.earnMinOrderHint}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={onSave}>
          {isPending ? common.saving : common.save}
        </Button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setEarnMinOrderAmount(
              synced.earnMinOrderAmount == null
                ? ""
                : String(synced.earnMinOrderAmount),
            );
            setError(null);
            setMessage(null);
          }}
          className="px-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {common.cancel}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
    </article>
  );
}
