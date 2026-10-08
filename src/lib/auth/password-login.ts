import type { UserStatus } from "@/features/users/domain/user-lifecycle";

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
