import { isUniqueViolation } from "@/features/payments/domain/postgres-errors";

export const USERS_VERIFIED_PHONE_UIDX = "users_verified_phone_uidx";

/**
 * The verified-phone update can only collide with `users_verified_phone_uidx`.
 * A 23505 that names another constraint is not translated.
 * A 23505 with no constraint name is treated as this collision because the
 * statement does not touch any other unique index.
 */
export function isVerifiedPhoneOwnershipConflict(error: unknown): boolean {
  if (!isUniqueViolation(error)) {
    return false;
  }
  if (isUniqueViolation(error, USERS_VERIFIED_PHONE_UIDX)) {
    return true;
  }
  return readConstraintName(error) === null;
}

function readConstraintName(error: unknown): string | null {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const record = current as { constraint?: unknown; cause?: unknown };
    if (typeof record.constraint === "string" && record.constraint.length > 0) {
      return record.constraint;
    }
    if ("cause" in record) {
      queue.push(record.cause);
    }
  }

  return null;
}
