"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Percent } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ADMIN_INPUT } from "@/features/admin/ui/admin-form-classes";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import { setGlobalDiscountAction } from "@/features/promotions/application/manage-discounts";

const QUICK_PERCENTS = [10, 20, 30, 50] as const;

type GlobalDiscountCardProps = {
  locale: string;
  initialPercent: number | null;
};

export function GlobalDiscountCard({
  locale,
  initialPercent,
}: GlobalDiscountCardProps) {
  const dictionary = useAdminDictionary();
  const copy = dictionary.discounts.global;
  const common = dictionary.common;
  const router = useRouter();
  const [value, setValue] = useState(
    initialPercent != null ? String(initialPercent) : "",
  );
  const [saved, setSaved] = useState(initialPercent);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Tracks the `initialPercent` prop value last synced into local state.
  const [syncedInitialPercent, setSyncedInitialPercent] =
    useState(initialPercent);

  // Adjust state during render when the prop changes (React "adjusting
  // state on prop change" pattern) instead of a synchronous setState inside
  // an effect.
  if (initialPercent !== syncedInitialPercent) {
    setSyncedInitialPercent(initialPercent);
    setValue(initialPercent != null ? String(initialPercent) : "");
    setSaved(initialPercent);
  }

  function parseInput(): number | null | "invalid" {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const next = Number(trimmed);
    if (!Number.isInteger(next) || next < 1 || next > 100) return "invalid";
    return next;
  }

  function save(next: number | null): void {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await setGlobalDiscountAction(locale, next);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSaved(result.value.percentage);
      setValue(
        result.value.percentage != null ? String(result.value.percentage) : "",
      );
      setMessage(
        result.value.percentage == null
          ? copy.cleared
          : formatAdminMessage(copy.setTo, {
              percent: String(result.value.percentage),
            }),
      );
      router.refresh();
    });
  }

  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
          <Percent className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
          <p className="text-sm text-gray-500">{copy.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="global-discount-input">
          {copy.percentAria}
        </label>
        <div className="relative min-w-[8rem] flex-1">
          <input
            id="global-discount-input"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            placeholder="0"
            value={value}
            disabled={isPending}
            onChange={(event) => setValue(event.target.value)}
            className={`${ADMIN_INPUT} pr-8`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
            %
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
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {saved == null
          ? copy.empty
          : formatAdminMessage(copy.active, { percent: String(saved) })}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {QUICK_PERCENTS.map((percent) => (
          <button
            key={percent}
            type="button"
            disabled={isPending}
            onClick={() => setValue(String(percent))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {percent}%
          </button>
        ))}
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

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
    </article>
  );
}
