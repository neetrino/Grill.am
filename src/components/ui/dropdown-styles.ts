/**
 * Shared dropdown list styles — checkout city picker look for the whole site.
 * Visual tokens live in `globals.css` (`.dropdown-panel`, `.dropdown-option`).
 */

export const DROPDOWN_ANIMATION_MS = 150;
export const DROPDOWN_GAP_PX = 6;
export const DROPDOWN_MAX_HEIGHT_PX = 220;
/** Above SideSheet / drawers (z-200) and header overlays. */
export const DROPDOWN_PORTAL_Z_INDEX = 400;

/** Panel surface + scroll (anchored under trigger or portal). */
export const DROPDOWN_PANEL_CLASS = "dropdown-panel";

/** Absolute panel under a relative trigger (no portal). */
export const DROPDOWN_PANEL_ANCHORED_CLASS =
  "dropdown-panel dropdown-panel--anchored";

/** Fixed portal panel — set position via `dropdownPortalStyle()`. */
export const DROPDOWN_PANEL_PORTAL_CLASS =
  "dropdown-panel dropdown-panel--portal";

export const DROPDOWN_PANEL_OPEN_CLASS =
  "pointer-events-auto translate-y-0 opacity-100";

export const DROPDOWN_PANEL_CLOSED_CLASS =
  "pointer-events-none -translate-y-1 opacity-0";

export const DROPDOWN_OPTION_CLASS = "dropdown-option";

export const DROPDOWN_OPTION_SELECTED_CLASS = "dropdown-option--selected";

export type DropdownPortalPosition = {
  /** Distance from viewport top (mutually exclusive with `bottom`). */
  top?: number;
  /** Distance from viewport bottom (opens upward). */
  bottom?: number;
  /** Distance from viewport left (mutually exclusive with `right`). */
  left?: number;
  /** Distance from viewport right — prefer for right-aligned menus. */
  right?: number;
  minWidth?: number;
  maxWidth?: number;
};

/**
 * Portal position via CSS variables (no raw top/left/maxHeight inline styles).
 */
export function dropdownPortalStyle(
  position: DropdownPortalPosition,
): Record<string, string> {
  const style: Record<string, string> = {};
  if (position.top != null) {
    style["--dropdown-top"] = `${position.top}px`;
  }
  if (position.bottom != null) {
    style["--dropdown-bottom"] = `${position.bottom}px`;
  }
  if (position.left != null) {
    style["--dropdown-left"] = `${position.left}px`;
  }
  if (position.right != null) {
    style["--dropdown-right"] = `${position.right}px`;
  }
  if (position.minWidth != null) {
    style["--dropdown-min-width"] = `${position.minWidth}px`;
  }
  if (position.maxWidth != null) {
    style["--dropdown-max-width"] = `${position.maxWidth}px`;
  }
  return style;
}

export function dropdownPanelStateClass(expanded: boolean): string {
  return expanded ? DROPDOWN_PANEL_OPEN_CLASS : DROPDOWN_PANEL_CLOSED_CLASS;
}

export function dropdownOptionClass(selected: boolean): string {
  return selected
    ? `${DROPDOWN_OPTION_CLASS} ${DROPDOWN_OPTION_SELECTED_CLASS}`
    : DROPDOWN_OPTION_CLASS;
}
