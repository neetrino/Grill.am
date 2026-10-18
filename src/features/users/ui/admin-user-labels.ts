import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type UserRoleLabels = AdminDictionary["users"]["roles"];
type UserStatusLabels = AdminDictionary["users"]["statuses"];

/** Maps DB user role to admin dictionary label. */
export function adminUserRoleLabel(
  role: string,
  labels: UserRoleLabels,
): string {
  switch (role) {
    case "ADMIN":
      return labels.admin;
    case "OPERATOR":
      return labels.operator;
    case "CUSTOMER":
      return labels.customer;
    default:
      return role;
  }
}

/** Maps DB user status to admin dictionary label. */
export function adminUserStatusLabel(
  status: string,
  labels: UserStatusLabels,
): string {
  switch (status) {
    case "ACTIVE":
      return labels.active;
    case "SUSPENDED":
      return labels.suspended;
    case "ANONYMIZED":
      return labels.anonymized;
    default:
      return status;
  }
}

/** Colorful pill classes for role selects / badges. */
export function adminUserRolePillClass(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-blue-100 text-blue-800";
    case "OPERATOR":
      return "bg-amber-100 text-amber-800";
    case "CUSTOMER":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/** Colorful pill classes for status selects / badges. */
export function adminUserStatusPillClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "SUSPENDED":
      return "bg-yellow-100 text-yellow-800";
    case "ANONYMIZED":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export const ADMIN_USER_PILL_TRIGGER_CLASS =
  "!h-9 !rounded-full border-0 px-3.5 shadow-none focus-visible:ring-2 focus-visible:ring-brand-red/20 disabled:opacity-60";
