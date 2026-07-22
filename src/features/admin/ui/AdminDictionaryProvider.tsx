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

/** Replaces `{name}` placeholders in admin message templates. */
export function formatAdminMessage(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    return values[key] ?? "";
  });
}
