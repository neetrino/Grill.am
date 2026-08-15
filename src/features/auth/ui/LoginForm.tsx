"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { loginAction } from "@/features/auth/login-action";
import type { AuthActionState } from "@/features/auth/ui/auth-action-state";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_LINK_CLASS,
  authFieldClassName,
} from "@/features/auth/ui/auth-ui";
import { PasswordField } from "@/features/auth/ui/PasswordField";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const initialState: AuthActionState = {};

type LoginFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

export function LoginForm({ locale, dictionary }: LoginFormProps) {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const resetSucceeded = searchParams.get("reset") === "1";
  const action = loginAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values;
  const fieldErrors = state.fieldErrors;

  return (
    <form
      key={state.formKey ?? "login"}
      action={formAction}
      className="flex flex-col gap-5"
      noValidate
    >
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      {resetSucceeded ? (
        <p
          role="status"
          className="rounded-[15px] border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {dictionary.resetPasswordSuccess}
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
        {dictionary.email}
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values?.email ?? ""}
          aria-invalid={Boolean(fieldErrors?.email)}
          className={authFieldClassName(Boolean(fieldErrors?.email))}
        />
      </label>
      <PasswordField
        name="password"
        label={dictionary.password}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="current-password"
        defaultValue={values?.password}
        invalid={Boolean(fieldErrors?.password)}
      />
      <div className="flex justify-end">
        <AppLink
          href={`/${locale}/forgot-password`}
          prefetchPolicy="intent"
          className={`text-sm ${AUTH_LINK_CLASS}`}
        >
          {dictionary.forgotPassword}
        </AppLink>
      </div>
      {state.error ? (
        <p
          role="alert"
          className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={isPending} className={AUTH_BTN_PRIMARY_CLASS}>
        {isPending ? "…" : dictionary.submitLogin}
      </button>
      <p className="text-center text-sm text-gray-600">
        <AppLink
          href={`/${locale}/register`}
          prefetchPolicy="intent"
          className={AUTH_LINK_CLASS}
        >
          {dictionary.submitRegister}
        </AppLink>
      </p>
    </form>
  );
}
