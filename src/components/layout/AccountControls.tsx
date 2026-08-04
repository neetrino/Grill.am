"use client";

import { HeaderUserIcon } from "@/components/layout/HeaderIcons";
import { AppLink } from "@/components/ui/AppLink";
import { IconDropdown } from "@/components/ui/IconDropdown";
import { logoutAction } from "@/features/auth/logout-action";
import type { Locale } from "@/lib/i18n/config";
import type { SessionUser } from "@/lib/auth/session";

type AccountControlsProps = {
  locale: Locale;
  loginLabel: string;
  logoutLabel: string;
  profileLabel: string;
  adminLabel: string;
  user: SessionUser | null;
};

const menuItemClassName =
  "block w-full px-4 py-2.5 text-left text-sm text-[#131313] transition-colors hover:bg-brand-yellow/15";

const triggerClassName =
  "inline-flex h-[25px] w-[23px] shrink-0 items-center justify-center overflow-visible text-[#131313] transition-colors duration-150 hover:text-brand-red";

export function AccountControls({
  locale,
  loginLabel,
  logoutLabel,
  profileLabel,
  adminLabel,
  user,
}: AccountControlsProps) {
  const logoutWithLocale = logoutAction.bind(null, locale);
  const icon = (
    <HeaderUserIcon className="block h-[25px] w-[23px] overflow-visible" />
  );

  if (!user) {
    return (
      <AppLink
        href={`/${locale}/login`}
        prefetchPolicy="intent"
        className={triggerClassName}
        aria-label={loginLabel}
      >
        {icon}
      </AppLink>
    );
  }

  return (
    <IconDropdown
      label={profileLabel}
      triggerClassName={triggerClassName}
      menuAlign="right"
      trigger={icon}
    >
      {user.role === "ADMIN" ? (
        <AppLink
          href={`/${locale}/admin`}
          prefetchPolicy="intent"
          role="menuitem"
          className={menuItemClassName}
        >
          {adminLabel}
        </AppLink>
      ) : null}
      <AppLink
        href={`/${locale}/profile`}
        prefetchPolicy="intent"
        role="menuitem"
        className={menuItemClassName}
      >
        {profileLabel}
      </AppLink>
      <form action={logoutWithLocale}>
        <button type="submit" role="menuitem" className={menuItemClassName}>
          {logoutLabel}
        </button>
      </form>
    </IconDropdown>
  );
}
