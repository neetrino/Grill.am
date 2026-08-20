/** Shared centered-modal motion (delete confirm + future dialogs). */

export const APP_MODAL_PANEL_OUT_MS = 280;
/** Slightly above out duration so unmount still happens if `animationend` is missed. */
export const APP_MODAL_EXIT_FALLBACK_MS = APP_MODAL_PANEL_OUT_MS + 40;

/** Above SideSheet (200) and dropdown portals (400). */
export const APP_MODAL_Z_INDEX = 500;

export const APP_MODAL_BACKDROP_IN_CLASS = "animate-app-modal-backdrop-in";
export const APP_MODAL_BACKDROP_OUT_CLASS = "animate-app-modal-backdrop-out";
export const APP_MODAL_PANEL_IN_CLASS = "animate-app-modal-panel-in";
export const APP_MODAL_PANEL_OUT_CLASS = "animate-app-modal-panel-out";

/** Animation name substring used by `onAnimationEnd` to finish exit. */
export const APP_MODAL_PANEL_OUT_ANIMATION_NAME = "app-modal-panel-out";
