"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  auditLogs,
  jobPostings,
  type JobTranslationsJson,
} from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  persistJobCoverImage,
  removeJobCoverImage,
} from "@/features/careers/application/persist-job-media";
import {
  jobRuleErrorMessage,
  normalizeJobSlug,
  validateJobSalaryCurrency,
  validateJobTranslations,
  withSharedJobSlug,
  type JobPostingStatus,
} from "@/features/careers/domain/job-rules";
import {
  jobPostingIdSchema,
  upsertJobPostingSchema,
  type JobPostingIdInput,
  type UpsertJobPostingFormInput,
  type UpsertJobPostingInput,
} from "@/features/careers/schemas/job";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateCareersCache } from "@/lib/cache/invalidate-public";
import { createId } from "@/lib/id";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";
import { sanitizeBlogHtml } from "@/lib/sanitize/html";

async function applyJobCoverMedia(
  postingId: string,
  locale: string,
  mediaForm: FormData | undefined,
): Promise<Result<{ id: string }> | null> {
  if (!mediaForm) {
    return null;
  }

  const image = mediaForm.get("image");
  const hasImage = image instanceof File && image.size > 0;
  const removeImage = mediaForm.get("removeImage") === "1";

  if (removeImage && !hasImage) {
    await removeJobCoverImage(postingId);
    revalidateCareers(locale, postingId);
    return null;
  }

  if (hasImage) {
    const mediaResult = await persistJobCoverImage(postingId, image);
    if (mediaResult.error) {
      return err("VALIDATION_ERROR", mediaResult.error);
    }
    revalidateCareers(locale, postingId);
  }

  return null;
}

function buildLocaleCopy(data: UpsertJobPostingInput) {
  return {
    title: data.title.trim(),
    slug: normalizeJobSlug(data.slug),
    summary: data.summary?.trim() || undefined,
    description: sanitizeBlogHtml(data.description),
    location: data.location?.trim() || undefined,
  };
}

function mergeTranslations(
  existing: JobTranslationsJson | null | undefined,
  editingLocale: Locale,
  data: UpsertJobPostingInput,
): JobTranslationsJson {
  const copy = buildLocaleCopy(data);
  const merged = {
    ...(existing ?? {}),
    [editingLocale]: copy,
  };
  return withSharedJobSlug(merged, copy.slug);
}

