"use client";

import { useSyncExternalStore } from "react";

/** Matches Tailwind `lg` (`--breakpoint-lg: 1025px`). */
export const DESKTOP_CHROME_MQ = "(min-width: 1025px)";

function subscribeDesktopChrome(onChange: () => void): () => void {
  const mq = window.matchMedia(DESKTOP_CHROME_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getDesktopChromeSnapshot(): boolean {
  return window.matchMedia(DESKTOP_CHROME_MQ).matches;
}

/** SSR and first paint are mobile so coins keep the sheet URL. */
export function useDesktopChrome(): boolean {
  return useSyncExternalStore(
    subscribeDesktopChrome,
    getDesktopChromeSnapshot,
    () => false,
  );
}
