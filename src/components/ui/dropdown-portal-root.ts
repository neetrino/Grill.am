const DESKTOP_LAYOUT_DESIGN_WIDTH_PX = 1440;
const DESKTOP_FLUID_MQ = "(min-width: 1024px)";

/**
 * Same scale as `DesktopFluidFrame` zoom (`100vw / 1440` on lg+).
 */
export function getDesktopLayoutScale(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  if (!window.matchMedia(DESKTOP_FLUID_MQ).matches) {
    return 1;
  }
  const stage = document.querySelector(".desktop-fluid-stage");
  if (stage instanceof HTMLElement) {
    const width = stage.getBoundingClientRect().width;
    if (width > 0) {
      return width / DESKTOP_LAYOUT_DESIGN_WIDTH_PX;
    }
  }
  return window.innerWidth / DESKTOP_LAYOUT_DESIGN_WIDTH_PX;
}

/**
 * Portal target for storefront overlays. Prefer the zoomed fluid stage so
 * dropdowns share the same visual scale as the rest of the desktop canvas.
 */
export function getDropdownPortalRoot(): HTMLElement {
  if (typeof document === "undefined") {
    throw new Error("getDropdownPortalRoot requires a document");
  }
  if (!window.matchMedia(DESKTOP_FLUID_MQ).matches) {
    return document.body;
  }
  return (
    document.querySelector<HTMLElement>(".desktop-fluid-stage") ??
    document.body
  );
}

export function isDesktopFluidActive(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(DESKTOP_FLUID_MQ).matches &&
    document.querySelector(".desktop-fluid-stage") != null
  );
}

export type FluidPortalBox = {
  top: number;
  left: number;
  width: number;
  viewportWidth: number;
};

/**
 * Maps a trigger's viewport rect into portal layout coordinates
 * (pre-zoom space when DesktopFluidFrame is active).
 * Values are viewport-relative for `position: fixed` panels.
 */
export function mapTriggerRectToPortalBox(rect: DOMRect): FluidPortalBox {
  if (isDesktopFluidActive()) {
    const scale = getDesktopLayoutScale();
    if (scale > 0) {
      return {
        top: rect.bottom / scale,
        left: rect.left / scale,
        width: rect.width / scale,
        viewportWidth: window.innerWidth / scale,
      };
    }
  }

  return {
    top: rect.bottom,
    left: rect.left,
    width: rect.width,
    viewportWidth: window.innerWidth,
  };
}
