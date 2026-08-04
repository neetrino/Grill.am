import type { ZodError } from "zod";

export type AuthFieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "password"
    | "confirmPassword"
    | "acceptTerms",
    string
  >
>;

export type AuthFormValues = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "password"
    | "confirmPassword"
    | "acceptTerms",
    string
  >
>;

export type AuthActionState = {
  error?: string;
  fieldErrors?: AuthFieldErrors;
  values?: AuthFormValues;
  /** Remount key so defaultValues re-apply after a failed submit. */
  formKey?: number;
};

/** Reads string fields from FormData for round-tripping after validation errors. */
export function readAuthFormValues(
  formData: FormData,
  keys: readonly (keyof AuthFormValues)[],
): AuthFormValues {
  const values: AuthFormValues = {};
  for (const key of keys) {
    const raw = formData.get(key);
    if (typeof raw === "string") {
      values[key] = raw;
    }
  }
  return values;
}

/** Maps the first Zod issue per path into a flat field-error record. */
export function mapZodFieldErrors(error: ZodError): AuthFieldErrors {
  const fieldErrors: AuthFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string" || key in fieldErrors) {
      continue;
    }
    fieldErrors[key as keyof AuthFieldErrors] = issue.message;
  }
  return fieldErrors;
}
