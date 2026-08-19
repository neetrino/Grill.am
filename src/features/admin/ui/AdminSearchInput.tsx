import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";

import {
  ADMIN_SEARCH_FIELD,
  ADMIN_SEARCH_WRAP,
} from "@/features/admin/ui/admin-form-classes";

type AdminSearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

/** Admin search field with a leading magnifying-glass icon. */
export function AdminSearchInput({
  className = "",
  disabled,
  ...props
}: AdminSearchInputProps) {
  return (
    <div
      className={`${ADMIN_SEARCH_WRAP} ${disabled ? "opacity-50" : ""} ${className}`.trim()}
    >
      <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      <input
        type="search"
        className={ADMIN_SEARCH_FIELD}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}
