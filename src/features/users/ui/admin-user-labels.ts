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
