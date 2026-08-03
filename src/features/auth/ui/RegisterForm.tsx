"use client";

import { useActionState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { type AuthActionState } from "@/features/auth/login-action";
import { registerAction } from "@/features/auth/register-action";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_FIELD_CLASS,
  AUTH_LINK_CLASS,
} from "@/features/auth/ui/auth-ui";
import { PasswordField } from "@/features/auth/ui/PasswordField";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const initialState: AuthActionState = {};

type RegisterFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

export function RegisterForm({ locale, dictionary }: RegisterFormProps) {
  const action = registerAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.firstName}
          <input
            required
            name="firstName"
            autoComplete="given-name"
            className={AUTH_FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.lastName}
          <input
            required
            name="lastName"
            autoComplete="family-name"
            className={AUTH_FIELD_CLASS}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.email}
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className={AUTH_FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.phone}
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            className={AUTH_FIELD_CLASS}
          />
        </label>
      </div>

      <PasswordField
        name="password"
        label={dictionary.password}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="new-password"
      />

      <PasswordField
        name="confirmPassword"
        label={dictionary.confirmPassword}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="new-password"
      />

      {state.error ? (
        <p
          role="alert"
          className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={AUTH_BTN_PRIMARY_CLASS}>
        {isPending
          ? dictionary.submittingRegister
          : dictionary.submitRegister}
      </button>

      <p className="text-center text-sm text-gray-600">
        {dictionary.hasAccount}{" "}
        <AppLink
          href={`/${locale}/login`}
          prefetchPolicy="intent"
          className={AUTH_LINK_CLASS}
        >
          {dictionary.signInLink}
        </AppLink>
      </p>
    </form>
  );
}
