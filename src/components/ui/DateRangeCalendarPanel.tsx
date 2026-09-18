"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type CSSProperties, type RefObject } from "react";

import {
  buildMonthGrid,
  DEFAULT_TIME_VALUE,
  joinDateTime,
  monthOfDate,
  readDatePart,
  readTimePart,
  shiftMonth,
  todayIsoDate,
} from "@/lib/date/calendar-month";
import {
  calendarLabels,
  calendarMonthName,
  calendarWeekdayNames,
} from "@/lib/i18n/calendar-names";
import type { Locale } from "@/lib/i18n/config";

export type DateRangeBound = "start" | "end";

type DateRangeCalendarPanelProps = {
  locale: Locale;
  activeBound: DateRangeBound;
  onActiveBoundChange: (bound: DateRangeBound) => void;
  startValue: string;
  endValue: string;
  onBoundChange: (bound: DateRangeBound, nextValue: string) => void;
  onClear: () => void;
  onApply: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
  id: string;
  ariaLabel: string;
  className: string;
  style: CSSProperties;
};

function sanitizeHourDraft(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (digits.length === 0) return "";
  if (digits.length === 1) return digits;
  const value = Math.min(23, Number(digits));
  return String(Number.isFinite(value) ? value : 0).padStart(2, "0");
}

function sanitizeMinuteDraft(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 2);
  if (digits.length === 0) return "";
  if (digits.length === 1) return digits;
  const value = Math.min(59, Number(digits));
  return String(Number.isFinite(value) ? value : 0).padStart(2, "0");
}

function dayClass(options: {
  isSelected: boolean;
  isToday: boolean;
  inVisibleMonth: boolean;
}): string {
  const modifiers = [
    options.inVisibleMonth ? "" : "calendar-day--muted",
    options.isToday && !options.isSelected ? "calendar-day--today" : "",
    options.isSelected ? "calendar-day--selected-soft" : "",
  ].filter(Boolean);

  return ["calendar-day", ...modifiers].join(" ");
}

/** Range picker panel: Start/End tabs, month grid, hour/minute, Clear/Apply. */
export function DateRangeCalendarPanel({
  locale,
  activeBound,
  onActiveBoundChange,
  startValue,
  endValue,
  onBoundChange,
  onClear,
  onApply,
  panelRef,
  id,
  ariaLabel,
  className,
  style,
}: DateRangeCalendarPanelProps) {
  const activeValue = activeBound === "start" ? startValue : endValue;
  const selectedDate = readDatePart(activeValue);
  const time = readTimePart(activeValue) || DEFAULT_TIME_VALUE;
  const [hourDraft, setHourDraft] = useState(time.slice(0, 2));
  const [minuteDraft, setMinuteDraft] = useState(time.slice(3, 5));
  const [syncedTime, setSyncedTime] = useState(time);
  const [syncedBound, setSyncedBound] = useState(activeBound);

  if (time !== syncedTime || activeBound !== syncedBound) {
    setSyncedTime(time);
    setSyncedBound(activeBound);
    setHourDraft(time.slice(0, 2));
    setMinuteDraft(time.slice(3, 5));
  }

  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthOfDate(selectedDate || readDatePart(startValue) || todayIsoDate()),
  );
  const labels = calendarLabels(locale);
  const today = todayIsoDate();
  const days = buildMonthGrid(visibleMonth);

  function commitTime(nextHour: string, nextMinute: string): void {
    const hour = nextHour === "" ? "00" : nextHour;
    const minute = nextMinute === "" ? "00" : nextMinute;
    const date = selectedDate || today;
    onBoundChange(activeBound, joinDateTime(date, `${hour}:${minute}`));
  }

  function handleSelectDate(isoDate: string): void {
    const hour = sanitizeHourDraft((hourDraft || "00").padStart(2, "0"));
    const minute = sanitizeMinuteDraft((minuteDraft || "00").padStart(2, "0"));
    setHourDraft(hour);
    setMinuteDraft(minute);
    onBoundChange(activeBound, joinDateTime(isoDate, `${hour}:${minute}`));
  }

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1"
      >
        {(
          [
            { id: "start", label: labels.rangeStart },
            { id: "end", label: labels.rangeEnd },
          ] as const
        ).map((tab) => {
          const selected = tab.id === activeBound;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onActiveBoundChange(tab.id)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                selected
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={labels.previousMonth}
          onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))}
          className="calendar-nav"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {calendarMonthName(locale, visibleMonth.month)} {visibleMonth.year}
        </span>
        <button
          type="button"
          aria-label={labels.nextMonth}
          onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))}
          className="calendar-nav"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      <div className="calendar-grid">
        {calendarWeekdayNames(locale).map((weekday) => (
          <span key={weekday} className="calendar-weekday">
            {weekday}
          </span>
        ))}
      </div>

      <div className="calendar-grid mt-1">
        {days.map((day) => {
          const isSelected = day.value === selectedDate;
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelectDate(day.value)}
              className={dayClass({
                isSelected,
                isToday: day.value === today,
                inVisibleMonth: day.inVisibleMonth,
              })}
            >
              {day.dayOfMonth}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-[16px] bg-gray-100 px-3 py-3">
        <p className="mb-2 text-xs font-bold tracking-wide text-gray-700">
          {labels.timeSection}
        </p>
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              {labels.hour}
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={hourDraft}
              onChange={(event) => {
                const next = sanitizeHourDraft(event.target.value);
                setHourDraft(next);
                if (next.length === 2) {
                  commitTime(next, (minuteDraft || "00").padStart(2, "0"));
                }
              }}
              onBlur={() => {
                const next = sanitizeHourDraft(
                  (hourDraft || "00").padStart(2, "0"),
                );
                setHourDraft(next);
                commitTime(next, sanitizeMinuteDraft((minuteDraft || "00").padStart(2, "0")));
              }}
              className="h-11 w-full rounded-[12px] border border-gray-200 bg-white px-3 text-center text-sm font-semibold text-gray-900 outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15"
            />
          </label>
          <span className="pb-3 text-base font-semibold text-gray-500" aria-hidden>
            :
          </span>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              {labels.minute}
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={minuteDraft}
              onChange={(event) => {
                const next = sanitizeMinuteDraft(event.target.value);
                setMinuteDraft(next);
                if (next.length === 2) {
                  commitTime((hourDraft || "00").padStart(2, "0"), next);
                }
              }}
              onBlur={() => {
                const next = sanitizeMinuteDraft(
                  (minuteDraft || "00").padStart(2, "0"),
                );
                setMinuteDraft(next);
                commitTime(
                  sanitizeHourDraft((hourDraft || "00").padStart(2, "0")),
                  next,
                );
              }}
              className="h-11 w-full rounded-[12px] border border-gray-200 bg-white px-3 text-center text-sm font-semibold text-gray-900 outline-none focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15"
            />
          </label>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClear}
          className="px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          {labels.clear}
        </button>
        <button
          type="button"
          onClick={() => {
            const hour = sanitizeHourDraft(
              (hourDraft || "00").padStart(2, "0"),
            );
            const minute = sanitizeMinuteDraft(
              (minuteDraft || "00").padStart(2, "0"),
            );
            setHourDraft(hour);
            setMinuteDraft(minute);
            commitTime(hour, minute);
            onApply();
          }}
          className="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-[14px] bg-brand-yellow px-5 text-sm font-semibold text-brand-ink transition hover:bg-brand-yellow/90"
        >
          {labels.apply}
        </button>
      </div>
    </div>
  );
}
