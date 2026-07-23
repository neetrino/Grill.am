/** Hard cap on how many popup rows may exist. */
export const MAX_POPUPS = 4;

export type PopupRuleError = "MAX_POPUPS_REACHED" | "IMAGE_REQUIRED";

/** Returns an error when creating would exceed the popup limit. */
export function validatePopupCreateCount(currentCount: number): PopupRuleError | null {
  if (currentCount >= MAX_POPUPS) {
    return "MAX_POPUPS_REACHED";
  }
  return null;
}

export function popupRuleErrorMessage(code: PopupRuleError): string {
  switch (code) {
    case "MAX_POPUPS_REACHED":
      return `You can create at most ${MAX_POPUPS} popups.`;
    case "IMAGE_REQUIRED":
      return "An image is required.";
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
