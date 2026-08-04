"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { SideSheet } from "@/components/drawer/SideSheet";
import {
  LegalDocumentView,
  type LegalDocumentCopy,
} from "@/features/legal/ui/LegalDocumentView";
import type { LegalPolicyKey } from "@/features/legal/ui/LegalPolicyPage";

export type LegalPolicyListItem = {
  key: LegalPolicyKey;
  copy: LegalDocumentCopy;
};

type LegalPoliciesHubProps = {
  title: string;
  lastUpdatedLabel: string;
  closeLabel: string;
  policies: LegalPolicyListItem[];
};

/**
 * Policies hub — list of legal documents; each opens in a side sheet.
 */
export function LegalPoliciesHub({
  title,
  lastUpdatedLabel,
  closeLabel,
  policies,
}: LegalPoliciesHubProps) {
  const [activeKey, setActiveKey] = useState<LegalPolicyKey | null>(null);
  const active = policies.find((policy) => policy.key === activeKey) ?? null;

  return (
    <>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>

        <ul className="flex flex-col gap-3">
          {policies.map((policy) => (
            <li key={policy.key}>
              <button
                type="button"
                onClick={() => setActiveKey(policy.key)}
                className="flex w-full items-center justify-between gap-3 rounded-[15px] bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-gray-100/80 transition hover:bg-gray-50"
              >
                <span className="text-base font-semibold text-gray-900">
                  {policy.copy.title}
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-brand-red"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <SideSheet
        open={active != null}
        onClose={() => setActiveKey(null)}
        title={active?.copy.title ?? title}
        closeLabel={closeLabel}
        desktopWidthPercent={40}
        mobileMaxWidthClassName="max-w-2xl"
      >
        {active ? (
          <LegalDocumentView
            copy={active.copy}
            lastUpdatedLabel={lastUpdatedLabel}
            variant="sheet"
          />
        ) : null}
      </SideSheet>
    </>
  );
}
