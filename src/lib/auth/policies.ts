import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isAdminOrdersPath } from "@/lib/auth/role-paths";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";

/** Requires an active authenticated user for a protected server flow. */
export async function requireUser(locale: Locale): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect(`/${locale}/login`);
  }

  return user;
}

/** Requires an active administrator for a protected server flow. */
export async function requireAdmin(locale: Locale): Promise<SessionUser> {
  const user = await requireUser(locale);

  if (user.role !== "ADMIN") {
    redirect(`/${locale}`);
  }

  return user;
}

/**
 * Requires ADMIN or OPERATOR for order management flows.
 * Operators may change status, payment, notes, and archive within orders only.
 */
export async function requireOrdersStaff(
  locale: Locale,
): Promise<SessionUser> {
  const user = await requireUser(locale);

  if (user.role === "ADMIN" || user.role === "OPERATOR") {
    return user;
  }

  redirect(`/${locale}`);
}

/**
 * Requires staff access to the admin panel.
 * Operators are limited to `/admin/orders` (and nested order routes).
 */
export async function requireAdminPanel(
  locale: Locale,
): Promise<SessionUser> {
  const user = await requireUser(locale);

  if (user.role === "ADMIN") {
    return user;
  }

  if (user.role === "OPERATOR") {
    const pathname = (await headers()).get("x-pathname") ?? "";
    if (!isAdminOrdersPath(pathname, locale)) {
      redirect(`/${locale}/admin/orders`);
    }
    return user;
  }

  redirect(`/${locale}`);
}
