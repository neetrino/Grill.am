import {
  ADMIN_FIELD_CLASS,
  ADMIN_TEXTAREA_FIELD_CLASS,
} from "@/features/admin/ui/admin-ui";

/** Shared admin form control styles (MaMarie layout, Grill colors). */
export const ADMIN_LABEL =
  "mb-1 block text-sm font-medium text-gray-700";

/** Field wrapper (`<label>` / field group) — block so stack gaps apply. */
export const ADMIN_FIELD = "block";

/** Vertical stack for sheet / admin forms (gap works with any child display). */
export const ADMIN_FORM_STACK = "flex flex-col gap-4";

export const ADMIN_INPUT = ADMIN_FIELD_CLASS;

export const ADMIN_TEXTAREA = ADMIN_TEXTAREA_FIELD_CLASS;

export const ADMIN_PAGE_TITLE =
  "text-[26px] leading-tight font-black uppercase sm:text-[30px] sm:leading-[1.2]";

export const ADMIN_PAGE_SUBTITLE = "text-sm text-gray-600";

export const ADMIN_SECTION_TITLE = "text-xl font-semibold text-gray-900";

/** Filter-bar text input (search). */
export const ADMIN_FILTER_INPUT = ADMIN_FIELD_CLASS;
