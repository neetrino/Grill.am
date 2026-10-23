import { setPasswordSchema } from "@/features/auth/schemas";

/** Returned when this path is used after a password hash already exists. */
export const PASSWORD_ALREADY_SET_ERROR = "A password is already set.";

export type SetPasswordDecision =
  | { ok: true; password: string }
  | { ok: false; error: string };

/**
 * A first password may be stored only while no hash exists.
 * A present hash refuses this path. The new password uses `passwordSchema`.
 */
export function resolveSetPassword(input: {
  passwordHash: string | null;
  newPassword: unknown;
  confirmPassword: unknown;
}): SetPasswordDecision {
  if (input.passwordHash !== null) {
    return { ok: false, error: PASSWORD_ALREADY_SET_ERROR };
  }

  const parsed = setPasswordSchema.safeParse({
    newPassword: input.newPassword,
    confirmPassword: input.confirmPassword,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please check the password fields and try again.",
    };
  }

  return { ok: true, password: parsed.data.newPassword };
}
