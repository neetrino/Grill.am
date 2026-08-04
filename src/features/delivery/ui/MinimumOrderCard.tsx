"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { setMinimumOrderAmountAction } from "@/features/delivery/application/manage-delivery";
import { formatMoneyAmount } from "@/lib/money/format";

type MinimumOrderCardProps = {
  locale: string;
  initialAmount: number | null;
};

export function MinimumOrderCard({
  locale,
  initialAmount,
}: MinimumOrderCardProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.delivery.minimumOrder;
  const common = dictionary.common;
  const router = useRouter();
  const [value, setValue] = useState(
    initialAmount != null ? String(initialAmount) : "",
  );
  const [saved, setSaved] = useState(initialAmount);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Tracks the `initialAmount` prop value last synced into local state.
  const [syncedInitialAmount, setSyncedInitialAmount] = useState(initialAmount);

  // Adjust state during render when the prop changes (React "adjusting
  // state on prop change" pattern) instead of a synchronous setState inside
  // an effect.
  if (initialAmount !== syncedInitialAmount) {
    setSyncedInitialAmount(initialAmount);
    setValue(initialAmount != null ? String(initialAmount) : "");
    setSaved(initialAmount);
  }

  function parseInput(): number | null | "invalid" {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const next = Number(trimmed);
    if (!Number.isInteger(next) || next < 1 || next > 100_000_000) {
      return "invalid";
    }
    return next;
  }

  function save(next: number | null): void {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await setMinimumOrderAmountAction(locale, next);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSaved(result.value.amount);
      setValue(result.value.amount != null ? String(result.value.amount) : "");
      setMessage(
        result.value.amount == null
          ? copy.cleared
          : formatAdminMessage(copy.setTo, {
              amount: formatMoneyAmount(result.value.amount, "AMD", locale),
            }),
      );
      router.refresh();
    });
  }

  return (
    <article className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
          <Banknote className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
          <p className="text-sm text-gray-500">{copy.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="minimum-order-input">
          {copy.amountAria}
        </label>
        <div className="relative min-w-[10rem] flex-1">
          <input
            id="minimum-order-input"
            type="number"
            min={1}
            max={100_000_000}
            inputMode="numeric"
            placeholder="0"
            value={value}
            disabled={isPending}
            onChange={(event) => setValue(event.target.value)}
            className={`${ADMIN_INPUT} pr-14`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
            AMD
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => {
            const parsed = parseInput();
            if (parsed === "invalid") {
              setError(copy.invalid);
              return;
            }
            save(parsed);
          }}
        >
          {isPending ? common.saving : common.save}
        </Button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setValue(saved != null ? String(saved) : "");
            setError(null);
            setMessage(null);
          }}
          className="px-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {common.cancel}
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {saved == null
          ? copy.empty
          : formatAdminMessage(copy.active, {
              amount: formatMoneyAmount(saved, "AMD", locale),
            })}
      </p>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
    </article>
  );
}
