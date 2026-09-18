"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AdminSelect } from "@/features/admin/ui/AdminSelect";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateUserRoleAction } from "@/features/users/application/update-user";
import {
  USER_ROLES,
  type UserRole,
} from "@/features/users/domain/user-lifecycle";
import {
  ADMIN_USER_PILL_TRIGGER_CLASS,
  adminUserRoleLabel,
  adminUserRolePillClass,
} from "@/features/users/ui/admin-user-labels";

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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();

  const roleOptions = USER_ROLES.map((item) => ({
    value: item,
    label: adminUserRoleLabel(item, dictionary.users.roles),
  }));

  function onRoleChange(next: string): void {
    if (!USER_ROLES.includes(next as UserRole)) {
      return;
    }
    const nextRole = next as UserRole;
    setRole(nextRole);
    if (nextRole === currentRole || disabled) {
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await updateUserRoleAction(locale, {
        userId,
        role: nextRole,
      });
      if (!result.ok) {
        setRole(currentRole);
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="w-fit shrink-0">
      <AdminSelect
        label={forms.role}
        name="userRole"
        value={role}
        options={roleOptions}
        placeholder={forms.newRole}
        disabled={disabled || isPending}
        onChange={onRoleChange}
        hideLabel
        fitContent
        triggerClassName={`${ADMIN_USER_PILL_TRIGGER_CLASS} ${adminUserRolePillClass(role)}`}
      />
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
