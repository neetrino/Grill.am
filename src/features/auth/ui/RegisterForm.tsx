"use client";

import { useActionState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { registerAction } from "@/features/auth/register-action";
import { PASSWORD_REQUIREMENTS_ERROR } from "@/features/auth/schemas";
import type { AuthActionState } from "@/features/auth/ui/auth-action-state";
import {
  AuthAnimatedInput,
  AuthMotionField,
} from "@/features/auth/ui/AuthMotionField";
import { AuthTermsAgreement } from "@/features/auth/ui/AuthTermsAgreement";
import {
  AUTH_BTN_PRIMARY_CLASS,
  AUTH_LINK_CLASS,
  authFieldClassName,
} from "@/features/auth/ui/auth-ui";
import { PasswordField } from "@/features/auth/ui/PasswordField";
import { PasswordRequirementsDisclaimer } from "@/features/auth/ui/PasswordRequirementsDisclaimer";
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
  const values = state.values;
  const fieldErrors = state.fieldErrors;
  const showPasswordRequirements =
    fieldErrors?.password === PASSWORD_REQUIREMENTS_ERROR;
  const alertError =
    state.error && state.error !== PASSWORD_REQUIREMENTS_ERROR
      ? state.error
      : null;

  return (
    <form
      key={state.formKey ?? "register"}
      action={formAction}
      className="flex flex-col gap-5"
      noValidate
    >
      <AuthMotionField
        index={0}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.firstName}
          <AuthAnimatedInput
            required
            name="firstName"
            autoComplete="given-name"
            defaultValue={values?.firstName ?? ""}
            aria-invalid={Boolean(fieldErrors?.firstName)}
            className={authFieldClassName(Boolean(fieldErrors?.firstName))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.lastName}
          <AuthAnimatedInput
            required
            name="lastName"
            autoComplete="family-name"
            defaultValue={values?.lastName ?? ""}
            aria-invalid={Boolean(fieldErrors?.lastName)}
            className={authFieldClassName(Boolean(fieldErrors?.lastName))}
          />
        </label>
      </AuthMotionField>

      <AuthMotionField
        index={1}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.email}
          <AuthAnimatedInput
            required
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={values?.email ?? ""}
            aria-invalid={Boolean(fieldErrors?.email)}
            className={authFieldClassName(Boolean(fieldErrors?.email))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.phone}
          <AuthAnimatedInput
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={values?.phone ?? ""}
            aria-invalid={Boolean(fieldErrors?.phone)}
            className={authFieldClassName(Boolean(fieldErrors?.phone))}
          />
        </label>
      </AuthMotionField>

      <AuthMotionField
        index={2}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        <PasswordField
          name="password"
          label={dictionary.password}
          showPasswordLabel={dictionary.showPassword}
          hidePasswordLabel={dictionary.hidePassword}
          autoComplete="new-password"
          defaultValue={values?.password}
          invalid={Boolean(fieldErrors?.password)}
        />
        <PasswordField
          name="confirmPassword"
          label={dictionary.confirmPassword}
          showPasswordLabel={dictionary.showPassword}
          hidePasswordLabel={dictionary.hidePassword}
          autoComplete="new-password"
          defaultValue={values?.confirmPassword}
          invalid={Boolean(fieldErrors?.confirmPassword)}
        />
      </AuthMotionField>

      {showPasswordRequirements ? (
        <AuthMotionField index={3}>
          <PasswordRequirementsDisclaimer
            title={dictionary.passwordRequirementsTitle}
            rules={dictionary.passwordRequirements}
          />
        </AuthMotionField>
      ) : null}

      {alertError ? (
        <AuthMotionField index={3}>
          <p
            role="alert"
            className="rounded-[10px] border-2 border-red-700 bg-red-50 p-3 text-sm font-medium text-red-800"
          >
            {alertError}
          </p>
        </AuthMotionField>
      ) : null}

      <AuthMotionField index={3}>
        <AuthTermsAgreement
          locale={locale}
          dictionary={dictionary}
          defaultChecked={values?.acceptTerms === "on"}
          invalid={Boolean(fieldErrors?.acceptTerms)}
        />
      </AuthMotionField>

      <AuthMotionField index={4}>
        <button
          type="submit"
          disabled={isPending}
          className={AUTH_BTN_PRIMARY_CLASS}
        >
          {isPending
            ? dictionary.submittingRegister
            : dictionary.submitRegister}
        </button>
      </AuthMotionField>

      <AuthMotionField index={5}>
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
      </AuthMotionField>
    </form>
  );
}
