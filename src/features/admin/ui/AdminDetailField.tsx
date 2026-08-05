import type { ReactNode } from "react";

type AdminDetailFieldProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

/** Labelled detail row with a brand icon chip — admin detail summary cards. */
export function AdminDetailField({
  icon,
  label,
  children,
}: AdminDetailFieldProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-brand-red/10 text-brand-red">
        {icon}
      </span>
      <span className="w-[104px] shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 flex-1 break-words font-medium text-gray-900">
        {children}
      </span>
    </div>
  );
}
