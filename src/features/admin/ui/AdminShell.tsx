"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

import { AdminDictionaryProvider } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminSidebar } from "@/features/admin/ui/AdminSidebar";
import { AdminSidebarCollapseProvider } from "@/features/admin/ui/AdminSidebarCollapseContext";
import styles from "@/features/admin/ui/AdminSidebarNav.module.css";
import {
  ADMIN_MAIN_COLUMN,
  ADMIN_MAIN_INNER,
  ADMIN_PAGE_SHELL,
} from "@/features/admin/ui/admin-shell-classes";
import { ADMIN_NAV_TRANSITION_MS } from "@/features/admin/ui/admin-ui";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type AdminShellProps = {
  locale: string;
  dictionary: AdminDictionary;
  children: ReactNode;
};

export function AdminShell({ locale, dictionary, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <AdminDictionaryProvider dictionary={dictionary}>
      <AdminSidebarCollapseProvider>
        <div className={ADMIN_PAGE_SHELL}>
          <AdminSidebar locale={locale} />
          <div className={ADMIN_MAIN_COLUMN}>
            <div
              key={pathname}
              className={`${ADMIN_MAIN_INNER} ${styles.pageEnter}`}
              style={
                {
                  "--admin-nav-ms": `${ADMIN_NAV_TRANSITION_MS}ms`,
                } as CSSProperties
              }
            >
              {children}
            </div>
          </div>
        </div>
      </AdminSidebarCollapseProvider>
    </AdminDictionaryProvider>
  );
}
