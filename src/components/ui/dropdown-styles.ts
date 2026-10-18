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

/** Option with a leading icon: row layout instead of the default block. */
export const DROPDOWN_OPTION_ROW_CLASS = "dropdown-option--row";

export const DROPDOWN_OPTION_SELECTED_CLASS = "dropdown-option--selected";

export type DropdownPlacement = "bottom" | "top";

export type ResolveDropdownPlacementInput = {
  /** `"auto"` flips the panel above the trigger when it overflows below. */
  placement: DropdownPlacement | "auto";
  /** Expected panel height (usually its max height, since panels scroll). */
  panelHeightPx: number;
  triggerTop: number;
  triggerBottom: number;
  viewportHeight: number;
  gapPx: number;
  paddingPx: number;
  /**
   * When false, keep the panel's natural height (no max-height shrink/scroll)
   * and only clamp its `top` into the viewport.
   */
  shrinkToFit?: boolean;
};

/** Picks the side an `auto` panel opens to, based on free viewport space. */
function resolveDropdownPlacement({
  placement,
  panelHeightPx,
  triggerTop,
  triggerBottom,
  viewportHeight,
  gapPx,
  paddingPx,
}: ResolveDropdownPlacementInput): DropdownPlacement {
  if (placement !== "auto") {
    return placement;
  }

  const spaceBelow = viewportHeight - triggerBottom - gapPx - paddingPx;
  const spaceAbove = triggerTop - gapPx - paddingPx;
  return spaceBelow < panelHeightPx && spaceAbove > spaceBelow
    ? "top"
    : "bottom";
}

/**
 * Viewport-relative vertical offsets for a fixed panel. The panel is flipped
 * above the trigger when it would not fit below, then clamped so it stays
 * inside the viewport. Optionally shrinks with max-height when space is tight.
 */
export function dropdownVerticalPosition(
  input: ResolveDropdownPlacementInput,
): { top?: number; bottom?: number; maxHeight?: string } {
  const {
    panelHeightPx,
    triggerTop,
    triggerBottom,
    viewportHeight,
    gapPx,
    paddingPx,
    shrinkToFit = true,
  } = input;

  const usableHeight = Math.max(120, viewportHeight - paddingPx * 2);
  const height =
    shrinkToFit === false
      ? panelHeightPx
      : Math.min(panelHeightPx, usableHeight);
  const placement = resolveDropdownPlacement(input);

  let top =
    placement === "top"
      ? triggerTop - gapPx - height
      : triggerBottom + gapPx;

  const maxTop = viewportHeight - paddingPx - height;
  top = Math.min(Math.max(top, paddingPx), Math.max(paddingPx, maxTop));

  return {
    top,
    ...(shrinkToFit !== false && height < panelHeightPx
      ? { maxHeight: `${height}px` }
      : {}),
  };
}

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
  /** Overrides `--dropdown-max-height` (e.g. `"none"`). */
  maxHeight?: string;
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
  if (position.maxHeight != null) {
    style["--dropdown-max-height"] = position.maxHeight;
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
