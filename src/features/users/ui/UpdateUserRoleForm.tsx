"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";
import { AdminSelect } from "@/features/admin/ui/AdminSelect";
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
  const roleOptions = USER_ROLES.filter((role) => role !== currentRole).map(
    (role) => ({
      value: role,
      label: adminUserRoleLabel(role, dictionary.users.roles),
    }),
  );
  const [role, setRole] = useState(roleOptions[0]?.value ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <Card className={`overflow-visible !border-0 !shadow-none p-6 ${ADMIN_CARD_CLASS}`}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextRole = String(formData.get("role") ?? "") as UserRole;

          startTransition(async () => {
            setError(null);
            const result = await updateUserRoleAction(locale, {
              userId,
              role: nextRole,
            });
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
        <AdminSelect
          name="role"
          label={forms.newRole}
          placeholder={forms.newRole}
          required
          options={roleOptions}
          value={role}
          disabled={disabled || isPending}
          onChange={setRole}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={disabled || isPending}>
          {isPending ? common.updating : forms.updateRole}
        </Button>
      </form>
    </Card>
  );
}
