import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { isCurrency } from "@/lib/money/currency";

export const JOB_POSTING_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export type JobPostingStatus = (typeof JOB_POSTING_STATUSES)[number];

export const JOB_EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
] as const;

export type JobEmploymentType = (typeof JOB_EMPLOYMENT_TYPES)[number];

export type JobLocaleCopy = {
  title: string;
  slug: string;
  summary?: string;
  description: string;
  location?: string;
};

export type JobTranslations = Partial<Record<Locale, JobLocaleCopy>>;

export type JobRuleError =
  | "TITLE_REQUIRED"
  | "SLUG_REQUIRED"
  | "DESCRIPTION_REQUIRED"
  | "INVALID_SLUG"
  | "INVALID_CURRENCY";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isJobPostingStatus(value: string): value is JobPostingStatus {
  return (JOB_POSTING_STATUSES as readonly string[]).includes(value);
}

export function isJobEmploymentType(value: string): value is JobEmploymentType {
  return (JOB_EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export function isActiveJobPosting(status: JobPostingStatus): boolean {
  return status === "ACTIVE";
}

/** Lowercases and hyphenates a slug for storage and lookup. */
export function normalizeJobSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function validateJobLocaleCopy(
  copy: JobLocaleCopy,
): JobRuleError | null {
  if (!copy.title.trim()) {
    return "TITLE_REQUIRED";
  }

  const slug = normalizeJobSlug(copy.slug);
  if (!slug) {
    return "SLUG_REQUIRED";
  }

  if (!SLUG_PATTERN.test(slug)) {
    return "INVALID_SLUG";
  }

  if (!copy.description.trim()) {
    return "DESCRIPTION_REQUIRED";
  }

  return null;
}

/**
 * Applies one shared slug to every present locale copy.
 * Careers URLs use a single slug across hy/en/ru.
 */
export function withSharedJobSlug(
  translations: JobTranslations,
  slug: string,
): JobTranslations {
  const normalized = normalizeJobSlug(slug);
  const next: JobTranslations = {};
  for (const locale of Object.keys(translations) as Locale[]) {
    const copy = translations[locale];
    if (!copy) continue;
    next[locale] = { ...copy, slug: normalized };
  }
  return next;
}

/** Resolves the shared job slug from any available locale copy. */
export function resolveSharedJobSlug(
  translations: JobTranslations | null | undefined,
): string {
  if (!translations) return "";
  const copy =
    translations.en ?? translations.hy ?? translations.ru ?? null;
  return copy ? normalizeJobSlug(copy.slug) : "";
}

export function validateJobTranslations(
  translations: JobTranslations,
): JobRuleError | null {
  const locales = Object.keys(translations) as Locale[];
  if (locales.length === 0) {
    return "TITLE_REQUIRED";
  }

  const sharedSlug = resolveSharedJobSlug(translations);
  if (!sharedSlug) {
    return "SLUG_REQUIRED";
  }
  if (!SLUG_PATTERN.test(sharedSlug)) {
    return "INVALID_SLUG";
  }

  for (const locale of locales) {
    const copy = translations[locale];
    if (!copy) {
      continue;
    }
    const error = validateJobLocaleCopy({
      ...copy,
      slug: sharedSlug,
    });
    if (error) {
      return error;
    }
  }

  return null;
}

export function validateJobSalaryCurrency(
  currency: string,
): JobRuleError | null {
  if (!isCurrency(currency)) {
    return "INVALID_CURRENCY";
  }
  return null;
}

export function jobRuleErrorMessage(code: JobRuleError): string {
  switch (code) {
    case "TITLE_REQUIRED":
      return "Title is required.";
    case "SLUG_REQUIRED":
      return "Slug is required.";
    case "DESCRIPTION_REQUIRED":
      return "Description is required.";
    case "INVALID_SLUG":
      return "Slug must use lowercase letters, numbers, and hyphens.";
    case "INVALID_CURRENCY":
      return "Salary currency is invalid.";
  }
}

/** Picks the best available job translation for a locale with fallbacks. */
export function resolveJobTranslation(
  translations: JobTranslations,
  locale: Locale,
): JobLocaleCopy | null {
  return (
    translations[locale] ??
    translations.en ??
    translations.hy ??
    translations.ru ??
    null
  );
}

export function assertJobCurrency(value: string): Currency {
  if (!isCurrency(value)) {
    throw new Error("INVALID_CURRENCY");
  }
  return value;
}
