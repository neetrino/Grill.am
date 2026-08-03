/** Shared clay-profile visual tokens (MaMarie layout, Grill mono palette). */

/** Light gray wash for the profile shell. */
export const PROFILE_PAGE_BG_CLASS = "bg-[#fafafa]";

export const PROFILE_CARD_RADIUS_CLASS = "rounded-[15px]";

export const PROFILE_CARD_CLASS =
  "rounded-[15px] bg-white ring-1 ring-gray-100/80";

export const PROFILE_CARD_FLAT_CLASS =
  "rounded-[15px] bg-white ring-1 ring-gray-100/80";

export const PROFILE_SECTION_TITLE_CLASS =
  "text-xl font-bold text-gray-900";

export const PROFILE_SIDEBAR_WIDTH_PX = 280;

export const PROFILE_NAV_TRANSITION_MS = 380;

/** Single icon treatment for nav/menu rows. */
export const PROFILE_ICON_TONE = {
  background: "#f4f4f4",
  foreground: "#374151",
} as const;

/** Active nav pill — soft gray well + brand accent edge. */
export const PROFILE_NAV_ACTIVE = {
  background: "#f4f4f4",
  border: "#db0b20",
  label: "#db0b20",
} as const;

export type ProfileNavKey =
  | "dashboard"
  | "orders"
  | "promoCodes"
  | "personal"
  | "addresses"
  | "password"
  | "deleteAccount";

export const PROFILE_STAT_KEYS = [
  "totalOrders",
  "totalSpent",
  "pendingOrders",
  "savedAddresses",
] as const;

export type ProfileStatKey = (typeof PROFILE_STAT_KEYS)[number];

export const PROFILE_PENDING_BADGE_CLASS =
  "inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700";

export const PROFILE_PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 items-center justify-center rounded-full bg-brand-red px-6 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red";

export const PROFILE_MOBILE_SHEET_Z_INDEX = 90;
export const PROFILE_MOBILE_SHEET_HEIGHT_VH = 72;
