"use client";

import { CalendarDays } from "lucide-react";
import { useParams } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { CalendarPanel } from "@/components/ui/CalendarPanel";
import { getDropdownPortalRoot } from "@/components/ui/dropdown-portal-root";
import {
  dropdownPanelStateClass,
  dropdownPortalStyle,
} from "@/components/ui/dropdown-styles";
import { useDropdownDisclosure } from "@/components/ui/use-dropdown-disclosure";
import { useDropdownPortalPosition } from "@/components/ui/use-dropdown-portal-position";
import {
  DEFAULT_TIME_VALUE,
  joinDateTime,
  readDatePart,
  readTimePart,
} from "@/lib/date/calendar-month";
import {
  calendarLabels,
  toCalendarLocale,
} from "@/lib/i18n/calendar-names";
import { formatShortDate } from "@/lib/i18n/format-date";

/** Measured panel heights — drive the auto flip when space below is short. */
const CALENDAR_PANEL_HEIGHT_PX = 336;
const CALENDAR_PANEL_WITH_TIME_HEIGHT_PX = 396;
/** Mirrors `--calendar-width` in `globals.css`. */
const CALENDAR_PANEL_WIDTH_PX = 280;

type DateFieldProps = {
  label: string;
  /** Controlled value: `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` with `withTime`. */
  value?: string;
  /** Initial value for uncontrolled usage (form posts read the hidden input). */
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Renders a hidden input so the value is submitted with the form. */
  name?: string;
  /** Adds a time row and switches the value to `YYYY-MM-DDTHH:mm`. */
  withTime?: boolean;
  disabled?: boolean;
  /** Hide the visible label (keeps it available to assistive tech). */
  hideLabel?: boolean;
  className?: string;
};

function subscribeNoop(): () => void {
  return () => undefined;
}

/**
 * Date picker with the shared dropdown-panel look. Replaces native
 * `<input type="date">` so the calendar matches the design system, paints
 * above sheets through a portal, and opens upward when it would not fit.
 */
export function DateField({
  label,
  value,
  defaultValue = "",
  onChange,
  name,
  withTime = false,
  disabled = false,
  hideLabel = false,
  className = "",
}: DateFieldProps) {
  const canPortal = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const params = useParams();
  const locale = toCalendarLocale(
    typeof params.locale === "string" ? params.locale : undefined,
  );
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
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
    panelHeightPx: withTime
      ? CALENDAR_PANEL_WITH_TIME_HEIGHT_PX
      : CALENDAR_PANEL_HEIGHT_PX,
    panelWidthPx: CALENDAR_PANEL_WIDTH_PX,
  });

  const currentValue = value ?? uncontrolledValue;
  const selectedDate = readDatePart(currentValue);
  const time = readTimePart(currentValue) || DEFAULT_TIME_VALUE;
  const labels = calendarLabels(locale);

  function commit(nextValue: string): void {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
  }

  function handleSelectDate(isoDate: string): void {
    if (!withTime) {
      commit(isoDate);
      disclosure.close();
      return;
    }
    // Keep the panel open so the time row can still be adjusted.
    commit(joinDateTime(isoDate, time));
  }

  function handleTimeChange(nextTime: string): void {
    if (!selectedDate) {
      return;
    }
    commit(joinDateTime(selectedDate, nextTime));
  }

  function handleClear(): void {
    commit("");
    disclosure.close();
  }

  const displayLabel = selectedDate
    ? [
        formatShortDate(selectedDate, locale),
        withTime ? readTimePart(currentValue) : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : labels.placeholder;

  const panel =
    canPortal && disclosure.isVisible && position
      ? createPortal(
          <CalendarPanel
            locale={locale}
            selectedDate={selectedDate}
            time={time}
            withTime={withTime}
            onSelectDate={handleSelectDate}
            onTimeChange={handleTimeChange}
            onClear={handleClear}
            panelRef={panelRef}
            id={panelId}
            ariaLabel={label}
            className={`calendar-panel ${dropdownPanelStateClass(disclosure.isExpanded)}`}
            style={dropdownPortalStyle(position)}
          />,
          getDropdownPortalRoot(),
        )
      : null;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`.trim()}>
      <label
        htmlFor={triggerId}
        className={
          hideLabel ? "sr-only" : "mb-1 block text-sm font-medium text-gray-700"
        }
      >
        {label}
      </label>

      {name ? (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          suppressHydrationWarning
        />
      ) : null}

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
            selectedDate ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {displayLabel}
        </span>
        <CalendarDays size={16} aria-hidden className="shrink-0 text-gray-500" />
      </button>

      {panel}
    </div>
  );
}
