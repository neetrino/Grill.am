"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

import {
  DROPDOWN_GAP_PX,
  DROPDOWN_MAX_HEIGHT_PX,
  dropdownVerticalPosition,
  type DropdownPlacement,
  type DropdownPortalPosition,
} from "@/components/ui/dropdown-styles";

const VIEWPORT_PADDING_PX = 16;

type UseDropdownPortalPositionOptions = {
  /** Use trigger width as min (and optionally max) width. */
  matchTriggerWidth?: boolean;
  /** Also clamp max width to the trigger width. */
  lockTriggerWidth?: boolean;
  gapPx?: number;
  align?: "left" | "right";
  /** Flip up when below does not fit (default), or pin to one side. */
  placement?: DropdownPlacement | "auto";
  /** Panel height used by `placement: "auto"` to decide whether it fits. */
  panelHeightPx?: number;
  /**
   * Minimum panel width enforced by CSS. Keeps the horizontal clamp correct
   * for panels that are wider than their trigger.
   */
  panelWidthPx?: number;
  /**
   * When set, remeasures the mounted panel and reclamps against the real
   * height (taller calendars / dynamic content).
   */
  panelRef?: RefObject<HTMLElement | null>;
  /**
   * When false, never apply max-height (no inner scroll). Default true.
   */
  shrinkToFit?: boolean;
};

/**
 * Positions a fixed portal dropdown under/above a trigger; tracks scroll/resize.
 * Coordinates are viewport-relative so sticky header menus stay under the
 * trigger after scroll.
 */
export function useDropdownPortalPosition(
  active: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options: UseDropdownPortalPositionOptions = {},
): DropdownPortalPosition | null {
  const {
    matchTriggerWidth = true,
    lockTriggerWidth = false,
    gapPx = DROPDOWN_GAP_PX,
    align = "left",
    placement = "auto",
    panelHeightPx = DROPDOWN_MAX_HEIGHT_PX,
    panelWidthPx = 0,
    panelRef,
    shrinkToFit = true,
  } = options;
  const [position, setPosition] = useState<DropdownPortalPosition | null>(null);

  useLayoutEffect(() => {
    if (!active) {
      return;
    }

    function updatePosition(): void {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const measuredHeight = panelRef?.current?.getBoundingClientRect().height;
      // Prefer the configured estimate so max-height clamping does not
      // shrink-measure-loop. Upgrade only when content is taller.
      const effectiveHeight =
        measuredHeight != null && measuredHeight > panelHeightPx
          ? measuredHeight
          : panelHeightPx;

      const rect = trigger.getBoundingClientRect();
      const available = window.innerWidth - VIEWPORT_PADDING_PX * 2;
      const minWidth = matchTriggerWidth
        ? Math.min(Math.max(rect.width, 0), available)
        : undefined;
      const maxWidth = lockTriggerWidth ? minWidth : undefined;
      const clampWidth = Math.max(minWidth ?? 0, panelWidthPx);

      const horizontal =
        align === "right"
          ? {
              right: Math.max(
                VIEWPORT_PADDING_PX,
                window.innerWidth - rect.right,
              ),
            }
          : {
              left: Math.max(
                VIEWPORT_PADDING_PX,
                Math.min(
                  rect.left,
                  window.innerWidth - VIEWPORT_PADDING_PX - clampWidth,
                ),
              ),
            };

      const vertical = dropdownVerticalPosition({
        placement,
        panelHeightPx: effectiveHeight,
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
        viewportHeight: window.innerHeight,
        gapPx,
        paddingPx: VIEWPORT_PADDING_PX,
        shrinkToFit,
      });

      setPosition({
        ...vertical,
        ...horizontal,
        minWidth,
        maxWidth,
        ...(shrinkToFit === false ? { maxHeight: "none" } : {}),
      });
    }

    updatePosition();
    // Remeasure after paint once the panel exists (actual height).
    const rafId = window.requestAnimationFrame(updatePosition);

    const panel = panelRef?.current;
    let resizeObserver: ResizeObserver | null = null;
    if (panel != null && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updatePosition());
      resizeObserver.observe(panel);
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [
    active,
    align,
    gapPx,
    lockTriggerWidth,
    matchTriggerWidth,
    panelHeightPx,
    panelRef,
    panelWidthPx,
    placement,
    shrinkToFit,
    triggerRef,
  ]);

  // Ignore stale measurements once inactive instead of resetting state
  // synchronously inside the effect.
  return active ? position : null;
}
