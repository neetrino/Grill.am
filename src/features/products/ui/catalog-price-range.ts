const PRICE_ACCENT = "#4D7CFE";
const TRACK_IDLE = "#D8DEE9";
const NBSP = "\u00A0";

export const PRICE_RANGE_COLORS = {
  accent: PRICE_ACCENT,
  trackIdle: TRACK_IDLE,
} as const;

export const PRICE_RANGE_THUMB_CLASS =
  "pointer-events-none absolute top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative " +
  "[&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#4D7CFE] " +
  "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.18)] " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:relative " +
  "[&::-moz-range-thumb]:z-10 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 " +
  "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 " +
  "[&::-moz-range-thumb]:border-[#4D7CFE] [&::-moz-range-thumb]:bg-white " +
  "[&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.18)] " +
  "[&::-webkit-slider-runnable-track]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-moz-range-track]:bg-transparent";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Deterministic grouping — avoids Node/browser ICU hydration mismatches. */
export function formatAmount(value: number, locale: string): string {
  const digits = String(Math.trunc(Math.abs(value)));
  const separator = locale.startsWith("en") ? "," : NBSP;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return value < 0 ? `-${grouped}` : grouped;
}

export function formatPriceLabel(
  value: number,
  locale: string,
  currencySymbol: string,
): string {
  return `${formatAmount(value, locale)}${NBSP}${currencySymbol}`;
}

/** Keeps only ASCII digits — blocks letters and symbols while typing. */
export function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export function parseAmountInput(raw: string): number | null {
  const digits = digitsOnly(raw);
  if (digits.length === 0) return null;
  return Number(digits);
}

export function resolvePriceBounds(priceBounds: {
  min: number;
  max: number;
} | null): { absoluteMin: number; absoluteMax: number } {
  const absoluteMin = 0;
  const absoluteMax = Math.max(priceBounds?.max ?? 0, absoluteMin + 1);
  return { absoluteMin, absoluteMax };
}

export function toFilterPrice(
  value: number,
  absoluteMin: number,
  absoluteMax: number,
  edge: "min" | "max",
): number | undefined {
  if (edge === "min") return value > absoluteMin ? value : undefined;
  return value < absoluteMax ? value : undefined;
}
