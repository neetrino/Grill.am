"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { CalendarRange, Download } from "lucide-react";

import { DateField } from "@/components/ui/DateField";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import {
  ANALYTICS_PERIOD_PRESETS,
  formatAnalyticsDisplayDate,
  rangeForAnalyticsPeriod,
  type AnalyticsPeriodPreset,
} from "@/features/analytics/domain/date-range";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";

type AnalyticsPeriodCardProps = {
  locale: string;
  from: string;
  to: string;
  preset: AnalyticsPeriodPreset;
  exportQuery: string;
  rangeInvalid: boolean;
};

function periodLabel(
  preset: AnalyticsPeriodPreset,
  labels: {
    last7: string;
    last30: string;
    last90: string;
    thisMonth: string;
    custom: string;
  },
): string {
  switch (preset) {
    case "last_7_days":
      return labels.last7;
    case "last_30_days":
      return labels.last30;
    case "last_90_days":
      return labels.last90;
    case "this_month":
      return labels.thisMonth;
    case "custom":
      return labels.custom;
  }
}

export function AnalyticsPeriodCard({
  locale,
  from,
  to,
  preset,
  exportQuery,
  rangeInvalid,
}: AnalyticsPeriodCardProps) {
  const copy = useAdminDictionary().analytics.period;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [forceCustom, setForceCustom] = useState(preset === "custom");
  const selectedPreset: AnalyticsPeriodPreset = forceCustom
    ? "custom"
    : preset;

  function navigate(nextFrom: string, nextTo: string): void {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    setForceCustom(false);
    startTransition(() => {
      router.push(`/${locale}/admin/analytics?${params.toString()}`);
    });
  }

  function onPeriodChange(value: string): void {
    const next = value as AnalyticsPeriodPreset;
    if (next === "custom") {
      setForceCustom(true);
      return;
    }
    const range = rangeForAnalyticsPeriod(next);
    navigate(range.from, range.to);
  }

  function onCustomSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextFrom = String(data.get("from") ?? "");
    const nextTo = String(data.get("to") ?? "");
    if (!nextFrom || !nextTo) {
      return;
    }
    navigate(nextFrom, nextTo);
  }

  const periodOptions = ANALYTICS_PERIOD_PRESETS.map((option) => ({
    value: option,
    label: periodLabel(option, copy),
  }));

  return (
    <div className={`mb-3 ${ADMIN_CARD_CLASS} p-4`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-yellow/25 text-brand-ink">
            <CalendarRange className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">{copy.title}</h2>
            <p className="text-xs text-gray-500">
              {formatAnalyticsDisplayDate(from)} – {formatAnalyticsDisplayDate(to)}
            </p>
          </div>
        </div>
        <a
          href={`/api/exports/admin/analytics?${exportQuery}`}
          className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold text-brand-red ring-1 ring-brand-red/20 transition hover:bg-brand-red/5"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {copy.downloadCsv}
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-end">
        <AdminSelect
          label={copy.label}
          placeholder={copy.label}
          options={periodOptions}
          value={selectedPreset}
          disabled={pending}
          onChange={onPeriodChange}
        />

        {selectedPreset === "custom" ? (
          <form
            onSubmit={onCustomSubmit}
            className="flex flex-wrap items-end gap-2"
          >
            <div className="min-w-[120px] flex-1">
              <DateField label={copy.from} name="from" defaultValue={from} />
            </div>
            <div className="min-w-[120px] flex-1">
              <DateField label={copy.to} name="to" defaultValue={to} />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-[10px] bg-brand-red px-3 py-2 text-xs font-semibold text-white hover:bg-brand-red/90 disabled:opacity-60"
            >
              {copy.apply}
            </button>
          </form>
        ) : null}
      </div>

      {rangeInvalid ? (
        <p className="mt-2 text-xs text-brand-red">{copy.invalidRange}</p>
      ) : null}
    </div>
  );
}
