"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  updateProfileAction,
  type UpdateProfileActionState,
} from "@/features/auth/update-profile-action";
import {
  PROFILE_BTN_PRIMARY_CLASS,
  PROFILE_BTN_SECONDARY_CLASS,
  PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS,
} from "@/features/profile/ui/profile-ui";

const FIELD_CLASS =
  "h-11 w-full rounded-[15px] border border-gray-200 px-3 text-gray-900 outline-none transition focus:border-brand-red/40 focus:ring-2 focus:ring-brand-red/15";

type PersonalInformationFormProps = {
  locale: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  labels: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    cancel: string;
    save: string;
    saving: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
  };
};

const initialState: UpdateProfileActionState = {};

export function PersonalInformationForm({
  locale,
  firstName,
  lastName,
  email,
  phone,
  labels,
}: PersonalInformationFormProps) {
  const action = updateProfileAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [values, setValues] = useState({
    firstName,
    lastName,
    email,
    phone,
  });

  useEffect(() => {
    setValues({ firstName, lastName, email, phone });
  }, [firstName, lastName, email, phone]);

  function resetToSaved(): void {
    setValues({ firstName, lastName, email, phone });
  }

  return (
    <Card className={`rounded-[15px] border-0 p-5 shadow-none ring-1 ring-gray-100/80 sm:p-7 lg:p-8 ${PROFILE_MOBILE_FORM_SECTION_FRAMELESS_CLASS}`}>
      <div className="mb-8 border-b border-gray-100 pb-5 sm:mb-10 sm:pb-6">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {labels.title}
        </h1>
      </div>

      <form
        action={formAction}
        className="mx-auto max-w-xl space-y-6 lg:mx-0 lg:max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.firstName}
            <input
              name="firstName"
              required
              value={values.firstName}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
              placeholder={labels.firstNamePlaceholder}
              className={FIELD_CLASS}
              autoComplete="given-name"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.lastName}
            <input
              name="lastName"
              required
              value={values.lastName}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
              placeholder={labels.lastNamePlaceholder}
              className={FIELD_CLASS}
              autoComplete="family-name"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.email}
            <input
              name="email"
              type="email"
              required
              value={values.email}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder={labels.emailPlaceholder}
              className={FIELD_CLASS}
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.phone}
            <input
              name="phone"
              type="tel"
              required
              value={values.phone}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder={labels.phonePlaceholder}
              className={FIELD_CLASS}
              autoComplete="tel"
            />
          </label>
        </div>

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

        <div className="flex flex-row items-center gap-3 pt-2 sm:gap-4 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className={`${PROFILE_BTN_SECONDARY_CLASS} min-w-0 flex-1 sm:flex-none`}
            onClick={resetToSaved}
            disabled={isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={`${PROFILE_BTN_PRIMARY_CLASS} min-w-0 flex-1 sm:flex-none`}
            disabled={isPending}
          >
            {isPending ? labels.saving : labels.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
