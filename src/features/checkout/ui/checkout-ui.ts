/** Checkout layout/visual tokens — MaMarie structure, Grill brand colors. */

export const CHECKOUT_PAGE_BG = "#f1f1f3";
export const CHECKOUT_PAGE_BG_DESKTOP = "#ffffff";

export const CHECKOUT_SECTION_CARD_CLASS =
  "rounded-3xl border border-gray-200 bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-7";

export const CHECKOUT_SECTION_TITLE_CLASS =
  "text-lg font-bold tracking-tight text-gray-900";

export const CHECKOUT_FIELD_CLASS =
  "h-11 w-full rounded-[15px] border border-gray-200 bg-white px-3 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15 disabled:bg-gray-50";

export const CHECKOUT_OPTION_BASE_CLASS =
  "flex cursor-pointer items-center rounded-[15px] border-2 p-4 outline-none transition-all [-webkit-tap-highlight-color:transparent] focus-within:outline-none";

/** Compact option row for side-by-side method toggles. */
export const CHECKOUT_OPTION_COMPACT_CLASS =
  "flex h-full cursor-pointer items-center rounded-[15px] border-2 px-3 py-2.5 outline-none transition-all [-webkit-tap-highlight-color:transparent] focus-within:outline-none";

const CHECKOUT_SCROLLBAR_HIDDEN_CLASS =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Six compact branch rows; extra branches scroll without a visible scrollbar. */
export const CHECKOUT_PICKUP_BRANCH_LIST_CLASS =
  `max-h-[13.5rem] divide-y divide-gray-100 overflow-y-auto overscroll-contain rounded-[15px] border border-gray-200 ${CHECKOUT_SCROLLBAR_HIDDEN_CLASS}`;

export const CHECKOUT_PICKUP_BRANCH_ROW_CLASS =
  "flex cursor-pointer items-center px-3 py-2 outline-none transition-colors [-webkit-tap-highlight-color:transparent] focus-within:bg-gray-50";

export const CHECKOUT_PICKUP_BRANCH_ROW_SELECTED_CLASS = "bg-brand-red/10";

export const CHECKOUT_PICKUP_BRANCH_ROW_DEFAULT_CLASS = "hover:bg-gray-50";

export const CHECKOUT_PICKUP_TRIGGER_CLASS =
  "flex h-11 w-full items-center gap-3 rounded-[15px] border border-gray-200 bg-white px-3 text-left text-gray-900 outline-none transition hover:bg-gray-50 focus-visible:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red/15 disabled:bg-gray-50";

export const CHECKOUT_OPTION_SELECTED_CLASS =
  "border-brand-red bg-brand-red/10";

export const CHECKOUT_OPTION_DEFAULT_CLASS =
  "border-gray-200 hover:bg-gray-50/80";

export const CHECKOUT_ALERT_CLASS = "rounded-[15px]";

export const CHECKOUT_PRIMARY_BUTTON_CLASS =
  "inline-flex h-[50px] w-full items-center justify-center rounded-full bg-brand-red px-4 text-sm font-semibold text-white transition hover:bg-brand-red-hot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-50";

export const CHECKOUT_ORDER_SUMMARY_WRAP_CLASS =
  "w-full lg:sticky lg:top-[152px] lg:self-start lg:w-max lg:max-w-full";

export const CHECKOUT_ORDER_ITEMS_PREVIEW_CARD_CLASS =
  "mb-6 rounded-[15px] border border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5";

export const CHECKOUT_ORDER_ITEM_CARD_CLASS =
  "w-max max-w-[320px] min-w-[200px] shrink-0 rounded-[20px] border border-gray-200 bg-white p-3 shadow-sm";
