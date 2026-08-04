"use client";

import { AdminBrandLogo } from "@/features/admin/ui/AdminBrandLogo";
import { useAdminDictionary } from "@/features/admin/ui/AdminDictionaryProvider";
import { useAdminSidebarCollapse } from "@/features/admin/ui/AdminSidebarCollapseContext";

type AdminSidebarBrandProps = {
  locale: string;
};

export function AdminSidebarBrand({ locale }: AdminSidebarBrandProps) {
  const { collapsed, toggleCollapsed } = useAdminSidebarCollapse();
  const dictionary = useAdminDictionary();
  const sidebarToggleLabel = collapsed
    ? dictionary.menu.expandSidebar
    : dictionary.menu.collapseSidebar;

  return (
    <div
      className={`flex shrink-0 border-b border-gray-200/80 pb-3 pt-2 ${
        collapsed
          ? "flex-col items-center gap-2 px-1"
          : "items-center gap-1 px-2"
      }`}
    >
      <div className={collapsed ? undefined : "min-w-0 flex-1"}>
        <AdminBrandLogo
          locale={locale}
          brandName={dictionary.menu.brandName}
          storeHomeLabel={dictionary.menu.storeHome}
          compact={collapsed}
        />
      </div>
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:bg-brand-surface hover:text-gray-900"
        aria-expanded={!collapsed}
        aria-label={sidebarToggleLabel}
        title={sidebarToggleLabel}
      >
        {collapsed ? (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