function parsePublishedAt(
  value: string | null | undefined,
  status: JobPostingStatus,
): Date | null {
  if (value) {
    const parsed = new Date(`${value}T12:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (status === "ACTIVE") {
    return new Date();
  }
  return null;
}

function revalidateCareers(
  locale: string,
  postingId?: string,
  slug?: string,
): void {
  revalidatePath(`/${locale}/admin/careers`);
  for (const loc of locales) {
    revalidatePath(`/${loc}/careers`);
    if (slug) {
      revalidatePath(`/${loc}/careers/${slug}`);
    }
  }
  invalidateCareersCache({
    postingId,
    slug,
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("job_postings_slug_") ||
      error.message.includes("duplicate key"))
  );
}

/** Creates a job posting with sanitized description and audit. */
export async function createJobPostingAction(
  locale: string,
  raw: UpsertJobPostingFormInput,
  mediaForm?: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = upsertJobPostingSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid job posting payload.");
  }

  const currencyError = validateJobSalaryCurrency(parsed.data.salaryCurrency);
  if (currencyError) {
    return err(currencyError, jobRuleErrorMessage(currencyError));
  }

  const editingLocale = parsed.data.editingLocale;
  const translations = mergeTranslations(null, editingLocale, parsed.data);
  const ruleError = validateJobTranslations(translations);
  if (ruleError) {
    return err(ruleError, jobRuleErrorMessage(ruleError));
  }

  const actor = await requireAdmin(locale as Locale);
  const id = createId();
  const status = parsed.data.status;
  const publishedAt = parsePublishedAt(parsed.data.publishedAt, status);

  try {
    await withTransaction(async (tx) => {
      await tx.insert(jobPostings).values({
        id,
        status,
        employmentType: parsed.data.employmentType,
        salaryAmount: parsed.data.salaryAmount,
        salaryCurrency: parsed.data.salaryCurrency,
        sortOrder: parsed.data.sortOrder,
        publishedAt,
        translations,
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "job.create",
        targetType: "job_posting",
        targetId: id,
        afterDiff: {
          title: parsed.data.title,
          slug: translations[editingLocale]?.slug,
          status,
        },
        correlationId: createId(),
      });
    });

    revalidateCareers(locale, id, translations[editingLocale]?.slug);

    const mediaError = await applyJobCoverMedia(id, locale, mediaForm);
    if (mediaError) {
      return mediaError;
    }

    return ok({ id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return err("SLUG_TAKEN", "That slug is already in use.");
    }
    return err("JOB_CREATE_FAILED", "Unable to create job posting.");
  }
}

/** Updates an existing job posting. */
export async function updateJobPostingAction(
  locale: string,
  postingId: string,
  raw: UpsertJobPostingFormInput,
  mediaForm?: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = upsertJobPostingSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid job posting payload.");
  }

  const currencyError = validateJobSalaryCurrency(parsed.data.salaryCurrency);
  if (currencyError) {
    return err(currencyError, jobRuleErrorMessage(currencyError));
  }

  const actor = await requireAdmin(locale as Locale);
  const editingLocale = parsed.data.editingLocale;

  try {
    await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(jobPostings)
        .where(and(eq(jobPostings.id, postingId), isNull(jobPostings.deletedAt)))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const translations = mergeTranslations(
        existing.translations,
        editingLocale,
        parsed.data,
      );
      const ruleError = validateJobTranslations(translations);
      if (ruleError) {
        throw new Error(ruleError);
      }

      const status = parsed.data.status;
      const publishedAt =
        parsePublishedAt(parsed.data.publishedAt, status) ??
        (status === "ACTIVE" ? existing.publishedAt : null);

      await tx
        .update(jobPostings)
        .set({
          translations,
          status,
          employmentType: parsed.data.employmentType,
          salaryAmount: parsed.data.salaryAmount,
          salaryCurrency: parsed.data.salaryCurrency,
          sortOrder: parsed.data.sortOrder,
          publishedAt,
          updatedAt: new Date(),
        })
        .where(eq(jobPostings.id, postingId));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "job.update",
        targetType: "job_posting",
        targetId: postingId,
        beforeDiff: {
          status: existing.status,
          slug: existing.translations.en?.slug,
        },
        afterDiff: {
          title: parsed.data.title,
          slug: translations[editingLocale]?.slug,
          status,
        },
        correlationId: createId(),
      });
    });

    revalidateCareers(locale, postingId, parsed.data.slug);

    const mediaError = await applyJobCoverMedia(postingId, locale, mediaForm);
    if (mediaError) {
      return mediaError;
    }

    return ok({ id: postingId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Job posting not found.");
    }
    if (
      error instanceof Error &&
      (error.message === "TITLE_REQUIRED" ||
        error.message === "SLUG_REQUIRED" ||
        error.message === "DESCRIPTION_REQUIRED" ||
        error.message === "INVALID_SLUG")
    ) {
      return err(error.message, jobRuleErrorMessage(error.message));
    }
    if (isUniqueViolation(error)) {
      return err("SLUG_TAKEN", "That slug is already in use.");
    }
    return err("JOB_UPDATE_FAILED", "Unable to update job posting.");
  }
}

/** Soft-deletes a job posting. */
export async function deleteJobPostingAction(
  locale: string,
  raw: JobPostingIdInput,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = jobPostingIdSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid delete payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.id, parsed.data.postingId),
            isNull(jobPostings.deletedAt),
          ),
        )
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx
        .update(jobPostings)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(jobPostings.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "job.delete",
        targetType: "job_posting",
        targetId: existing.id,
        beforeDiff: { status: existing.status },
        afterDiff: { deleted: true },
        correlationId: createId(),
      });

      return {
        id: existing.id,
        slug: existing.translations.en?.slug,
      };
    });

    revalidateCareers(locale, result.id, result.slug);
    return ok({ id: result.id });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Job posting not found.");
    }
    return err("JOB_DELETE_FAILED", "Unable to delete job posting.");
  }
}
