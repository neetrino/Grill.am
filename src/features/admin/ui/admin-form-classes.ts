/** Shared admin form control styles (supersudo-aligned). */
export const ADMIN_LABEL =
  "mb-1 block text-sm font-medium text-gray-700";

export const ADMIN_INPUT =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

/**
 * Native select — look from global `select` / `.dropdown-native` rules
 * (checkout city picker). Do not add rounded-md / blue focus utilities here.
 */
export const ADMIN_SELECT = "dropdown-native w-full text-sm";

export const ADMIN_TEXTAREA = `${ADMIN_INPUT} min-h-[100px] resize-y`;

export const ADMIN_PAGE_TITLE = "text-2xl font-semibold text-gray-900";

export const ADMIN_PAGE_SUBTITLE = "text-sm text-gray-600";

export const ADMIN_SECTION_TITLE = "text-xl font-semibold text-gray-900";

/** Compact filter-bar select (same global dropdown look). */
export const ADMIN_FILTER_SELECT = "dropdown-native text-sm";

/** Filter-bar text input (search). */
export const ADMIN_FILTER_INPUT =
  "h-11 rounded-[15px] border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15";
