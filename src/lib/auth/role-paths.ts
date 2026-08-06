import {
  isStaffRole,
  type UserRole,
} from "@/features/users/domain/user-lifecycle";
import type { Locale } from "@/lib/i18n/config";

/** Whether the path is within the admin orders section for a locale. */
export function isAdminOrdersPath(pathname: string, locale: Locale): boolean {
  const base = `/${locale}/admin/orders`;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** Default destination after a successful login for the given role. */
export function defaultPostLoginPath(locale: Locale, role: UserRole): string {
  if (role === "ADMIN") {
    return `/${locale}/admin`;
  }
  if (role === "OPERATOR") {
    return `/${locale}/admin/orders`;
  }
  return `/${locale}/profile`;
}

/** Staff home link for account menu (admin dashboard or operator orders). */
export function staffHomePath(locale: Locale, role: UserRole): string | null {
  if (!isStaffRole(role)) {
    return null;
  }
  return role === "OPERATOR"
    ? `/${locale}/admin/orders`
    : `/${locale}/admin`;
}
