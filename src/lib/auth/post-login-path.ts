import type { UserRole } from "@/features/users/domain/user-lifecycle";
import { defaultPostLoginPath } from "@/lib/auth/role-paths";
import type { Locale } from "@/lib/i18n/config";

/** Same-origin, locale-prefixed path. Anything else uses the role default. */
export function resolveSafeNextPath(
  locale: Locale,
  role: UserRole,
  raw: FormDataEntryValue | null,
): string {
  const fallback = defaultPostLoginPath(locale, role);

  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  if (!raw.startsWith(`/${locale}/`)) {
    return fallback;
  }

  return raw;
}
