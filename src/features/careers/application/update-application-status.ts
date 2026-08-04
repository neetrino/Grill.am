"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auditLogs, jobApplications } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  canTransitionJobApplicationStatus,
  isJobApplicationStatus,
  type JobApplicationStatus,
} from "@/features/careers/domain/application-rules";
import {
  updateJobApplicationStatusSchema,
  type UpdateJobApplicationStatusInput,
} from "@/features/careers/schemas/application";
import { requireAdmin } from "@/lib/auth/policies";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

/** Admin job-application status transition with audit. */
export async function updateJobApplicationStatusAction(
  locale: string,
  raw: UpdateJobApplicationStatusInput,
): Promise<Result<{ id: string; status: JobApplicationStatus }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = updateJobApplicationStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid status payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.id, parsed.data.applicationId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (!isJobApplicationStatus(existing.status)) {
        throw new Error("INVALID_STATUS");
      }

      if (existing.status === parsed.data.status) {
        throw new Error("SAME_STATUS");
      }

      if (
        !canTransitionJobApplicationStatus(existing.status, parsed.data.status)
      ) {
        throw new Error("INVALID_TRANSITION");
      }

      await tx
        .update(jobApplications)
        .set({ status: parsed.data.status, updatedAt: new Date() })
        .where(eq(jobApplications.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "job_application.change_status",
        targetType: "job_application",
        targetId: existing.id,
        beforeDiff: { status: existing.status },
        afterDiff: { status: parsed.data.status },
        correlationId: createId(),
      });

      return { id: existing.id, status: parsed.data.status };
    });

    revalidatePath(`/${locale}/admin/careers/applications`);
    revalidatePath(`/${locale}/admin/careers/applications/${result.id}`);
    return ok(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    switch (code) {
      case "NOT_FOUND":
        return err("NOT_FOUND", "Application not found.");
      case "SAME_STATUS":
        return err("SAME_STATUS", "Application already has this status.");
      case "INVALID_TRANSITION":
        return err(
          "INVALID_TRANSITION",
          "That status transition is not allowed.",
        );
      default:
        return err(
          "APPLICATION_UPDATE_FAILED",
          "Unable to update application.",
        );
    }
  }
}
