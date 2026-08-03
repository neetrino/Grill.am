"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import type { Locale } from "@/lib/i18n/config";

type ProfileMobileBackLinkProps = {
  locale: Locale;
  label: string;
};

export function ProfileMobileBackLink({
  locale,
  label,
}: ProfileMobileBackLinkProps) {
  const pathname = usePathname();
  const profileRoot = `/${locale}/profile`;

  if (pathname === profileRoot) {
    return null;
  }

  return (
    <div className="mb-4 lg:hidden">
      <AppLink
        href={profileRoot}
        prefetchPolicy="intent"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {label}
      </AppLink>
    </div>
  );
}
