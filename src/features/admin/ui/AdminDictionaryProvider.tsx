"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AdminDictionary } from "@/lib/i18n/get-dictionary";

const AdminDictionaryContext = createContext<AdminDictionary | null>(null);

type AdminDictionaryProviderProps = {
  dictionary: AdminDictionary;
  children: ReactNode;
};

/** Provides admin UI chrome copy for the active storefront locale. */
export function AdminDictionaryProvider({
  dictionary,
  children,
}: AdminDictionaryProviderProps) {
  return (
    <AdminDictionaryContext.Provider value={dictionary}>
      {children}
    </AdminDictionaryContext.Provider>
  );
}

/** Admin locale dictionary (menu, common actions, feature chrome). */
export function useAdminDictionary(): AdminDictionary {
  const dictionary = useContext(AdminDictionaryContext);
  if (!dictionary) {
    throw new Error("useAdminDictionary must be used within AdminDictionaryProvider");
  }
  return dictionary;
}

export { formatAdminMessage } from "@/features/admin/ui/format-admin-message";
