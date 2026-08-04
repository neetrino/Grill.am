/** Shared admin visual tokens (MaMarie supersudo layout, Grill brand colors). */

/** Light wash for the admin shell. */
export const ADMIN_PAGE_BG_CLASS = "bg-[#f3f3f3]";

export const ADMIN_CARD_RADIUS_CLASS = "rounded-[15px]";

export const ADMIN_CARD_CLASS =
  "rounded-[15px] bg-white ring-1 ring-gray-100/80";

export const ADMIN_CARD_PADDED_CLASS = `${ADMIN_CARD_CLASS} p-6`;

/** Content list grids — careers / blog / popups / hero. */
export const ADMIN_CONTENT_CARD_GRID =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

export const ADMIN_CONTENT_CARD_CLASS = `${ADMIN_CARD_CLASS} flex h-full flex-col overflow-hidden !border-0 !shadow-none p-0`;

/** Status pill overlay on content-card thumbnails (hero / popups / blog / careers). */
export const ADMIN_CONTENT_CARD_STATUS_CLASS =
  "absolute top-2 right-2 z-[1] shadow-sm";

/** Matches profile sidebar nav slide timing. */
export const ADMIN_NAV_TRANSITION_MS = 380;

/** Active label/icon tone (pill itself is the sliding indicator). */
export const ADMIN_NAV_ACTIVE_TEXT_CLASS = "text-brand-red";

/** Static active pill — mobile drawer (no sliding indicator there). */
export const ADMIN_NAV_ACTIVE_CLASS =
  "bg-brand-surface text-brand-red ring-1 ring-brand-red/25";

export const ADMIN_NAV_INACTIVE_CLASS =
  "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900";

export const ADMIN_NAV_ICON_ACTIVE_CLASS = "text-brand-red";

export const ADMIN_NAV_ICON_INACTIVE_CLASS = "text-gray-500";

export const ADMIN_NAV_ROW_BASE_CLASS =
  "relative z-10 flex w-full min-w-0 items-center rounded-[15px] text-sm font-medium";

/** Sliding active pill colors (applied on the indicator element). */
export const ADMIN_NAV_INDICATOR = {
  background: "#f4f4f4",
  border: "#db0b20",
} as const;

export const ADMIN_BTN_PRIMARY_CLASS =
  "inline-flex h-11 items-center justify-center rounded-[15px] bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const ADMIN_BTN_SECONDARY_CLASS =
  "inline-flex h-11 items-center justify-center rounded-[15px] border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const ADMIN_FIELD_CLASS =
  "h-11 w-full rounded-[15px] border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15";

export const ADMIN_TEXTAREA_FIELD_CLASS =
  "min-h-[100px] w-full resize-y rounded-[15px] border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15";

/** MaMarie-style motion timings (aligned with profile mobile sheet). */
export const ADMIN_DRAWER_TRANSITION_MS = 300;

export const ADMIN_DRAWER_EASE_CLASS =
  "ease-[cubic-bezier(0.32,0.72,0,1)]";

export const ADMIN_CARD_HOVER_CLASS =
  "transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/** Soft brand chips for dashboard / quick actions. */
export const ADMIN_CHIP_YELLOW = {
  bg: "bg-brand-yellow/25",
  fg: "text-brand-ink",
} as const;

export const ADMIN_CHIP_RED = {
  bg: "bg-brand-red/10",
  fg: "text-brand-red",
} as const;

export const ADMIN_CHIP_CREAM = {
  bg: "bg-brand-cream",
  fg: "text-brand-ink",
} as const;

export const ADMIN_CHIP_SURFACE = {
  bg: "bg-brand-surface",
  fg: "text-gray-700",
} as const;
