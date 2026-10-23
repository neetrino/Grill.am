"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import {
  PASSWORD_ALREADY_SET_ERROR,
  resolveSetPassword,
} from "@/features/auth/resolve-set-password";
import { requireUser } from "@/lib/auth/policies";
import { hashPassword } from "@/lib/auth/password";
import { revokeOtherSessions } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";

export type SetPasswordActionState = {
  error?: string;
  success?: string;
};

/**
 * Stores the first password for a signed-in user who has none.
 * The hash is read again here and is not taken from the form.
 * Other sessions are revoked; the current browser session stays active.
 */
export async function setPasswordAction(
  locale: string,
  _previousState: SetPasswordActionState,
  formData: FormData,
): Promise<SetPasswordActionState> {
  if (!isLocale(locale)) {
    return { error: "Invalid locale." };
  }

  const user = await requireUser(locale as Locale);
  const [row] = await getDb()
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) {
    return { error: "Unable to set password." };
  }

  const decision = resolveSetPassword({
    passwordHash: row.passwordHash,
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!decision.ok) {
    return { error: decision.error };
  }

  const passwordHash = await hashPassword(decision.password);
  const now = new Date();
  const updated = await getDb()
    .update(users)
    .set({
      passwordHash,
      passwordUpdatedAt: now,
      updatedAt: now,
    })
    .where(and(eq(users.id, user.id), isNull(users.passwordHash)))
    .returning({ id: users.id });

  if (updated.length === 0) {
    return { error: PASSWORD_ALREADY_SET_ERROR };
  }

  await revokeOtherSessions(user.id);

  revalidatePath(`/${locale}/profile/password`);
  revalidatePath(`/${locale}/profile`);

  return { success: "Password set successfully." };
}
