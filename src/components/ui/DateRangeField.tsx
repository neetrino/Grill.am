"use client";

import { CalendarDays } from "lucide-react";
import { useParams } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import {
  DateRangeCalendarPanel,
  type DateRangeBound,
} from "@/components/ui/DateRangeCalendarPanel";
import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";
import {
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownDisclosure } from "@/components/ui/use-dropdown-disclosure";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";
import { readDatePart, readTimePart } from "@/lib/date/calendar-month";
import {
  calendarLabels,
  toCalendarLocale,
} from "@/lib/i18n/calendar-names";
import { formatShortDate } from "@/lib/i18n/format-date";

const RANGE_PANEL_HEIGHT_PX = 480;
const RANGE_PANEL_WIDTH_PX = 300;

export type DateRangeValue = {
  startsAt: string;
  endsAt: string;
};

type DateRangeFieldProps = {
  label: string;
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  disabled?: boolean;
  hideLabel?: boolean;
  className?: string;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

function formatBound(value: string, locale: string): string {
  const date = readDatePart(value);
  if (!date) return "";
  const time = readTimePart(value);
  return [formatShortDate(date, locale), time].filter(Boolean).join(" ");
}

/**
 * Start/end datetime range field matching the bonus period picker mock:
 * segmented Start/End tabs, calendar, hour/minute, Clear/Apply.
 */
export function DateRangeField({
  label,
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  className = "",
}: DateRangeFieldProps) {
  const canPortal = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const params = useParams();
  const locale = toCalendarLocale(
    typeof params.locale === "string" ? params.locale : undefined,
  );
  const labels = calendarLabels(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const panelId = useId();

  const disclosure = useDropdownDisclosure({
    disabled,
    insideRefs: [containerRef, panelRef],
  });
  const position = useDropdownPortalPosition(disclosure.isVisible, triggerRef, {
    matchTriggerWidth: false,
    placement: "auto",
    panelHeightPx: RANGE_PANEL_HEIGHT_PX,
    panelWidthPx: RANGE_PANEL_WIDTH_PX,
    panelRef,
    shrinkToFit: false,
  });

  const [activeBound, setActiveBound] = useState<DateRangeBound>("start");
  const [draft, setDraft] = useState<DateRangeValue>(value);
  const [wasOpen, setWasOpen] = useState(disclosure.isOpen);

  if (disclosure.isOpen !== wasOpen) {
    setWasOpen(disclosure.isOpen);
    if (disclosure.isOpen) {
      setDraft(value);
      setActiveBound("start");
    }
  }

  function handleBoundChange(bound: DateRangeBound, nextValue: string): void {
    setDraft((prev) =>
      bound === "start"
        ? { ...prev, startsAt: nextValue }
        : { ...prev, endsAt: nextValue },
    );
  }

  function handleClear(): void {
    const empty = { startsAt: "", endsAt: "" };
    setDraft(empty);
    onChange(empty);
    disclosure.close();
  }

  function handleApply(): void {
    onChange(draft);
    disclosure.close();
  }

  const startLabel = formatBound(value.startsAt, locale);
  const endLabel = formatBound(value.endsAt, locale);
  const displayLabel =
    startLabel || endLabel
      ? [startLabel || "…", endLabel || "…"].join(" – ")
      : labels.rangePlaceholder;

  const panel =
    canPortal && disclosure.isVisible && position
      ? createPortal(
          <DateRangeCalendarPanel
            locale={locale}
            activeBound={activeBound}
            onActiveBoundChange={setActiveBound}
            startValue={draft.startsAt}
            endValue={draft.endsAt}
            onBoundChange={handleBoundChange}
            onClear={handleClear}
            onApply={handleApply}
            panelRef={panelRef}
            id={panelId}
            ariaLabel={label}
            className={`calendar-panel calendar-range-panel ${dropdownPanelStateClass(disclosure.isExpanded)}`}
            style={dropdownPortalStyle(position)}
          />,
          getDropdownPortalRoot(),
        )
      : null;

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`.trim()}>
      <label
        htmlFor={triggerId}
        className={
          hideLabel ? "sr-only" : "mb-1 block text-sm font-medium text-gray-700"
        }
      >
        {label}
      </label>

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={disclosure.isOpen}
        aria-controls={panelId}
        disabled={disabled}
        onClick={disclosure.toggle}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-[15px] border bg-white px-3 text-left transition-colors outline-none focus-visible:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red/15 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          disclosure.isOpen ? "border-brand-red" : "border-gray-200"
        }`}
      >
        <span
          className={`truncate text-sm ${
            startLabel || endLabel ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {displayLabel}
        </span>
        <CalendarDays
          size={16}
          aria-hidden
          className="shrink-0 text-brand-red"
        />
      </button>

      {panel}
    </div>
  );
}
