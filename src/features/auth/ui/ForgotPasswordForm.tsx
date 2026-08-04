"use client";

import { useActionState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/features/auth/forgot-password-action";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_FIELD_CLASS,
  AUTH_LINK_CLASS,
} from "@/features/auth/ui/auth-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const initialState: ForgotPasswordActionState = {};

type ForgotPasswordFormProps = {
  locale: Locale;
  dictionary: Dictionary["auth"];
};

export function ForgotPasswordForm({
  locale,
  dictionary,
}: ForgotPasswordFormProps) {
  const action = forgotPasswordAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
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

      {state.error ? (
        <p
          role="alert"
          className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {state.error}
        </p>
      ) : null}

      {state.sent ? (
        <p
          role="status"
          className="rounded-[15px] border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {dictionary.forgotPasswordSuccess}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={AUTH_BTN_PRIMARY_CLASS}>
        {isPending
          ? dictionary.submittingForgotPassword
          : dictionary.submitForgotPassword}
      </button>

      <p className="text-center text-sm text-gray-600">
        <AppLink
          href={`/${locale}/login`}
          prefetchPolicy="intent"
          className={AUTH_LINK_CLASS}
        >
          {dictionary.backToLogin}
        </AppLink>
      </p>
    </form>
  );
}
