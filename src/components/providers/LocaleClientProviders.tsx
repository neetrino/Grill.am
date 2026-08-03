"use client";

import type { ReactNode } from "react";

import {
  ConfirmDeleteProvider,
  type ConfirmDeleteDefaultLabels,
} from "@/components/modal/ConfirmDeleteProvider";

type LocaleClientProvidersProps = {
  children: ReactNode;
  confirmDeleteLabels: ConfirmDeleteDefaultLabels;
};

/** Client providers shared by storefront + admin under `[locale]`. */
export function LocaleClientProviders({
  children,
  confirmDeleteLabels,
}: LocaleClientProvidersProps) {
  return (
    <ConfirmDeleteProvider labels={confirmDeleteLabels}>
      {children}
    </ConfirmDeleteProvider>
  );
}
