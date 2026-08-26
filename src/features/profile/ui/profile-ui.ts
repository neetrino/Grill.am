/** Shared clay-profile visual tokens (MaMarie layout, Grill mono palette). */

/** Light gray wash for the profile shell. */
export const PROFILE_PAGE_BG_CLASS = "bg-[#f2f0f0]";

export const PROFILE_CARD_RADIUS_CLASS = "rounded-[15px]";

export const PROFILE_CARD_CLASS =
  "rounded-[15px] bg-white ring-1 ring-gray-100/80";

export const PROFILE_CARD_FLAT_CLASS =
  "rounded-[15px] bg-white ring-1 ring-gray-100/80";

/** Desktop sidebar minimum; the column grows when the email is longer. */
export const PROFILE_SIDEBAR_WIDTH_PX = 280;

/**
 * Sticky band under the header with equal top/bottom gaps (1.75rem),
 * so sidebar + content sit in the middle of the visible viewport.
 */
export const PROFILE_STICKY_BAND_CLASS =
  "lg:sticky lg:top-[calc(var(--storefront-header-offset)+1.75rem)] lg:z-10 lg:h-[calc(100dvh-var(--storefront-header-offset)-3.5rem)] lg:max-h-[calc(100dvh-var(--storefront-header-offset)-3.5rem)] lg:self-start";

export const PROFILE_NAV_TRANSITION_MS = 380;

/** Brand-yellow icon chip with white glyph strokes (mobile menu / stats). */
export const PROFILE_ICON_TONE = {
  background: "#ffc12c",
  foreground: "#ffffff",
} as const;

/** Desktop sidebar icon chip — muted gray. */
export const PROFILE_SIDEBAR_ICON_TONE = {
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

/** Profile form CTAs — soft pills (15px), red primary / white secondary. */
export const PROFILE_BTN_PRIMARY_CLASS =
  "h-11 !rounded-[15px] !bg-brand-red px-6 text-sm font-semibold !text-white hover:!bg-brand-red-hot focus:!ring-brand-red";

export const PROFILE_BTN_SECONDARY_CLASS =
  "h-11 !rounded-[15px] border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:ring-gray-300";

export const PROFILE_BTN_DANGER_CLASS =
  "h-11 !rounded-[15px] !bg-brand-red px-6 text-sm font-semibold !text-white hover:!bg-brand-red-hot focus:!ring-brand-red";

/** MaMarie profile mobile tab-sheet tokens. */
export const PROFILE_MOBILE_SHEET_Z_INDEX = 90;
export const PROFILE_MOBILE_SHEET_HEIGHT_VH = 72;
export const PROFILE_MOBILE_SHEET_PANEL_MS = 300;
export const PROFILE_MOBILE_SHEET_BACKDROP_MS = 300;
export const PROFILE_MOBILE_SHEET_PANEL_EASE =
  "cubic-bezier(0.32, 0.72, 0, 1)";
export const PROFILE_MOBILE_SHEET_DISMISS_DRAG_PX = 120;
export const PROFILE_MOBILE_SHEET_HANDLE_WIDTH_PX = 56;
export const PROFILE_MOBILE_SHEET_HANDLE_HEIGHT_PX = 6;
export const PROFILE_MOBILE_SHEET_DRAG_ZONE_HEIGHT_PX = 48;
export const PROFILE_MOBILE_SHEET_CONTENT_PAD_X_PX = 20;
export const PROFILE_MOBILE_SHEET_CONTENT_PAD_TOP_PX = 16;
export const PROFILE_MOBILE_SHEET_CONTENT_PAD_BOTTOM_PX = 28;

/** Strip card chrome inside the mobile sheet (MaMarie frameless sections). */
export const PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS =
  "max-lg:!rounded-none max-lg:!border-transparent max-lg:!p-0 max-lg:!shadow-none max-lg:!ring-0";
