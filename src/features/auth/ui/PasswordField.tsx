"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { AuthAnimatedInput } from "@/features/auth/ui/AuthMotionField";
import { authFieldClassName } from "@/features/auth/ui/auth-ui";

type PasswordFieldProps = {
  name: string;
  label: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  autoComplete: string;
  defaultValue?: string;
  invalid?: boolean;
  /** When set, the visible label is hidden and this text is shown in the field. */
  placeholder?: string;
};

export function PasswordField({
  name,
  label,
  showPasswordLabel,
  hidePasswordLabel,
  autoComplete,
  defaultValue,
  invalid = false,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hideLabel = Boolean(placeholder);

  return (
    <label
      className={
        hideLabel
          ? "block"
          : "flex flex-col gap-1.5 text-sm font-medium text-gray-700"
      }
    >
      {hideLabel ? null : label}
      <span className="relative block">
        <AuthAnimatedInput
          required
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={hideLabel ? label : undefined}
          aria-invalid={invalid}
          className={authFieldClassName(invalid, true)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center text-brand-ink/45 transition hover:text-brand-ink"
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </span>
    </label>
  );
}
