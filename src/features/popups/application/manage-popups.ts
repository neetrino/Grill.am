"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";

import { auditLogs, mediaAssets, popups } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  persistPopupImage,
  removePopupImage,
} from "@/features/popups/application/persist-popup-media";
import {
  popupRuleErrorMessage,
  validatePopupCreateCount,
} from "@/features/popups/domain/popup-rules";
import {
  deletePopupSchema,
  togglePopupSchema,
  type DeletePopupInput,
  type TogglePopupInput,
} from "@/features/popups/schemas/admin-popup";
import { requireAdmin } from "@/lib/auth/policies";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

function revalidatePopups(locale: string): void {
  revalidatePath(`/${locale}/admin/popups`);
  for (const loc of ["hy", "en", "ru"] as const) {
    revalidatePath(`/${loc}`);
  }
  updateTag(CACHE_TAGS.popups);
}

/** Creates a popup from the admin drawer (image required). */
export async function createPopupAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size <= 0) {
    return err("IMAGE_REQUIRED", popupRuleErrorMessage("IMAGE_REQUIRED"));
  }

  const actor = await requireAdmin(locale as Locale);
  const id = createId();

  try {
    await withTransaction(async (tx) => {
      const [aggregate] = await tx
        .select({ total: count() })
        .from(popups);

      const ruleError = validatePopupCreateCount(Number(aggregate?.total ?? 0));
      if (ruleError) {
        throw new Error(`RULE:${ruleError}`);
      }

      await tx.insert(popups).values({
        id,
        isActive: false,
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "popup.create",
        targetType: "popup",
        targetId: id,
        afterDiff: { isActive: false },
        correlationId: createId(),
      });
    });

    const mediaResult = await persistPopupImage(id, image);
    if (mediaResult.error) {
      await withTransaction(async (tx) => {
        await tx.delete(mediaAssets).where(eq(mediaAssets.popupId, id));
        await tx.delete(popups).where(eq(popups.id, id));
      });
      return err("VALIDATION_ERROR", mediaResult.error);
    }

    revalidatePopups(locale);
    return ok({ id });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RULE:")) {
      const code = error.message.slice(5) as "MAX_POPUPS_REACHED";
      return err(code, popupRuleErrorMessage(code));
    }
    return err("POPUP_CREATE_FAILED", "Unable to create popup.");
  }
}

/** Replaces the image on an existing popup. */
export async function updatePopupAction(
  locale: string,
  popupId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const actor = await requireAdmin(locale as Locale);
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;

  try {
    await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(popups)
        .where(eq(popups.id, popupId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx
        .update(popups)
        .set({ updatedAt: new Date() })
        .where(eq(popups.id, popupId));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "popup.update",
        targetType: "popup",
        targetId: popupId,
        beforeDiff: { isActive: existing.isActive },
        afterDiff: {
          isActive: existing.isActive,
          imageReplaced: hasImage,
        },
        correlationId: createId(),
      });
    });

    if (hasImage) {
      const mediaResult = await persistPopupImage(popupId, image);
      if (mediaResult.error) {
        return err("VALIDATION_ERROR", mediaResult.error);
      }
    }

    revalidatePopups(locale);
    return ok({ id: popupId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Popup not found.");
    }
    return err("POPUP_UPDATE_FAILED", "Unable to update popup.");
  }
}

/**
 * Activates or deactivates a popup. Activating deactivates every other popup
 * so at most one stays active (also enforced by a DB unique index).
 */
export async function togglePopupAction(
  locale: string,
  raw: TogglePopupInput,
): Promise<Result<{ id: string; isActive: boolean }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = togglePopupSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid toggle payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(popups)
        .where(eq(popups.id, parsed.data.popupId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (parsed.data.isActive) {
        const [cover] = await tx
          .select({ id: mediaAssets.id })
          .from(mediaAssets)
          .where(
            and(
              eq(mediaAssets.popupId, existing.id),
              eq(mediaAssets.role, "COVER"),
              eq(mediaAssets.uploadStatus, "READY"),
            ),
          )
          .limit(1);

        if (!cover) {
          throw new Error("IMAGE_REQUIRED");
        }

        await tx
          .update(popups)
          .set({ isActive: false, updatedAt: new Date() })
          .where(ne(popups.id, existing.id));
      }

      await tx
        .update(popups)
        .set({ isActive: parsed.data.isActive, updatedAt: new Date() })
        .where(eq(popups.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "popup.toggle",
        targetType: "popup",
        targetId: existing.id,
        beforeDiff: { isActive: existing.isActive },
        afterDiff: { isActive: parsed.data.isActive },
        correlationId: createId(),
      });

      return { id: existing.id, isActive: parsed.data.isActive };
    });

    revalidatePopups(locale);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Popup not found.");
    }
    if (error instanceof Error && error.message === "IMAGE_REQUIRED") {
      return err("IMAGE_REQUIRED", popupRuleErrorMessage("IMAGE_REQUIRED"));
    }
    return err("POPUP_TOGGLE_FAILED", "Unable to toggle popup.");
  }
}

/** Deletes a popup and its media (DB + object storage). */
export async function deletePopupAction(
  locale: string,
  raw: DeletePopupInput,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = deletePopupSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid delete payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    await removePopupImage(parsed.data.popupId);

    await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(popups)
        .where(eq(popups.id, parsed.data.popupId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx
        .delete(mediaAssets)
        .where(eq(mediaAssets.popupId, existing.id));

      await tx.delete(popups).where(eq(popups.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "popup.delete",
        targetType: "popup",
        targetId: existing.id,
        beforeDiff: { isActive: existing.isActive },
        correlationId: createId(),
      });
    });

    revalidatePopups(locale);
    return ok({ id: parsed.data.popupId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Popup not found.");
    }
    return err("POPUP_DELETE_FAILED", "Unable to delete popup.");
  }
}
