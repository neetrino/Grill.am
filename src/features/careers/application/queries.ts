import "server-only";

import { and, asc, desc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getDb } from "@/db/client";
import { jobPostings, mediaAssets } from "@/db/schema";
import {
  resolveJobTranslation,
  type JobEmploymentType,
  type JobLocaleCopy,
  type JobPostingStatus,
  type JobTranslations,
} from "@/features/careers/domain/job-rules";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { isCurrency } from "@/lib/money/currency";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type AdminJobPosting = typeof jobPostings.$inferSelect;

export type AdminJobListItem = {
  id: string;
  status: JobPostingStatus;
  employmentType: JobEmploymentType;
  salaryAmount: number | null;
  salaryCurrency: Currency;
  sortOrder: number;
  publishedAt: string | null;
  title: string;
  summary: string;
  slug: string;
  path: string;
  location: string;
  coverUrl: string | null;
  translations: JobTranslations;
};

export type StorefrontJobListItem = {
  id: string;
  employmentType: JobEmploymentType;
  salaryAmount: number | null;
  salaryCurrency: Currency;
  publishedAt: string | null;
  coverUrl: string | null;
  copy: JobLocaleCopy;
};

export type StorefrontJobPosting = StorefrontJobListItem;

function toPublishedAtIso(value: Date | string | null): string | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function resolveCurrency(value: string): Currency {
  return isCurrency(value) ? value : "AMD";
}

async function loadJobCoverUrls(
  jobPostingIds: string[],
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  if (jobPostingIds.length === 0) {
    return images;
  }

  const mediaRows = await getDb()
    .select({
      jobPostingId: mediaAssets.jobPostingId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.jobPostingId, jobPostingIds),
        eq(mediaAssets.uploadStatus, "READY"),
        or(
          eq(mediaAssets.isPrimary, true),
          eq(mediaAssets.role, "COVER"),
          eq(mediaAssets.role, "PRIMARY"),
        ),
      ),
    );

  for (const media of mediaRows) {
    if (!media.jobPostingId || images.has(media.jobPostingId)) continue;
    images.set(media.jobPostingId, mediaPublicUrl(media.objectKey));
  }

  return images;
}

/** Lists all non-deleted job postings for admin UI. */
export async function listAdminJobPostings(
  locale: Locale,
): Promise<AdminJobListItem[]> {
  const rows = await getDb()
    .select()
    .from(jobPostings)
    .where(isNull(jobPostings.deletedAt))
    .orderBy(
      asc(jobPostings.sortOrder),
      desc(jobPostings.updatedAt),
      desc(jobPostings.createdAt),
    );

  const images = await loadJobCoverUrls(rows.map((row) => row.id));

  return rows.map((row) => {
    const copy = resolveJobTranslation(row.translations, locale);
    const slug = copy?.slug ?? "";
    return {
      id: row.id,
      status: row.status,
      employmentType: row.employmentType,
      salaryAmount: row.salaryAmount,
      salaryCurrency: resolveCurrency(row.salaryCurrency),
      sortOrder: row.sortOrder,
      publishedAt: toPublishedAtIso(row.publishedAt)?.slice(0, 10) ?? null,
      title: copy?.title ?? "Untitled",
      summary: copy?.summary ?? "",
      slug,
      path: slug ? `/careers/${slug}` : "/careers",
      location: copy?.location ?? "",
      coverUrl: images.get(row.id) ?? null,
      translations: row.translations,
    };
  });
}

async function loadActiveJobPostings(
  locale: Locale,
): Promise<StorefrontJobListItem[]> {
  const rows = await getDb()
    .select()
    .from(jobPostings)
    .where(
      and(
        eq(jobPostings.status, "ACTIVE"),
        isNull(jobPostings.deletedAt),
        isNotNull(jobPostings.publishedAt),
      ),
    )
    .orderBy(
      asc(jobPostings.sortOrder),
      desc(jobPostings.publishedAt),
      desc(jobPostings.createdAt),
    );

  const images = await loadJobCoverUrls(rows.map((row) => row.id));

  return rows
    .map((row) => {
      const copy = resolveJobTranslation(row.translations, locale);
      if (!copy) {
        return null;
      }
      return {
        id: row.id,
        employmentType: row.employmentType,
        salaryAmount: row.salaryAmount,
        salaryCurrency: resolveCurrency(row.salaryCurrency),
        publishedAt: toPublishedAtIso(row.publishedAt),
        coverUrl: images.get(row.id) ?? null,
        copy,
      };
    })
    .filter((row): row is StorefrontJobListItem => row !== null);
}

/** Active job postings visible on the storefront for a locale. */
export async function listActiveJobPostings(
  locale: Locale,
): Promise<StorefrontJobListItem[]> {
  return unstable_cache(
    async () => loadActiveJobPostings(locale),
    ["active-job-postings", locale],
    {
      tags: [CACHE_TAGS.careers],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

function jobSlugMatchesAnyLocale(slug: string) {
  return or(
    ...locales.map(
      (loc) => sql`${jobPostings.translations}->${loc}->>'slug' = ${slug}`,
    ),
  );
}

async function loadActiveJobPostingBySlug(
  locale: Locale,
  slug: string,
): Promise<StorefrontJobPosting | null> {
  const [row] = await getDb()
    .select()
    .from(jobPostings)
    .where(
      and(
        eq(jobPostings.status, "ACTIVE"),
        isNull(jobPostings.deletedAt),
        isNotNull(jobPostings.publishedAt),
        jobSlugMatchesAnyLocale(slug),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const copy = resolveJobTranslation(row.translations, locale);
  if (!copy) {
    return null;
  }

  const images = await loadJobCoverUrls([row.id]);

  return {
    id: row.id,
    employmentType: row.employmentType,
    salaryAmount: row.salaryAmount,
    salaryCurrency: resolveCurrency(row.salaryCurrency),
    publishedAt: toPublishedAtIso(row.publishedAt),
    coverUrl: images.get(row.id) ?? null,
    copy,
  };
}

/**
 * Loads one active job posting by slug.
 * Accepts any locale's slug so language switching can resolve the same posting.
 */
export const getActiveJobPostingBySlug = cache(
  async (
    locale: Locale,
    slug: string,
  ): Promise<StorefrontJobPosting | null> => {
    return unstable_cache(
      async () => loadActiveJobPostingBySlug(locale, slug),
      ["active-job-posting", locale, slug],
      {
        tags: [CACHE_TAGS.jobPostingSlug(locale, slug)],
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
      },
    )();
  },
);
