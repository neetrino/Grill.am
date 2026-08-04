"use client";

import { useActionState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "@/features/auth/reset-password-action";
import { PASSWORD_REQUIREMENTS_ERROR } from "@/features/auth/schemas";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_LINK_CLASS,
} from "@/features/auth/ui/auth-ui";
import { PasswordField } from "@/features/auth/ui/PasswordField";
import { PasswordRequirementsDisclaimer } from "@/features/auth/ui/PasswordRequirementsDisclaimer";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

const initialState: ResetPasswordActionState = {};

type ResetPasswordFormProps = {
  locale: Locale;
  token: string;
  dictionary: Dictionary["auth"];
};

export function ResetPasswordForm({
  locale,
  token,
  dictionary,
}: ResetPasswordFormProps) {
  const action = resetPasswordAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <p
          role="alert"
          className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {dictionary.resetInvalidToken}
        </p>
        <p className="text-center text-sm text-gray-600">
          <AppLink
            href={`/${locale}/forgot-password`}
            prefetchPolicy="intent"
            className={AUTH_LINK_CLASS}
          >
            {dictionary.forgotPassword}
          </AppLink>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <PasswordField
        name="password"
        label={dictionary.password}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="new-password"
        invalid={state.error === PASSWORD_REQUIREMENTS_ERROR}
      />

      <PasswordField
        name="confirmPassword"
        label={dictionary.confirmPassword}
        showPasswordLabel={dictionary.showPassword}
        hidePasswordLabel={dictionary.hidePassword}
        autoComplete="new-password"
      />

      {state.error === PASSWORD_REQUIREMENTS_ERROR ? (
        <PasswordRequirementsDisclaimer
          title={dictionary.passwordRequirementsTitle}
          rules={dictionary.passwordRequirements}
        />
      ) : state.error ? (
        <p
          role="alert"
          className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={AUTH_BTN_PRIMARY_CLASS}>
        {isPending
          ? dictionary.submittingResetPassword
          : dictionary.submitResetPassword}
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
