"use server";

import { getAdminContactMessageById } from "@/features/contact/application/queries";
import { requireAdmin } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

export type AdminContactMessageDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  spamScore: number | null;
  createdAt: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin-only fetch of a single contact message for the inbox sheet.
 */
export async function getAdminContactMessageAction(
  locale: string,
  messageId: string,
): Promise<Result<AdminContactMessageDetail>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const trimmed = messageId.trim();
  if (!UUID_RE.test(trimmed)) {
    return err("VALIDATION_ERROR", "Invalid message id.");
  }

  await requireAdmin(locale as Locale);

  const row = await getAdminContactMessageById(trimmed);
  if (!row) {
    return err("NOT_FOUND", "Message not found.");
  }

  return ok({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    spamScore: row.spamScore,
    createdAt: row.createdAt.toISOString(),
  });
}
