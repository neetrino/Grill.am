"use client";

import { Send, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SegmentedControl } from "@/components/layout/SegmentedControl";
import { ADMIN_BTN_PRIMARY_CLASS } from "@/features/admin/ui/admin-ui";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { updateUserRoleAction } from "@/features/users/application/update-user";
import {
  USER_ROLES,
  type UserRole,
} from "@/features/users/domain/user-lifecycle";
import { AdminUserActionCard } from "@/features/users/ui/AdminUserActionCard";
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
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();

  const roleOptions = USER_ROLES.map((item) => ({
    value: item,
    label: adminUserRoleLabel(item, dictionary.users.roles),
  }));

  return (
    <AdminUserActionCard
      className="w-full md:w-fit md:shrink-0"
      icon={<Shield className="h-5 w-5" aria-hidden />}
      title={forms.role}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setError(null);
            const result = await updateUserRoleAction(locale, {
              userId,
              role,
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <div className="flex flex-nowrap items-center gap-3">
          <SegmentedControl
            aria-label={forms.newRole}
            value={role}
            options={roleOptions}
            size="md"
            fitContent
            disabled={disabled || isPending}
            onSelect={setRole}
          />
          <button
            type="submit"
            disabled={disabled || isPending || role === currentRole}
            className={`${ADMIN_BTN_PRIMARY_CLASS} shrink-0 gap-2`}
          >
            <Send className="h-4 w-4" aria-hidden />
            {isPending ? common.updating : common.update}
          </button>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>
    </AdminUserActionCard>
  );
}
