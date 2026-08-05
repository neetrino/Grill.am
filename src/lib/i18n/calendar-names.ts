import type { Locale } from "@/lib/i18n/config";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

/**
 * Calendar copy kept next to `format-date.ts`: `Intl.DateTimeFormat` has ICU
 * gaps for `hy` (falls back to Russian), so month and weekday names are fixed
 * tables instead.
 */

export type CalendarLabels = {
  previousMonth: string;
  nextMonth: string;
  today: string;
  clear: string;
  placeholder: string;
  time: string;
};

const MONTH_NAMES: Record<Locale, readonly string[]> = {
  hy: [
    "Հունվար",
    "Փետրվար",
    "Մարտ",
    "Ապրիլ",
    "Մայիս",
    "Հունիս",
    "Հուլիս",
    "Օգոստոս",
    "Սեպտեմբեր",
    "Հոկտեմբեր",
    "Նոյեմբեր",
    "Դեկտեմբեր",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ru: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
};

/** Monday-first, matching the grid built by `buildMonthGrid`. */
const WEEKDAY_NAMES: Record<Locale, readonly string[]> = {
  hy: ["Երկ", "Երք", "Չրք", "Հնգ", "Ուր", "Շբթ", "Կիր"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

const CALENDAR_LABELS: Record<Locale, CalendarLabels> = {
  hy: {
    previousMonth: "Նախորդ ամիս",
    nextMonth: "Հաջորդ ամիս",
    today: "Այսօր",
    clear: "Մաքրել",
    placeholder: "Ընտրեք ամսաթիվը",
    time: "Ժամ",
  },
  en: {
    previousMonth: "Previous month",
    nextMonth: "Next month",
    today: "Today",
    clear: "Clear",
    placeholder: "Select date",
    time: "Time",
  },
  ru: {
    previousMonth: "Предыдущий месяц",
    nextMonth: "Следующий месяц",
    today: "Сегодня",
    clear: "Очистить",
    placeholder: "Выберите дату",
    time: "Время",
  },
};

/** Narrows a route segment (`hy`, `en-US`, undefined) to a supported locale. */
export function toCalendarLocale(value: string | undefined): Locale {
  const base = value?.split("-")[0] ?? defaultLocale;
  return isLocale(base) ? base : defaultLocale;
}

export function calendarMonthName(locale: Locale, month: number): string {
  return MONTH_NAMES[locale][month] ?? "";
}

export function calendarWeekdayNames(locale: Locale): readonly string[] {
  return WEEKDAY_NAMES[locale];
}

export function calendarLabels(locale: Locale): CalendarLabels {
  return CALENDAR_LABELS[locale];
}
