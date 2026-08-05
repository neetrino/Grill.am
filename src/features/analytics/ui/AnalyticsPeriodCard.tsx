"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Card } from "@/components/ui/Card";
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
    <Card
      className={`mb-6 overflow-visible !border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{copy.title}</h2>
        <p className="text-sm font-medium text-gray-500">
          {formatAnalyticsDisplayDate(from)} – {formatAnalyticsDisplayDate(to)}
        </p>
      </div>

      <div className="max-w-md">
        <AdminSelect
          label={copy.label}
          placeholder={copy.label}
          options={periodOptions}
          value={selectedPreset}
          disabled={pending}
          onChange={onPeriodChange}
        />
      </div>

      {selectedPreset === "custom" ? (
        <form
          onSubmit={onCustomSubmit}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[140px] flex-1">
            <DateField label={copy.from} name="from" defaultValue={from} />
          </div>
          <div className="min-w-[140px] flex-1">
            <DateField label={copy.to} name="to" defaultValue={to} />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {copy.apply}
          </button>
        </form>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <a
          href={`/api/exports/admin/analytics?${exportQuery}`}
          className="text-sm font-medium text-gray-700 underline-offset-2 hover:underline"
        >
          {copy.downloadCsv}
        </a>
        {rangeInvalid ? (
          <p className="text-sm text-red-700">{copy.invalidRange}</p>
        ) : null}
      </div>
    </Card>
  );
}
