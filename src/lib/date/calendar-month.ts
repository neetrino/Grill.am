/**
 * Pure helpers for the date-picker calendar. All values are calendar strings
 * (`YYYY-MM-DD`, `HH:mm`, `YYYY-MM-DDTHH:mm`) built from UTC fields so the
 * rendered grid never shifts by the viewer's timezone.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

/** Monday-first grid: 6 weeks always, so the panel height never changes. */
export const CALENDAR_WEEK_COUNT = 6;
export const CALENDAR_DAYS_PER_WEEK = 7;

const CALENDAR_CELL_COUNT = CALENDAR_WEEK_COUNT * CALENDAR_DAYS_PER_WEEK;

export const DEFAULT_TIME_VALUE = "00:00";

export type CalendarDayCell = {
  /** `YYYY-MM-DD` — also the React key. */
  value: string;
  dayOfMonth: number;
  /** False for leading/trailing days borrowed from the neighbour months. */
  inVisibleMonth: boolean;
};

export type CalendarMonth = {
  year: number;
  /** Zero-based, matching `Date.prototype.getUTCMonth`. */
  month: number;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Date half of a `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm` value, `""` if absent. */
export function readDatePart(value: string): string {
  const datePart = value.slice(0, 10);
  return ISO_DATE_PATTERN.test(datePart) ? datePart : "";
}

/** Time half of a `YYYY-MM-DDTHH:mm` value, `""` if absent. */
export function readTimePart(value: string): string {
  const timePart = value.slice(11, 16);
  return TIME_PATTERN.test(timePart) ? timePart : "";
}

export function joinDateTime(date: string, time: string): string {
  if (!date) {
    return "";
  }
  return `${date}T${time || DEFAULT_TIME_VALUE}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Month to display when the field opens: the selected one, else today. */
export function monthOfDate(isoDate: string): CalendarMonth {
  const source = ISO_DATE_PATTERN.test(isoDate) ? isoDate : todayIsoDate();
  const [year, month] = source.split("-").map(Number);
  return { year: year ?? 0, month: (month ?? 1) - 1 };
}

export function shiftMonth(
  current: CalendarMonth,
  delta: number,
): CalendarMonth {
  const shifted = new Date(Date.UTC(current.year, current.month + delta, 1));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() };
}

/**
 * 42 cells starting on the Monday on or before the first day of the month.
 */
export function buildMonthGrid({
  year,
  month,
}: CalendarMonth): readonly CalendarDayCell[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % CALENDAR_DAYS_PER_WEEK;

  return Array.from({ length: CALENDAR_CELL_COUNT }, (_, index) => {
    const date = new Date(Date.UTC(year, month, 1 - mondayOffset + index));
    return {
      value: toIsoDate(date),
      dayOfMonth: date.getUTCDate(),
      inVisibleMonth: date.getUTCMonth() === month,
    };
  });
}
