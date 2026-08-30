/**
 * Admin new-order polling must not run in a background tab.
 * A visible cashier tab still gets sound; a hidden Orders tab does not hit Neon.
 */
export function shouldPollNewOrderAlerts(
  visibilityState: DocumentVisibilityState,
): boolean {
  return visibilityState === "visible";
}
