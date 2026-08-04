let lockCount = 0;
let previousBodyOverflow = "";
let previousHtmlOverflow = "";

/** Locks page scroll without resetting scroll position. */
export function lockBodyScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (lockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  lockCount += 1;
}

/** Restores page scroll when the last lock is released. */
export function unlockBodyScroll(): void {
  if (typeof document === "undefined") {
    return;
  }

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) {
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousHtmlOverflow;
}
