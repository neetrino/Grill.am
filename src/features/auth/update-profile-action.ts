"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db/client";
import { addresses, users } from "@/db/schema";
import { resolveProfileEmailUpdate } from "@/features/auth/resolve-profile-email";
import { e164PhoneSchema } from "@/features/auth/schemas";
import { resolvePhoneUpdate } from "@/lib/auth/otp/phone-verification-state";
import { requireUser } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: e164PhoneSchema,
});

export type UpdateProfileActionState = {
  error?: string;
  success?: string;
};

/**
 * Updates the signed-in customer's personal fields used by profile and checkout.
 * Also keeps saved address recipient name/phone in sync with the profile.
 */
export async function updateProfileAction(
  locale: string,
  _previousState: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  if (!isLocale(locale)) {
    return { error: "Invalid locale." };
  }

  const copy = getDictionary(locale).profile.personalForm;
  const user = await requireUser(locale as Locale);
  const emailUpdate = resolveProfileEmailUpdate(
    user.email,
    String(formData.get("email") ?? ""),
  );
  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });

  if (!emailUpdate.ok || !parsed.success) {
    return { error: copy.validationError };
  }

  if (emailUpdate.email !== null && emailUpdate.email !== user.email) {
    const [existing] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.email, emailUpdate.email), ne(users.id, user.id)),
      )
      .limit(1);

    if (existing) {
      return { error: copy.emailInUse };
    }
  }

  const phoneUpdate = resolvePhoneUpdate({
    previousPhone: user.phone,
    previousVerifiedAt: user.phoneVerifiedAt,
    nextPhone: parsed.data.phone,
  });

  await getDb()
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: emailUpdate.email,
      phone: phoneUpdate.phone,
      phoneVerifiedAt: phoneUpdate.phoneVerifiedAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Addresses store a copy of profile contact fields for checkout prefills.
  await getDb()
    .update(addresses)
    .set({
      recipientFirstName: parsed.data.firstName,
      recipientLastName: parsed.data.lastName,
      phone: phoneUpdate.phone,
      updatedAt: new Date(),
    })
    .where(and(eq(addresses.userId, user.id), isNull(addresses.archivedAt)));

  revalidatePath(`/${locale}/profile`);
  revalidatePath(`/${locale}/profile/personal-information`);
  revalidatePath(`/${locale}/profile/addresses`);
  revalidatePath(`/${locale}/checkout`);

  return { success: copy.saved };
}
