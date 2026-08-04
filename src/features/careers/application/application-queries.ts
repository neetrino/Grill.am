import "server-only";

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import { jobApplications, jobPostings } from "@/db/schema";
import {
  resolveJobTranslation,
  type JobTranslations,
} from "@/features/careers/domain/job-rules";
import type { AdminJobApplicationFilter } from "@/features/careers/schemas/application";
import type { Locale } from "@/lib/i18n/config";

const PAGE_SIZE = 20;

export type AdminJobApplicationListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  jobPostingId: string;
  jobTitle: string;
  hasCv: boolean;
  createdAt: Date;
};

export type AdminJobApplicationDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  jobPostingId: string;
  jobTitle: string;
  cvObjectKey: string;
  cvFileName: string;
  cvMimeType: string;
  cvByteSize: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminJobFilterOption = {
  id: string;
  title: string;
};

function resolveJobTitle(
  translations: JobTranslations,
  locale: Locale,
): string {
  const copy = resolveJobTranslation(translations, locale);
  return copy?.title.trim() || "—";
}

/** Lists job applications for the admin Careers inbox. */
export async function listAdminJobApplications(
  locale: Locale,
  filters: AdminJobApplicationFilter,
): Promise<{
  rows: AdminJobApplicationListItem[];
  total: number;
  pageSize: number;
}> {
  const conditions: SQL[] = [];

  if (filters.status) {
    conditions.push(eq(jobApplications.status, filters.status));
  }

  if (filters.jobPostingId) {
    conditions.push(eq(jobApplications.jobPostingId, filters.jobPostingId));
  }

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(jobApplications.name, pattern),
        ilike(jobApplications.email, pattern),
        ilike(jobApplications.phone, pattern),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select({
        id: jobApplications.id,
        name: jobApplications.name,
        email: jobApplications.email,
        phone: jobApplications.phone,
        status: jobApplications.status,
        jobPostingId: jobApplications.jobPostingId,
        createdAt: jobApplications.createdAt,
        cvObjectKey: jobApplications.cvObjectKey,
        translations: jobPostings.translations,
      })
      .from(jobApplications)
      .innerJoin(
        jobPostings,
        eq(jobApplications.jobPostingId, jobPostings.id),
      )
      .where(where)
      .orderBy(desc(jobApplications.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb()
      .select({ value: count() })
      .from(jobApplications)
      .innerJoin(
        jobPostings,
        eq(jobApplications.jobPostingId, jobPostings.id),
      )
      .where(where),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      status: row.status,
      jobPostingId: row.jobPostingId,
      jobTitle: resolveJobTitle(row.translations, locale),
      hasCv: Boolean(row.cvObjectKey),
      createdAt: row.createdAt,
    })),
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Loads one job application by id for admin detail. */
export async function getAdminJobApplicationById(
  locale: Locale,
  id: string,
): Promise<AdminJobApplicationDetail | null> {
  const [row] = await getDb()
    .select({
      id: jobApplications.id,
      name: jobApplications.name,
      email: jobApplications.email,
      phone: jobApplications.phone,
      message: jobApplications.message,
      status: jobApplications.status,
      jobPostingId: jobApplications.jobPostingId,
      cvObjectKey: jobApplications.cvObjectKey,
      cvFileName: jobApplications.cvFileName,
      cvMimeType: jobApplications.cvMimeType,
      cvByteSize: jobApplications.cvByteSize,
      createdAt: jobApplications.createdAt,
      updatedAt: jobApplications.updatedAt,
      translations: jobPostings.translations,
    })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
    .where(eq(jobApplications.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    jobPostingId: row.jobPostingId,
    jobTitle: resolveJobTitle(row.translations, locale),
    cvObjectKey: row.cvObjectKey,
    cvFileName: row.cvFileName,
    cvMimeType: row.cvMimeType,
    cvByteSize: row.cvByteSize,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Job posting options for the applications filter. */
export async function listAdminJobApplicationJobOptions(
  locale: Locale,
): Promise<AdminJobFilterOption[]> {
  const rows = await getDb()
    .select({
      id: jobPostings.id,
      translations: jobPostings.translations,
    })
    .from(jobPostings)
    .orderBy(desc(jobPostings.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: resolveJobTitle(row.translations, locale),
  }));
}
