import { isContactStatus } from "@/features/contact/domain/contact-rules";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type ContactStatusLabels = AdminDictionary["messages"]["status"];

/** Badge wash for a contact-message status. */
export function contactStatusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "UNREAD") return "bg-brand-yellow/25 text-brand-ink";
  if (normalized === "READ") return "bg-sky-100 text-sky-800";
  if (normalized === "REPLIED") return "bg-green-100 text-green-800";
  if (normalized === "ARCHIVED") return "bg-gray-100 text-gray-800";
  return "bg-gray-100 text-gray-800";
}

/** Maps a stored contact status to admin dictionary copy. */
export function contactStatusLabel(
  status: string,
  labels: ContactStatusLabels,
): string {
  if (!isContactStatus(status)) return status;
  if (status === "UNREAD") return labels.unread;
  if (status === "READ") return labels.read;
  if (status === "REPLIED") return labels.replied;
  return labels.archived;
}
