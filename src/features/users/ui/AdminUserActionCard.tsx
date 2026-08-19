import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";

type AdminUserActionCardProps = {
  icon: ReactNode;
  title: string;
  className?: string;
  children: ReactNode;
};

/** User detail action card: icon + title on one row, controls below. */
export function AdminUserActionCard({
  icon,
  title,
  className = "",
  children,
}: AdminUserActionCardProps) {
  return (
    <Card
      className={`overflow-visible !border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS} ${className}`.trim()}
    >
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red">
          {icon}
        </span>
        <h2 className={ADMIN_SECTION_TITLE}>{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
