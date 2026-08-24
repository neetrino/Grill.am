"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { loginAction } from "@/features/auth/login-action";
import type { AuthActionState } from "@/features/auth/ui/auth-action-state";
import {
  AuthAnimatedInput,
  AuthMotionField,
} from "@/features/auth/ui/AuthMotionField";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_CHECKBOX_CLASS,
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
        <AuthMotionField index={0}>
          <p
            role="status"
            className="rounded-[10px] border-2 border-green-700 bg-green-50 p-3 text-sm font-medium text-green-800"
          >
            {dictionary.resetPasswordSuccess}
          </p>
        </AuthMotionField>
      ) : null}

      <AuthMotionField index={0}>
        <AuthAnimatedInput
          required
          name="email"
          type="email"
          autoComplete="email"
          placeholder={dictionary.email}
          aria-label={dictionary.email}
          defaultValue={values?.email ?? ""}
          aria-invalid={Boolean(fieldErrors?.email)}
          className={authFieldClassName(Boolean(fieldErrors?.email))}
        />
      </AuthMotionField>

      <AuthMotionField index={1}>
        <PasswordField
          name="password"
          label={dictionary.password}
          placeholder={dictionary.password}
          showPasswordLabel={dictionary.showPassword}
          hidePasswordLabel={dictionary.hidePassword}
          autoComplete="current-password"
          defaultValue={values?.password}
          invalid={Boolean(fieldErrors?.password)}
        />
      </AuthMotionField>

      <AuthMotionField
        index={2}
        className="flex items-center justify-between gap-3"
      >
        <label className="flex items-center gap-2.5 text-sm font-semibold text-brand-ink/75">
          <input
            type="checkbox"
            name="rememberMe"
            value="on"
            defaultChecked={values ? values.rememberMe === "on" : true}
            className={AUTH_CHECKBOX_CLASS}
          />
          {dictionary.rememberMe}
        </label>
        <AppLink
          href={`/${locale}/forgot-password`}
          prefetchPolicy="intent"
          className={`text-sm ${AUTH_LINK_CLASS}`}
        >
          {dictionary.forgotPassword}
        </AppLink>
      </AuthMotionField>

      {state.error ? (
        <AuthMotionField index={3}>
          <p
            role="alert"
            className="rounded-[10px] border-2 border-red-700 bg-red-50 p-3 text-sm font-medium text-red-800"
          >
            {state.error}
          </p>
        </AuthMotionField>
      ) : null}

      <AuthMotionField index={3}>
        <button
          type="submit"
          disabled={isPending}
          className={AUTH_BTN_PRIMARY_CLASS}
        >
          {isPending ? "…" : dictionary.submitLogin}
        </button>
      </AuthMotionField>

      <AuthMotionField index={4}>
        <p className="text-center text-sm text-brand-ink/60">
          <AppLink
            href={`/${locale}/register`}
            prefetchPolicy="intent"
            className={AUTH_LINK_CLASS}
          >
            {dictionary.submitRegister}
          </AppLink>
        </p>
      </AuthMotionField>
    </form>
  );
}
