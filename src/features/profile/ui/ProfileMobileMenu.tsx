"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import {
  PROFILE_CARD_CLASS,
  PROFILE_ICON_TONE,
  PROFILE_MOBILE_SHEET_HEIGHT_VH,
  PROFILE_MOBILE_SHEET_Z_INDEX,
  type ProfileNavKey,
} from "@/features/profile/ui/profile-ui";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { SessionUser } from "@/lib/auth/session";

type ProfileMobileMenuProps = {
  locale: Locale;
  user: SessionUser;
  dictionary: Dictionary["profile"];
  logoutAction: (formData: FormData) => void | Promise<void>;
  dashboardContent: ReactNode;
};

type MenuRow =
  | {
      key: ProfileNavKey;
      kind: "sheet";
      label: string;
      icon: ReactNode;
    }
  | {
      key: ProfileNavKey;
      kind: "link";
      href: string;
      label: string;
      icon: ReactNode;
    };

const SHEET_CLOSE_MS = 280;

function MenuIconBox({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] [&>svg]:h-5 [&>svg]:w-5"
      style={{
        backgroundColor: PROFILE_ICON_TONE.background,
        color: PROFILE_ICON_TONE.foreground,
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
  logoutAction,
  dashboardContent,
}: ProfileMobileMenuProps) {
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const initials = `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}`.toUpperCase();
  const displayName = `${user.firstName} ${user.lastName}`.trim();

  const rows: MenuRow[] = [
    {
      key: "dashboard",
      kind: "sheet",
      label: dictionary.dashboard,
      icon: <LayoutDashboard />,
    },
    {
      key: "orders",
      kind: "link",
      href: `/${locale}/profile/orders`,
      label: dictionary.orders,
      icon: <Package />,
    },
    {
      key: "promoCodes",
      kind: "link",
      href: `/${locale}/profile/promo-codes`,
      label: dictionary.promoCodes.nav,
      icon: <TicketPercent />,
    },
    {
      key: "personal",
      kind: "link",
      href: `/${locale}/profile/personal-information`,
      label: dictionary.personal,
      icon: <User />,
    },
    {
      key: "addresses",
      kind: "link",
      href: `/${locale}/profile/addresses`,
      label: dictionary.addresses,
      icon: <MapPin />,
    },
    {
      key: "password",
      kind: "link",
      href: `/${locale}/profile/password`,
      label: dictionary.password,
      icon: <Lock />,
    },
  ];

  useEffect(() => {
    if (!sheetMounted) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sheetMounted]);

  function openDashboard(): void {
    setSheetMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSheetVisible(true);
      });
    });
  }

  function closeDashboard(): void {
    setSheetVisible(false);
    window.setTimeout(() => {
      setSheetMounted(false);
    }, SHEET_CLOSE_MS);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 lg:hidden">
      <section
        className={`px-4 py-2 ${PROFILE_CARD_CLASS}`}
        aria-label={dictionary.title}
      >
        <div className="flex items-center gap-2">
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
        className={`overflow-hidden py-1 ${PROFILE_CARD_CLASS}`}
        aria-label={dictionary.title}
      >
        <div className="divide-y divide-gray-100">
          {rows.map((row) => {
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

            if (row.kind === "sheet") {
              return (
                <button
                  key={row.key}
                  type="button"
                  onClick={openDashboard}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80"
                >
                  {content}
                </button>
              );
            }

            return (
              <AppLink
                key={row.key}
                href={row.href}
                prefetchPolicy="intent"
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-gray-50/80"
              >
                {content}
              </AppLink>
            );
          })}
        </div>

        <div className="px-3 py-2">
          <AppLink
            href={`/${locale}/profile/delete-account`}
            prefetchPolicy="intent"
            className="flex w-full items-center justify-between rounded-[15px] border border-red-200 bg-white px-3 py-3 text-left transition-colors hover:bg-red-50/60"
          >
            <span className="flex min-w-0 items-center gap-3">
              <MenuIconBox>
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
        </div>
      </nav>

      <form action={logoutAction}>
        <button
          type="submit"
          className={`flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-brand-red transition-colors hover:bg-red-50/60 ${PROFILE_CARD_CLASS}`}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {dictionary.logout}
        </button>
      </form>

      {sheetMounted ? (
        <div
          className="fixed inset-0 flex items-end overscroll-none lg:hidden"
          style={{ zIndex: PROFILE_MOBILE_SHEET_Z_INDEX }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className={`fixed inset-0 rounded-none bg-black/35 backdrop-blur-[1px] transition-opacity duration-300 ${
              sheetVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDashboard}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dictionary.dashboard}
            className={`flex w-full flex-col overflow-hidden rounded-t-[15px] bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              sheetVisible ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ height: `${PROFILE_MOBILE_SHEET_HEIGHT_VH}dvh` }}
          >
            <div className="flex shrink-0 items-center justify-center py-3">
              <div className="h-1.5 w-14 rounded-full bg-gray-300" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
              {dashboardContent}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
