"use client";

import { useActionState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import type { AuthActionState } from "@/features/auth/ui/auth-action-state";
import { registerAction } from "@/features/auth/register-action";
import { PASSWORD_REQUIREMENTS_ERROR } from "@/features/auth/schemas";
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.firstName}
          <input
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
          <input
            required
            name="lastName"
            autoComplete="family-name"
            defaultValue={values?.lastName ?? ""}
            aria-invalid={Boolean(fieldErrors?.lastName)}
            className={authFieldClassName(Boolean(fieldErrors?.lastName))}
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
            defaultValue={values?.email ?? ""}
            aria-invalid={Boolean(fieldErrors?.email)}
            className={authFieldClassName(Boolean(fieldErrors?.email))}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {dictionary.phone}
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={values?.phone ?? ""}
            aria-invalid={Boolean(fieldErrors?.phone)}
            className={authFieldClassName(Boolean(fieldErrors?.phone))}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
      </div>

      {showPasswordRequirements ? (
        <PasswordRequirementsDisclaimer
          title={dictionary.passwordRequirementsTitle}
          rules={dictionary.passwordRequirements}
        />
      ) : null}

      {alertError ? (
        <p
          role="alert"
          className="rounded-[15px] border border-red-200 bg-red-50 p-3 text-sm text-red-600"
        >
          {alertError}
        </p>
      ) : null}

      <AuthTermsAgreement
        locale={locale}
        dictionary={dictionary}
        defaultChecked={values?.acceptTerms === "on"}
        invalid={Boolean(fieldErrors?.acceptTerms)}
      />

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
