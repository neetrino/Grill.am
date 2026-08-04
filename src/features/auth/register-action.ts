"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { registerSchema } from "@/features/auth/schemas";
import {
  mapZodFieldErrors,
  readAuthFormValues,
  type AuthActionState,
} from "@/features/auth/ui/auth-action-state";
import { createSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createId } from "@/lib/id";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const REGISTER_VALUE_KEYS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "acceptTerms",
] as const;

function registerErrorState(
  formData: FormData,
  error: string,
  fieldErrors: AuthActionState["fieldErrors"],
): AuthActionState {
  return {
    error,
    fieldErrors,
    values: readAuthFormValues(formData, REGISTER_VALUE_KEYS),
    formKey: Date.now(),
  };
}

export async function registerAction(
  localeInput: string,
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  const locale: Locale = isLocale(localeInput) ? localeInput : defaultLocale;

  if (!parsed.success) {
    return registerErrorState(
      formData,
      parsed.error.issues[0]?.message ?? "Invalid registration details.",
      mapZodFieldErrors(parsed.error),
    );
  }

  const [existingUser] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existingUser) {
    return registerErrorState(
      formData,
      "Unable to create account with those details.",
      { email: "Unable to create account with those details." },
    );
  }

  const {
    password,
    confirmPassword,
    acceptTerms,
    ...registration
  } = parsed.data;
  void confirmPassword;
  void acceptTerms;
  const [user] = await getDb()
    .insert(users)
    .values({
      id: createId(),
      ...registration,
      passwordHash: await hashPassword(password),
      passwordUpdatedAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
      // Temporary Phase 3 bypass until the verification provider is connected.
      emailVerifiedAt: new Date(),
      role: "CUSTOMER",
      status: "ACTIVE",
    })
    .returning({ id: users.id });

  if (!user) {
    return registerErrorState(
      formData,
      "Unable to create account with those details.",
      undefined,
    );
  }

  await createSession(user.id);
  redirect(`/${locale}/profile`);
}
