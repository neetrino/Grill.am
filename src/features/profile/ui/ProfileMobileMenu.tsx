"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronRight,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  TicketPercent,
  Trash2,
  User,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { ProfileMobileSheet } from "@/features/profile/ui/ProfileMobileSheet";
import {
  PROFILE_CARD_CLASS,
  PROFILE_ICON_TONE,
  type ProfileNavKey,
} from "@/features/profile/ui/profile-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SessionUser } from "@/lib/auth/session";

type ProfileMobileMenuProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["profile"];
  closeLabel: string;
  logoutAction: (formData: FormData) => void | Promise<void>;
  sheets: Partial<Record<ProfileNavKey, ReactNode>>;
};

type MenuRow = {
  key: ProfileNavKey;
  label: string;
  icon: ReactNode;
  danger?: boolean;
};

function MenuIconBox({
  children,
  danger = false,
}: {
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] [&>svg]:h-5 [&>svg]:w-5"
      style={{
        backgroundColor: danger ? "#fee2e2" : PROFILE_ICON_TONE.background,
        color: danger ? "#dc2626" : PROFILE_ICON_TONE.foreground,
      }}
    >
      {children}
    </span>
  );
}

export function ProfileMobileMenu({
  locale,
  user,
  dictionary,
  closeLabel,
  logoutAction,
  sheets,
}: ProfileMobileMenuProps) {
  const [activeSheet, setActiveSheet] = useState<ProfileNavKey | null>(null);
  const initials =
    `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase();
  const displayName = `${user.firstName} ${user.lastName}`.trim();

  const rows: MenuRow[] = [
    {
      key: "dashboard",
      label: dictionary.dashboard,
      icon: <LayoutDashboard />,
    },
    {
      key: "orders",
      label: dictionary.orders,
      icon: <Package />,
    },
    {
      key: "promoCodes",
      label: dictionary.promoCodes.nav,
      icon: <TicketPercent />,
    },
    {
      key: "personal",
      label: dictionary.personal,
      icon: <User />,
    },
    {
      key: "addresses",
      label: dictionary.addresses,
      icon: <MapPin />,
    },
    {
      key: "password",
      label: dictionary.password,
      icon: <Lock />,
    },
  ];

  const activeTitle =
    activeSheet === "dashboard"
      ? dictionary.dashboard
      : activeSheet === "orders"
        ? dictionary.orders
        : activeSheet === "promoCodes"
          ? dictionary.promoCodes.nav
          : activeSheet === "personal"
            ? dictionary.personal
            : activeSheet === "addresses"
              ? dictionary.addresses
              : activeSheet === "password"
                ? dictionary.password
                : activeSheet === "deleteAccount"
                  ? dictionary.deleteAccount
                  : "";

  return (
    <div className="mx-auto w-full max-w-md space-y-3 lg:hidden">
      <section
        className={`px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${PROFILE_CARD_CLASS}`}
        aria-label={dictionary.title}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-red text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl leading-tight font-bold text-gray-900">
              {displayName}
            </p>
            <p className="truncate text-sm leading-snug text-gray-500">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      <nav
        className={`overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${PROFILE_CARD_CLASS}`}
        aria-label={dictionary.title}
      >
        <div className="divide-y divide-gray-100">
          {rows.map((row) => {
            const hasSheet = sheets[row.key] != null;
            const className =
              "flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors active:bg-gray-50 hover:bg-gray-50/80";

            const content = (
              <>
                <span className="flex min-w-0 items-center gap-3">
                  <MenuIconBox>{row.icon}</MenuIconBox>
                  <span className="truncate text-base font-medium text-gray-800">
                    {row.label}
                  </span>
                </span>
                <ChevronRight
                  className="h-[18px] w-[18px] shrink-0 text-brand-yellow"
                  aria-hidden
                />
              </>
            );

            if (hasSheet) {
              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => setActiveSheet(row.key)}
                  className={className}
                >
                  {content}
                </button>
              );
            }

            return (
              <AppLink
                key={row.key}
                href={`/${locale}/profile/${
                  row.key === "promoCodes"
                    ? "promo-codes"
                    : row.key === "personal"
                      ? "personal-information"
                      : row.key === "deleteAccount"
                        ? "delete-account"
                        : row.key
                }`}
                prefetchPolicy="intent"
                className={className}
              >
                {content}
              </AppLink>
            );
          })}
        </div>
      </nav>

      <div className={`overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${PROFILE_CARD_CLASS}`}>
        {sheets.deleteAccount != null ? (
          <button
            type="button"
            onClick={() => setActiveSheet("deleteAccount")}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-red-50/60"
          >
            <span className="flex min-w-0 items-center gap-3">
              <MenuIconBox danger>
                <Trash2 />
              </MenuIconBox>
              <span className="text-base font-semibold text-red-500">
                {dictionary.deleteAccount}
              </span>
            </span>
            <ChevronRight
              className="h-[18px] w-[18px] shrink-0 text-brand-yellow"
              aria-hidden
            />
          </button>
        ) : (
          <AppLink
            href={`/${locale}/profile/delete-account`}
            prefetchPolicy="intent"
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-red-50/60"
          >
            <span className="flex min-w-0 items-center gap-3">
              <MenuIconBox danger>
                <Trash2 />
              </MenuIconBox>
              <span className="text-base font-semibold text-red-500">
                {dictionary.deleteAccount}
              </span>
            </span>
            <ChevronRight
              className="h-[18px] w-[18px] shrink-0 text-brand-yellow"
              aria-hidden
            />
          </AppLink>
        )}
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className={`flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-brand-red shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-colors hover:bg-red-50/60 ${PROFILE_CARD_CLASS}`}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {dictionary.logout}
        </button>
      </form>

      <ProfileMobileSheet
        open={activeSheet != null && sheets[activeSheet] != null}
        title={activeTitle}
        closeLabel={closeLabel}
        onClose={() => setActiveSheet(null)}
      >
        {activeSheet ? sheets[activeSheet] : null}
      </ProfileMobileSheet>
    </div>
  );
}
