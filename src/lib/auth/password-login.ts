import type { UserStatus } from "@/features/users/domain/user-lifecycle";
import { realInboxEmail } from "@/lib/auth/otp/sms-placeholder-user";

/**
 * Password login gate shared by the existing login action.
 * Inactive, missing, or wrong-password attempts all fail closed.
 */
export function isPasswordLoginAllowed(input: {
  userFound: boolean;
  passwordMatches: boolean;
  status: UserStatus | null;
}): boolean {
  return (
    input.userFound && input.passwordMatches && input.status === "ACTIVE"
  );
}

/**
 * A stored password may be checked only for a real inbox.
 * Null email, an SMS placeholder, and a null hash are not login credentials.
 */
export function mayCheckStoredPassword(input: {
  email: string | null;
  passwordHash: string | null;
}): input is { email: string; passwordHash: string } {
  return realInboxEmail(input.email) !== null && input.passwordHash !== null;
}

/**
 * Reset mail goes only to an active account's real inbox.
 * A placeholder is not a recipient.
 */
export function passwordResetRecipient(input: {
  email: string | null;
  status: UserStatus;
}): string | null {
  if (input.status !== "ACTIVE") {
    return null;
  }
  return realInboxEmail(input.email);
}
