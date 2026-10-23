"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  changePasswordAction,
  type ChangePasswordActionState,
} from "@/features/auth/change-password-action";
import {
  setPasswordAction,
  type SetPasswordActionState,
} from "@/features/auth/set-password-action";
import { PROFILE_BTN_PRIMARY_CLASS, PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS } from "@/features/profile/ui/profile-ui";
import { ProfilePageTitle } from "@/features/profile/ui/ProfilePageTitle";

const FIELD_CLASS =
  "h-11 w-full rounded-[15px] border border-gray-200 px-3 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15";

type PasswordFormState = ChangePasswordActionState | SetPasswordActionState;

type ChangePasswordFormProps = {
  locale: string;
  /** True when a password hash already exists. The hash itself stays on the server. */
  hasPassword: boolean;
  labels: {
    title: string;
    setTitle: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    currentPasswordPlaceholder: string;
    newPasswordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    change: string;
    changing: string;
    set: string;
    setting: string;
  };
};

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialState: PasswordFormState = {};

export function ChangePasswordForm({
  locale,
  hasPassword,
  labels,
}: ChangePasswordFormProps) {
  const action = (
    hasPassword ? changePasswordAction : setPasswordAction
  ).bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [values, setValues] = useState(emptyForm);
  // Tracks the `state.success` value last synced into `values`.
  const [syncedSuccess, setSyncedSuccess] = useState(state.success);

  // Clear the form once the action reports success — adjust during render
  // (React "adjusting state on prop change" pattern) instead of a
  // synchronous setState inside an effect.
  if (state.success !== syncedSuccess) {
    setSyncedSuccess(state.success);
    if (state.success) {
      setValues(emptyForm);
    }
  }

  let submitLabel = labels.set;
  if (hasPassword) {
    submitLabel = labels.change;
  }
  if (isPending) {
    submitLabel = hasPassword ? labels.changing : labels.setting;
  }

  return (
    <Card className={`rounded-[15px] border-0 p-5 shadow-none ring-1 ring-gray-100/80 sm:p-7 lg:p-8 ${PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS}`}>
      <div className="mb-8 border-b border-gray-100 pb-5 sm:mb-10 sm:pb-6">
        <ProfilePageTitle size="section">
          {hasPassword ? labels.title : labels.setTitle}
        </ProfilePageTitle>
      </div>

      <form
        action={formAction}
        className="max-w-sm space-y-5"
      >
        {hasPassword ? (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.currentPassword}
            <input
              name="currentPassword"
              type="password"
              required
              value={values.currentPassword}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  currentPassword: event.target.value,
                }))
              }
              placeholder={labels.currentPasswordPlaceholder}
              className={FIELD_CLASS}
              autoComplete="current-password"
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {labels.newPassword}
          <input
            name="newPassword"
            type="password"
            required
            value={values.newPassword}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                newPassword: event.target.value,
              }))
            }
            placeholder={labels.newPasswordPlaceholder}
            className={FIELD_CLASS}
            autoComplete="new-password"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {labels.confirmPassword}
          <input
            name="confirmPassword"
            type="password"
            required
            value={values.confirmPassword}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                confirmPassword: event.target.value,
              }))
            }
            placeholder={labels.confirmPasswordPlaceholder}
            className={FIELD_CLASS}
            autoComplete="new-password"
          />
        </label>

        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-700" role="status">
            {state.success}
          </p>
        ) : null}

        <div className="pt-2 sm:pt-4">
          <Button
            type="submit"
            variant="primary"
            className={`${PROFILE_BTN_PRIMARY_CLASS} w-full sm:w-auto`}
            disabled={isPending}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
