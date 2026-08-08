/** Armenia business timezone: fixed UTC+4 (Asia/Yerevan, no DST). */
export const APP_TIMEZONE = "Asia/Yerevan";
export const APP_UTC_OFFSET_HOURS = 4;
export const APP_UTC_OFFSET_MS = APP_UTC_OFFSET_HOURS * 60 * 60 * 1000;

export type AppZonedParts = {
  year: number;
  /** 0-based month, matching `Date#getUTCMonth`. */
  monthIndex: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function assertValidDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Calendar/clock parts in the app display timezone (UTC+4).
 * Uses a fixed offset so SSR and every client hydrate identically.
 */
export function toAppZonedParts(
  value: Date | string | number,
): AppZonedParts {
  const shifted = new Date(
    assertValidDate(toDate(value)).getTime() + APP_UTC_OFFSET_MS,
  );
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

/** YYYY-MM-DD in app timezone. */
export function formatAppIsoDate(value: Date | string | number): string {
  const parts = toAppZonedParts(value);
  return `${parts.year}-${pad2(parts.monthIndex + 1)}-${pad2(parts.day)}`;
}

/** YYYY-MM-DD HH:mm in app timezone. */
export function formatAppDateTimeMinutes(
  value: Date | string | number,
): string {
  const parts = toAppZonedParts(value);
  return `${parts.year}-${pad2(parts.monthIndex + 1)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/** YYYY-MM-DD HH:mm:ss in app timezone. */
export function formatAppDateTimeSeconds(
  value: Date | string | number,
): string {
  const parts = toAppZonedParts(value);
  return `${formatAppDateTimeMinutes(value)}:${pad2(parts.second)}`;
}

/** DD.MM.YYYY in app timezone. */
export function formatAppDotDate(value: Date | string | number): string {
  const parts = toAppZonedParts(value);
  return `${pad2(parts.day)}.${pad2(parts.monthIndex + 1)}.${parts.year}`;
}

/** Value for `<input type="datetime-local">` in app timezone. */
export function formatAppDateTimeLocalInput(
  value: Date | string | number,
): string {
  const parts = toAppZonedParts(value);
  return `${parts.year}-${pad2(parts.monthIndex + 1)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/**
 * Parses a `datetime-local` string as app-timezone wall clock → UTC `Date`.
 * Accepts `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`.
 */
export function parseAppDateTimeLocal(value: string): Date {
  const trimmed = value.trim();
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid datetime-local value: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second) - APP_UTC_OFFSET_MS,
  );
}

/** Inclusive start of a YYYY-MM-DD calendar day in app timezone, as UTC. */
export function appDayStartUtc(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - APP_UTC_OFFSET_MS);
}

/** Inclusive end of a YYYY-MM-DD calendar day in app timezone, as UTC. */
export function appDayEndUtc(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) - APP_UTC_OFFSET_MS,
  );
}
