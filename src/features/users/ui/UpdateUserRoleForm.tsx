"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
        <h3 className={ADMIN_SECTION_TITLE}>Role</h3>
        <p className="text-sm text-gray-700">
          Current: <strong className="text-gray-900">{currentRole}</strong>
        </p>
        <label>
          <span className={ADMIN_LABEL}>New role</span>
          <select
            name="role"
            required
            className={ADMIN_SELECT}
            defaultValue={currentRole === "ADMIN" ? "CUSTOMER" : "ADMIN"}
            disabled={disabled || isPending}
          >
            {USER_ROLES.filter((role) => role !== currentRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={disabled || isPending}>
          {isPending ? "Updating…" : "Update role"}
        </Button>
      </form>
    </Card>
  );
}
