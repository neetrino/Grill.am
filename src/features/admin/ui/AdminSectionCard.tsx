import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { ADMIN_SECTION_TITLE } from "@/features/admin/ui/admin-form-classes";
import { ADMIN_CARD_CLASS } from "@/features/admin/ui/admin-ui";

type AdminSectionCardProps = {
  icon: ReactNode;
  title: ReactNode;
  /** Trailing control rendered next to the title (download, link, …). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Admin detail section: brand icon medallion, title and body content. */
export function AdminSectionCard({
  icon,
  title,
  action,
  children,
  className = "",
}: AdminSectionCardProps) {
  return (
    <Card
      className={`overflow-visible !border-0 !shadow-none p-5 sm:p-6 ${ADMIN_CARD_CLASS} ${className}`.trim()}
    >
      <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={ADMIN_SECTION_TITLE}>{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </Card>
  );
}
