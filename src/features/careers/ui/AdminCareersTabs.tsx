"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AdminCareersTab = "postings" | "applications";

type AdminCareersTabsProps = {
  locale: string;
  postingsLabel: string;
  applicationsLabel: string;
};

const TAB_ORDER: readonly AdminCareersTab[] = ["postings", "applications"];

function activeTabFromPath(pathname: string): AdminCareersTab {
  return pathname.includes("/careers/applications")
    ? "applications"
    : "postings";
}

/** Careers admin underline tabs with a sliding indicator (path-driven). */
export function AdminCareersTabs({
  locale,
  postingsLabel,
  applicationsLabel,
}: AdminCareersTabsProps) {
  const base = `/${locale}/admin/careers`;
  const tabs = [
    { id: "postings" as const, label: postingsLabel, href: base },
    {
      id: "applications" as const,
      label: applicationsLabel,
      href: `${base}/applications`,
    },
  ];

  const pathname = usePathname();
  const activeTab = activeTabFromPath(pathname);

  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  /** Optimistic selection so the underline slides on click, before navigation. */
  const [selected, setSelected] = useState<AdminCareersTab>(activeTab);
  const [syncedActive, setSyncedActive] = useState<AdminCareersTab>(activeTab);
  const [bounds, setBounds] = useState<{ left: number; width: number } | null>(
    null,
  );

  if (activeTab !== syncedActive) {
    setSyncedActive(activeTab);
    setSelected(activeTab);
  }

  useEffect(() => {
    const nav = navRef.current;
    const tab = tabRefs.current[TAB_ORDER.indexOf(selected)];
    if (!nav || !tab) {
      return;
    }

    const measure = (): void => {
      setBounds({ left: tab.offsetLeft, width: tab.offsetWidth });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [selected]);

  return (
    <nav
      ref={navRef}
      className="relative mb-6 flex flex-wrap gap-6 border-b border-gray-200"
      aria-label={postingsLabel}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.id === selected;
        return (
          <Link
            key={tab.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            href={tab.href}
            prefetch
            className={`px-1 pb-3 text-sm font-semibold transition-colors duration-300 ${
              isSelected
                ? "text-brand-red"
                : "text-gray-500 hover:text-gray-900"
            }`}
            aria-current={tab.id === activeTab ? "page" : undefined}
            onClick={() => setSelected(tab.id)}
          >
            {tab.label}
          </Link>
        );
      })}

      {bounds ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-px h-[2px] rounded-full bg-brand-red transition-[left,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ left: bounds.left, width: bounds.width }}
        />
      ) : null}
    </nav>
  );
}
