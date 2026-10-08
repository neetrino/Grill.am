"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { loginSchema } from "@/features/auth/schemas";
import {
  mapZodFieldErrors,
  readAuthFormValues,
  type AuthActionState,
} from "@/features/auth/ui/auth-action-state";
import { isPasswordLoginAllowed } from "@/lib/auth/password-login";
import { resolveSafeNextPath } from "@/lib/auth/post-login-path";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const LOGIN_VALUE_KEYS = ["email", "password", "rememberMe"] as const;

function loginErrorState(
  formData: FormData,
  error: string,
  fieldErrors: AuthActionState["fieldErrors"],
): AuthActionState {
  return {
    error,
    fieldErrors,
    values: readAuthFormValues(formData, LOGIN_VALUE_KEYS),
    formKey: Date.now(),
  };
}

export async function loginAction(
  localeInput: string,
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const locale: Locale = isLocale(localeInput) ? localeInput : defaultLocale;

  if (!parsed.success) {
    return loginErrorState(
      formData,
      "Invalid email or password.",
      mapZodFieldErrors(parsed.error),
    );
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const passwordMatches = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : false;

  if (
    !user ||
    !isPasswordLoginAllowed({
      userFound: true,
      passwordMatches,
      status: user.status,
    })
  ) {
    return loginErrorState(formData, "Invalid email or password.", {
      email: "Invalid",
      password: "Invalid",
    });
  }

  await getDb()
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await createSession(user.id, {
    rememberMe: parsed.data.rememberMe === "on",
  });
  redirect(resolveSafeNextPath(locale, user.role, formData.get("next")));
}
