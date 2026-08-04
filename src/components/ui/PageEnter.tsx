import type { ReactNode } from "react";

type PageEnterProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Soft opacity + rise enter for route content.
 * Remount via `template.tsx` (or a pathname `key`) to replay on navigation.
 */
export function PageEnter({ children, className }: PageEnterProps) {
  return (
    <div className={className ? `page-enter ${className}` : "page-enter"}>
      {children}
    </div>
  );
}
