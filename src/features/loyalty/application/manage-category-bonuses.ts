"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auditLogs, categories, categoryBonusRules } from "@/db/schema";
import { withTransaction } from "@/db/transaction";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import {
  appDayEndUtc,
  appDayStartUtc,
  parseAppDateTimeLocal,
} from "@/lib/datetime/app-timezone";
import { createId } from "@/lib/id";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

const boundSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?$/,
    "Invalid date",
  )
  .nullable();

const upsertSchema = z
  .object({
    categoryId: z.string().uuid(),
    amount: z.number().int().min(1).max(10_000_000).nullable(),
    startsOn: boundSchema,
    endsOn: boundSchema,
  })
  .superRefine((value, ctx) => {
    if (value.amount == null) {
      return;
    }
    if (
      value.startsOn != null &&
      value.endsOn != null &&
      value.startsOn > value.endsOn
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be on or before end date.",
        path: ["endsOn"],
      });
    }
  });

function parseBound(
  value: string,
  edge: "start" | "end",
): Date {
  if (value.includes("T")) {
    return parseAppDateTimeLocal(value);
  }
  return edge === "start" ? appDayStartUtc(value) : appDayEndUtc(value);
}

function revalidateBonuses(locale: string): void {
  revalidatePath(`/${locale}/admin/bonuses`);
  revalidatePath(`/${locale}/checkout`);
  revalidatePath(`/${locale}/profile/bonuses`);
  revalidatePath(`/${locale}/products`);
  revalidatePath(`/${locale}/wishlist`);
  revalidatePath(`/${locale}`);
  invalidateProductsCache({ allProductDetails: true });
}

/** Creates, updates, or clears one category flat-bonus rule. */
export async function upsertCategoryBonusRuleAction(
  locale: string,
  raw: z.infer<typeof upsertSchema>,
): Promise<Result<{ categoryId: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid category bonus payload.");
  }

  const actor = await requireAdmin(locale as Locale);
  const { categoryId, amount, startsOn, endsOn } = parsed.data;

  try {
    await withTransaction(async (tx) => {
      const [category] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);
      if (!category) {
        throw new Error("CATEGORY_NOT_FOUND");
      }

      const [existing] = await tx
        .select()
        .from(categoryBonusRules)
        .where(eq(categoryBonusRules.categoryId, categoryId))
        .limit(1);

      const now = new Date();
      const correlationId = createId();

      if (amount == null) {
        if (!existing) return;
        await tx
          .delete(categoryBonusRules)
          .where(eq(categoryBonusRules.id, existing.id));
        await tx.insert(auditLogs).values({
          id: createId(),
          actorUserId: actor.id,
          action: "category_bonus_rule.delete",
          targetType: "category_bonus_rule",
          targetId: existing.id,
          beforeDiff: {
            categoryId: existing.categoryId,
            amount: existing.amount,
            startsAt: existing.startsAt?.toISOString() ?? null,
            endsAt: existing.endsAt?.toISOString() ?? null,
          },
          afterDiff: null,
          correlationId,
        });
        return;
      }

      const startsAt = startsOn ? parseBound(startsOn, "start") : null;
      const endsAt = endsOn ? parseBound(endsOn, "end") : null;

      if (existing) {
        await tx
          .update(categoryBonusRules)
          .set({
            amount,
            startsAt,
            endsAt,
            updatedAt: now,
          })
          .where(eq(categoryBonusRules.id, existing.id));
        await tx.insert(auditLogs).values({
          id: createId(),
          actorUserId: actor.id,
          action: "category_bonus_rule.update",
          targetType: "category_bonus_rule",
          targetId: existing.id,
          beforeDiff: {
            amount: existing.amount,
            startsAt: existing.startsAt?.toISOString() ?? null,
            endsAt: existing.endsAt?.toISOString() ?? null,
          },
          afterDiff: {
            amount,
            startsAt: startsAt?.toISOString() ?? null,
            endsAt: endsAt?.toISOString() ?? null,
          },
          correlationId,
        });
        return;
      }

      const id = createId();
      await tx.insert(categoryBonusRules).values({
        id,
        categoryId,
        amount,
        startsAt,
        endsAt,
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(auditLogs).values({
        id: createId(),
        actorUserId: actor.id,
        action: "category_bonus_rule.create",
        targetType: "category_bonus_rule",
        targetId: id,
        beforeDiff: null,
        afterDiff: {
          categoryId,
          amount,
          startsAt: startsAt?.toISOString() ?? null,
          endsAt: endsAt?.toISOString() ?? null,
        },
        correlationId,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return err("NOT_FOUND", "Category not found.");
    }
    throw error;
  }

  revalidateBonuses(locale);
  return ok({ categoryId });
}
