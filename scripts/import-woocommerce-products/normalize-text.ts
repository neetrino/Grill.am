import { sanitizeBlogHtml } from "@/lib/sanitize/html";

import { FIELD_LIMITS } from "./constants";

const SHORTCODE_REGEX = /\[[^\]]*]/g;

/** Normalizes WooCommerce description text for grill.am storage. */
export function normalizeDescriptionText(
  raw: string,
  maxLength: number,
): { value: string | null; truncated: boolean } {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/\\n/g, "\n");
  text = text.replace(SHORTCODE_REGEX, "");
  text = sanitizeBlogHtml(text).trim();

  if (!text) {
    return { value: null, truncated: false };
  }

  if (text.length <= maxLength) {
    return { value: text, truncated: false };
  }

  return { value: text.slice(0, maxLength), truncated: true };
}

export function normalizeTitle(raw: string): {
  value: string;
  truncated: boolean;
} {
  const title = raw.replace(/\s+/g, " ").trim();
  if (title.length <= FIELD_LIMITS.title) {
    return { value: title, truncated: false };
  }
  return {
    value: title.slice(0, FIELD_LIMITS.title),
    truncated: true,
  };
}

export function normalizeSeoDescription(raw: string): {
  value: string | null;
  truncated: boolean;
} {
  return normalizeDescriptionText(raw, FIELD_LIMITS.seoDescription);
}
