"use server";

import { createHash } from "node:crypto";

import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { jobApplications, jobPostings } from "@/db/schema";
import {
  extensionForCvFile,
  normalizeApplicationEmail,
  sanitizeCvFileName,
  validateCvFile,
} from "@/features/careers/domain/application-rules";
import { submitJobApplicationFieldsSchema } from "@/features/careers/schemas/application";
import { createId } from "@/lib/id";
import { locales } from "@/lib/i18n/config";
import { logger } from "@/lib/observability/logger";
import { err, ok, type Result } from "@/lib/result";

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
/** Max applications per email per window (aligned with contact). */
const APPLICATION_RATE_LIMIT = 5;
const APPLICATION_RATE_WINDOW_SECONDS = 15 * 60;

function revalidateApplicationsInbox(): void {
  for (const locale of locales) {
    revalidatePath(`/${locale}/admin/careers/applications`);
  }
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Public job application submission: validates ACTIVE posting,
 * uploads CV to object storage, and persists the application row.
 */
export async function submitJobApplicationAction(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const parsed = submitJobApplicationFieldsSchema.safeParse({
    jobPostingId: readFormString(formData, "jobPostingId"),
    name: readFormString(formData, "name"),
    email: readFormString(formData, "email"),
    phone: readFormString(formData, "phone"),
    message: readFormString(formData, "message"),
    companyWebsite: readFormString(formData, "companyWebsite") || undefined,
  });

  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Please check the form fields.");
  }

  const data = parsed.data;
  if (data.companyWebsite && data.companyWebsite.trim().length > 0) {
    return err("SPAM_REJECTED", "Unable to submit your application.");
  }

  const cvEntry = formData.get("cv");
  const cvFile = cvEntry instanceof File && cvEntry.size > 0 ? cvEntry : null;
  const cvError = validateCvFile(cvFile);
  if (cvError || !cvFile) {
    switch (cvError) {
      case "CV_INVALID_TYPE":
        return err(
          "CV_INVALID_TYPE",
          "Only PDF, DOC, or DOCX files are allowed.",
        );
      case "CV_TOO_LARGE":
        return err("CV_TOO_LARGE", "CV must be 5 MB or smaller.");
      default:
        return err("CV_REQUIRED", "Please upload your CV.");
    }
  }

  const email = normalizeApplicationEmail(data.email);
  const rateKey = `careers:apply:rate:${createHash("sha256").update(email).digest("hex")}`;
  const redis = getProviders().redis.getClient();
  const currentRaw = await redis.get(rateKey);
  const currentCount = currentRaw ? Number.parseInt(currentRaw, 10) : 0;
  if (Number.isFinite(currentCount) && currentCount >= APPLICATION_RATE_LIMIT) {
    return err(
      "RATE_LIMITED",
      "Too many applications. Please try again later.",
    );
  }

  const db = getDb();
  const [posting] = await db
    .select({
      id: jobPostings.id,
      status: jobPostings.status,
    })
    .from(jobPostings)
    .where(
      and(
        eq(jobPostings.id, data.jobPostingId),
        isNull(jobPostings.deletedAt),
      ),
    )
    .limit(1);

  if (!posting || posting.status !== "ACTIVE") {
    return err(
      "JOB_NOT_AVAILABLE",
      "This position is no longer accepting applications.",
    );
  }

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const [duplicate] = await db
    .select({ id: jobApplications.id })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.email, email),
        eq(jobApplications.jobPostingId, posting.id),
        gt(jobApplications.createdAt, since),
      ),
    )
    .orderBy(desc(jobApplications.createdAt))
    .limit(1);

  if (duplicate) {
    return ok({ id: duplicate.id });
  }

  const id = createId();
  const extension = extensionForCvFile(cvFile);
  const objectKey = `uploads/careers/applications/${id}/${createId()}.${extension}`;
  const cvFileName = sanitizeCvFileName(cvFile.name);
  const storage = getProviders().storage;

  try {
    await storage.putObject({
      objectKey,
      body: Buffer.from(await cvFile.arrayBuffer()),
      contentType: cvFile.type || "application/octet-stream",
    });
  } catch (error) {
    logger.error("job_application.cv_upload_failed", {
      jobPostingId: posting.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    return err(
      "APPLICATION_SUBMIT_FAILED",
      "Unable to upload your CV. Please try again.",
    );
  }

  try {
    await db.insert(jobApplications).values({
      id,
      jobPostingId: posting.id,
      name: data.name.trim(),
      email,
      phone: data.phone.trim(),
      message: data.message.trim(),
      status: "UNREAD",
      cvObjectKey: objectKey,
      cvFileName,
      cvMimeType: cvFile.type || "application/octet-stream",
      cvByteSize: cvFile.size,
    });

    const nextCount = (Number.isFinite(currentCount) ? currentCount : 0) + 1;
    await redis.set(rateKey, String(nextCount), {
      ex: APPLICATION_RATE_WINDOW_SECONDS,
    });

    revalidateApplicationsInbox();
    return ok({ id });
  } catch (error) {
    logger.error("job_application.insert_failed", {
      applicationId: id,
      jobPostingId: posting.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    await storage.deleteObject(objectKey);
    return err(
      "APPLICATION_SUBMIT_FAILED",
      "Unable to submit your application.",
    );
  }
}
