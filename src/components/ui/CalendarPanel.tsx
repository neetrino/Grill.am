"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type CSSProperties, type RefObject } from "react";

import {
  buildMonthGrid,
  monthOfDate,
  shiftMonth,
  todayIsoDate,
} from "@/lib/date/calendar-month";
import {
  calendarLabels,
  calendarMonthName,
  calendarWeekdayNames,
} from "@/lib/i18n/calendar-names";
import type { Locale } from "@/lib/i18n/config";

type CalendarPanelProps = {
  locale: Locale;
  /** `YYYY-MM-DD`, or `""` when nothing is selected yet. */
  selectedDate: string;
  /** `HH:mm` — only rendered when `withTime` is set. */
  time: string;
  withTime: boolean;
  onSelectDate: (isoDate: string) => void;
  onTimeChange: (time: string) => void;
  onClear: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
  id: string;
  ariaLabel: string;
  className: string;
  style: CSSProperties;
};

function dayClass(options: {
  isSelected: boolean;
  isToday: boolean;
  inVisibleMonth: boolean;
}): string {
  const modifiers = [
    options.inVisibleMonth ? "" : "calendar-day--muted",
    options.isToday && !options.isSelected ? "calendar-day--today" : "",
    options.isSelected ? "calendar-day--selected" : "",
  ].filter(Boolean);

  return ["calendar-day", ...modifiers].join(" ");
}

/** Month grid rendered inside the DateField portal panel. */
export function CalendarPanel({
  locale,
  selectedDate,
  time,
  withTime,
  onSelectDate,
  onTimeChange,
  onClear,
  panelRef,
  id,
  ariaLabel,
  className,
  style,
}: CalendarPanelProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    monthOfDate(selectedDate),
  );
  const labels = calendarLabels(locale);
  const today = todayIsoDate();
  const days = buildMonthGrid(visibleMonth);

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label={ariaLabel}
      className={className}
      style={style}
    >
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
              onClick={() => onSelectDate(day.value)}
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

      {withTime ? (
        <label className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span className="text-xs font-medium text-gray-500">
            {labels.time}
          </span>
          <input
            type="time"
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
            className="h-9 rounded-[10px] border border-gray-200 px-2 text-sm text-gray-900 outline-none focus:border-brand-red/40"
          />
        </label>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectDate(today)}
          className="rounded-[10px] px-2 py-1 text-xs font-medium text-brand-red hover:bg-gray-50"
        >
          {labels.today}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-[10px] px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        >
          {labels.clear}
        </button>
      </div>
    </div>
  );
}
