"use client";

import type { ReactNode } from "react";

import { AdminDictionaryProvider } from "@/features/admin/ui/AdminDictionaryProvider";
import { AdminSidebar } from "@/features/admin/ui/AdminSidebar";
import { AdminSidebarCollapseProvider } from "@/features/admin/ui/AdminSidebarCollapseContext";
import {
  ADMIN_MAIN_COLUMN,
  ADMIN_MAIN_INNER,
  ADMIN_PAGE_SHELL,
} from "@/features/admin/ui/admin-shell-classes";
import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

type AdminShellProps = {
  locale: string;
  dictionary: AdminDictionary;
  children: ReactNode;
};

export function AdminShell({ locale, dictionary, children }: AdminShellProps) {
  return (
    <AdminDictionaryProvider dictionary={dictionary}>
      <AdminSidebarCollapseProvider>
        <div className={ADMIN_PAGE_SHELL}>
          <AdminSidebar locale={locale} />
          <div className={ADMIN_MAIN_COLUMN}>
            <div className={ADMIN_MAIN_INNER}>{children}</div>
          </div>
        </div>
      </AdminSidebarCollapseProvider>
    </AdminDictionaryProvider>
  );
}
