import {
  ADMIN_FIELD_CLASS,
  ADMIN_TEXTAREA_FIELD_CLASS,
} from "@/features/admin/ui/admin-ui";

/** Shared admin form control styles (MaMarie layout, Grill colors). */
export const ADMIN_LABEL =
  "mb-1 block text-sm font-medium text-gray-700";

export const ADMIN_INPUT = ADMIN_FIELD_CLASS;

/**
 * Native select — look from global `select` / `.dropdown-native` rules
 * (checkout city picker). Do not add rounded-md / blue focus utilities here.
 */
export const ADMIN_SELECT = "dropdown-native w-full text-sm";

export const ADMIN_TEXTAREA = ADMIN_TEXTAREA_FIELD_CLASS;

export const ADMIN_PAGE_TITLE = "text-2xl font-semibold text-gray-900";

export const ADMIN_PAGE_SUBTITLE = "text-sm text-gray-600";

export const ADMIN_SECTION_TITLE = "text-xl font-semibold text-gray-900";

/** Compact filter-bar select (same global dropdown look). */
export const ADMIN_FILTER_SELECT = "dropdown-native text-sm";

/** Filter-bar text input (search). */
export const ADMIN_FILTER_INPUT = ADMIN_FIELD_CLASS;
