"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_LABEL,
  ADMIN_SECTION_TITLE,
  ADMIN_SELECT,
} from "@/features/admin/ui/admin-form-classes";
import { updateUserRoleAction } from "@/features/users/application/update-user";
import {
  USER_ROLES,
  type UserRole,
} from "@/features/users/domain/user-lifecycle";
import { adminUserRoleLabel } from "@/features/users/ui/admin-user-labels";

type UpdateUserRoleFormProps = {
  locale: string;
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
};

export function UpdateUserRoleForm({
  locale,
  userId,
  currentRole,
  disabled = false,
}: UpdateUserRoleFormProps) {
  const dictionary = useAdminDictionary();
  const forms = dictionary.users.forms;
  const common = dictionary.common;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const role = String(formData.get("role") ?? "") as UserRole;

          startTransition(async () => {
            setError(null);
            const result = await updateUserRoleAction(locale, { userId, role });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <h3 className={ADMIN_SECTION_TITLE}>{forms.role}</h3>
        <p className="text-sm text-gray-700">
          {forms.current}:{" "}
          <strong className="text-gray-900">
            {adminUserRoleLabel(currentRole, dictionary.users.roles)}
          </strong>
        </p>
        <label>
          <span className={ADMIN_LABEL}>{forms.newRole}</span>
          <select
            name="role"
            required
            className={ADMIN_SELECT}
            defaultValue={currentRole === "ADMIN" ? "CUSTOMER" : "ADMIN"}
            disabled={disabled || isPending}
          >
            {USER_ROLES.filter((role) => role !== currentRole).map((role) => (
              <option key={role} value={role}>
                {adminUserRoleLabel(role, dictionary.users.roles)}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={disabled || isPending}>
          {isPending ? common.updating : forms.updateRole}
        </Button>
      </form>
    </Card>
  );
}
