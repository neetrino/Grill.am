"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auditLogs, contactMessages } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  deleteContactMessageSchema,
  type DeleteContactMessageInput,
} from "@/features/contact/schemas/contact";
import { requireAdmin } from "@/lib/auth/policies";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

/** Permanently deletes a contact inbox message with audit. */
export async function deleteContactMessageAction(
  locale: string,
  raw: DeleteContactMessageInput,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = deleteContactMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid delete payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(contactMessages)
        .where(eq(contactMessages.id, parsed.data.messageId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx
        .delete(contactMessages)
        .where(eq(contactMessages.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "contact.delete",
        targetType: "contact_message",
        targetId: existing.id,
        beforeDiff: {
          status: existing.status,
          email: existing.email,
          subject: existing.subject,
        },
        correlationId: createId(),
      });

      return { id: existing.id };
    });

    revalidatePath(`/${locale}/admin/messages`);
    revalidatePath(`/${locale}/admin/messages/${result.id}`);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Message not found.");
    }
    return err("CONTACT_DELETE_FAILED", "Unable to delete message.");
  }
}
