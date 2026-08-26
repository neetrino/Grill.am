"use client";

import { Mail, Phone } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { ProfileSidebarNav } from "@/features/profile/ui/ProfileSidebarNav";
import {
  PROFILE_CARD_CLASS,
  PROFILE_SIDEBAR_ICON_TONE,
} from "@/features/profile/ui/profile-ui";
import { logoutAction } from "@/features/auth/logout-action";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

type ProfileSidebarProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["profile"];
};

function ProfileContactRow({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[15px] bg-white px-4 py-3 ring-1 ring-gray-100/80">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: PROFILE_SIDEBAR_ICON_TONE.background,
          color: PROFILE_SIDEBAR_ICON_TONE.foreground,
        }}
      >
        {icon}
      </span>
      <p className="whitespace-nowrap text-sm font-medium text-gray-700">
        {value}
      </p>
    </div>
  );
}

export function ProfileSidebar({
  locale,
  user,
  dictionary,
}: ProfileSidebarProps) {
  const logoutWithLocale = logoutAction.bind(null, locale);
  const initials = `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase();
  const asideRef = useRef<HTMLElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside || typeof window === "undefined") {
      return;
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function onWheel(event: WheelEvent): void {
      if (!desktopQuery.matches || event.ctrlKey) {
        return;
      }

      const nav = navScrollRef.current;
      if (nav) {
        const maxScroll = nav.scrollHeight - nav.clientHeight;
        if (maxScroll > 0 && nav.contains(event.target as Node)) {
          const atTop = nav.scrollTop <= 0;
          const atBottom = nav.scrollTop >= maxScroll - 1;
          if (
            (event.deltaY < 0 && !atTop) ||
            (event.deltaY > 0 && !atBottom)
          ) {
            return;
          }
        }
      }

      window.scrollBy({ top: event.deltaY, left: 0 });
      event.preventDefault();
    }

    aside.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      aside.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <aside
      ref={asideRef}
      className={`relative flex h-full max-h-full min-h-0 w-max min-w-[var(--profile-sidebar-width)] flex-col overflow-hidden p-4 pt-3 ${PROFILE_CARD_CLASS}`}
      aria-label={dictionary.title}
    >
      <div className="shrink-0">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-xl font-semibold text-white shadow-md">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <ProfileContactRow
            icon={<Mail className="h-4 w-4" aria-hidden />}
            value={user.email}
          />
          {user.phone ? (
            <ProfileContactRow
              icon={<Phone className="h-4 w-4" aria-hidden />}
              value={user.phone}
            />
          ) : null}
        </div>
      </div>

      <ProfileSidebarNav
        locale={locale}
        dictionary={dictionary}
        logoutAction={logoutWithLocale}
        scrollContainerRef={navScrollRef}
      />
    </aside>
  );
}
