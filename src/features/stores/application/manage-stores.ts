"use server";

import { eq, max } from "drizzle-orm";

import { auditLogs, mediaAssets, storeLocations } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import {
  allocateUniqueStoreSlug,
  mergeStoreTranslations,
  parseStoreDrawerFormData,
  revalidateStores,
} from "@/features/stores/application/manage-store-form";
import {
  persistStoreImage,
  removeStoreImage,
} from "@/features/stores/application/persist-store-media";
import {
  slugifyStoreLabel,
  storeRuleErrorMessage,
  validateStoreTranslations,
} from "@/features/stores/domain/store-rules";
import {
  deleteStoreSchema,
  toggleStoreSchema,
  type DeleteStoreInput,
  type ToggleStoreInput,
} from "@/features/stores/schemas/admin-store";
import { requireAdmin } from "@/lib/auth/policies";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

/** Creates a store location from the admin drawer. */
export async function createStoreAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const data = parseStoreDrawerFormData(formData, locale as Locale);
  if (!data) {
    return err("VALIDATION_ERROR", "Invalid store payload.");
  }

  const translations = mergeStoreTranslations(null, data.editingLocale, data);
  const ruleError = validateStoreTranslations(translations);
  if (ruleError) {
    return err(ruleError, storeRuleErrorMessage(ruleError));
  }

  const actor = await requireAdmin(locale as Locale);
  const id = createId();
  const slug = await allocateUniqueStoreSlug(
    slugifyStoreLabel(data.address || data.title),
  );
  const phone = data.phone || null;

  try {
    await withTransaction(async (tx) => {
      const [aggregate] = await tx
        .select({ next: max(storeLocations.sortOrder) })
        .from(storeLocations);

      await tx.insert(storeLocations).values({
        id,
        slug,
        translations,
        phone,
        sortOrder: (aggregate?.next ?? -1) + 1,
        isActive: true,
      });

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "store.create",
        targetType: "store_location",
        targetId: id,
        afterDiff: { slug, title: data.title, isActive: true },
        correlationId: createId(),
      });
    });

    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      const mediaResult = await persistStoreImage(id, image);
      if (mediaResult.error) {
        return err("VALIDATION_ERROR", mediaResult.error);
      }
    }

    revalidateStores(locale);
    return ok({ id });
  } catch {
    return err("STORE_CREATE_FAILED", "Unable to create store.");
  }
}

/** Updates an existing store location from the admin drawer. */
export async function updateStoreAction(
  locale: string,
  storeId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const data = parseStoreDrawerFormData(formData, locale as Locale);
  if (!data) {
    return err("VALIDATION_ERROR", "Invalid store payload.");
  }

  const actor = await requireAdmin(locale as Locale);
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;
  const removeImage = formData.get("removeImage") === "1";
  const phone = data.phone || null;

  try {
    await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(storeLocations)
        .where(eq(storeLocations.id, storeId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const translations = mergeStoreTranslations(
        existing.translations,
        data.editingLocale,
        data,
      );
      const ruleError = validateStoreTranslations(translations);
      if (ruleError) {
        throw new Error(`RULE:${ruleError}`);
      }

      await tx
        .update(storeLocations)
        .set({ translations, phone, updatedAt: new Date() })
        .where(eq(storeLocations.id, storeId));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "store.update",
        targetType: "store_location",
        targetId: storeId,
        beforeDiff: { phone: existing.phone },
        afterDiff: { phone, imageReplaced: hasImage, imageRemoved: removeImage },
        correlationId: createId(),
      });
    });

    if (removeImage && !hasImage) {
      await removeStoreImage(storeId);
    }
    if (hasImage) {
      const mediaResult = await persistStoreImage(storeId, image);
      if (mediaResult.error) {
        return err("VALIDATION_ERROR", mediaResult.error);
      }
    }

    revalidateStores(locale);
    return ok({ id: storeId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Store not found.");
    }
    if (error instanceof Error && error.message.startsWith("RULE:")) {
      const code = error.message.slice(5) as "TITLE_REQUIRED" | "ADDRESS_REQUIRED";
      return err(code, storeRuleErrorMessage(code));
    }
    return err("STORE_UPDATE_FAILED", "Unable to update store.");
  }
}

/** Activates or hides a store on the home page. */
export async function toggleStoreAction(
  locale: string,
  raw: ToggleStoreInput,
): Promise<Result<{ id: string; isActive: boolean }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = toggleStoreSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid toggle payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    const result = await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(storeLocations)
        .where(eq(storeLocations.id, parsed.data.storeId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx
        .update(storeLocations)
        .set({ isActive: parsed.data.isActive, updatedAt: new Date() })
        .where(eq(storeLocations.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "store.toggle",
        targetType: "store_location",
        targetId: existing.id,
        beforeDiff: { isActive: existing.isActive },
        afterDiff: { isActive: parsed.data.isActive },
        correlationId: createId(),
      });

      return { id: existing.id, isActive: parsed.data.isActive };
    });

    revalidateStores(locale);
    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Store not found.");
    }
    return err("STORE_TOGGLE_FAILED", "Unable to toggle store.");
  }
}

/** Deletes a store location and its media. */
export async function deleteStoreAction(
  locale: string,
  raw: DeleteStoreInput,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = deleteStoreSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid delete payload.");
  }

  const actor = await requireAdmin(locale as Locale);

  try {
    await removeStoreImage(parsed.data.storeId);

    await withTransaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(storeLocations)
        .where(eq(storeLocations.id, parsed.data.storeId))
        .for("update")
        .limit(1);

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      await tx
        .delete(mediaAssets)
        .where(eq(mediaAssets.storeLocationId, existing.id));
      await tx.delete(storeLocations).where(eq(storeLocations.id, existing.id));

      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "store.delete",
        targetType: "store_location",
        targetId: existing.id,
        beforeDiff: { slug: existing.slug, isActive: existing.isActive },
        correlationId: createId(),
      });
    });

    revalidateStores(locale);
    return ok({ id: parsed.data.storeId });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return err("NOT_FOUND", "Store not found.");
    }
    return err("STORE_DELETE_FAILED", "Unable to delete store.");
  }
}
