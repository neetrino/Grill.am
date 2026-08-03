import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
} from "@/components/layout/SocialIcons";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function SiteFooter({ dictionary, locale }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const socialLinks = [
    {
      href: dictionary.contact.social.instagram,
      label: "Instagram",
      Icon: InstagramIcon,
    },
    {
      href: dictionary.contact.social.facebook,
      label: "Facebook",
      Icon: FacebookIcon,
    },
    {
      href: dictionary.contact.social.linkedin,
      label: "LinkedIn",
      Icon: LinkedInIcon,
    },
  ] as const;

  return (
    <footer className="mt-auto hidden overflow-hidden rounded-t-[60px] bg-black md:block">
      <div className="relative mx-auto max-w-[1440px] px-5 pt-14 pb-10 sm:px-8 lg:px-10 lg:pt-16">
        <p
          aria-hidden
          className="pointer-events-none absolute bottom-8 left-0 font-black text-[clamp(64px,20vw,281px)] leading-none text-white/25 uppercase opacity-40 select-none"
        >
          GRILL.AM
        </p>

        <div className="relative z-10 grid grid-cols-2 gap-8 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="relative mb-4 h-9 w-[92px]">
              <Image
                src="/assets/brand/logo.png"
                alt={dictionary.brand}
                fill
                sizes="92px"
                className="object-contain brightness-0 invert"
              />
            </div>
            <p className="max-w-[280px] text-sm leading-[22.75px] text-white/50">
              {dictionary.footer.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/8 text-white transition hover:bg-white/15"
                  aria-label={label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.quickLinks}
            </h4>
            <ul className="space-y-3 text-sm text-white/50">
              <li>
                <AppLink
                  href={`/${locale}/products`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.categories}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/products`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.promotions}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/products`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.bestsellers}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/about`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.nav.about}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/contact`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.nav.contact}
                </AppLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black tracking-[0.7px] text-white uppercase">
              {dictionary.footer.support}
            </h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <AppLink
                  href={`/${locale}/legal/delivery`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.refundPolicy}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/legal/terms`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.terms}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/legal/privacy`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.privacyPolicy}
                </AppLink>
              </li>
              <li>
                <AppLink
                  href={`/${locale}/contact`}
                  prefetchPolicy="intent"
                  className="transition hover:text-white"
                >
                  {dictionary.footer.faq}
                </AppLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.hours}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-white/50">{dictionary.footer.hoursWeekdaysLabel}</p>
              <p className="font-semibold text-white">
                {dictionary.footer.hoursWeekdays}
              </p>
              <p className="pt-2 text-white/50">
                {dictionary.footer.hoursWeekendLabel}
              </p>
              <p className="font-semibold text-white">
                {dictionary.footer.hoursWeekend}
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.contactInfo}
            </h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-center gap-3">
                <Phone className="h-[15px] w-[15px] shrink-0" aria-hidden />
                <a
                  href={`tel:${dictionary.contact.storePhone.replace(/\s/g, "")}`}
                  className="transition hover:text-white"
                >
                  {dictionary.contact.storePhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-[15px] w-[15px] shrink-0" aria-hidden />
                <a
                  href={`mailto:${dictionary.contact.storeEmail}`}
                  className="transition hover:text-white"
                >
                  {dictionary.contact.storeEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-[15px] w-[15px] shrink-0" aria-hidden />
                <span>{dictionary.contact.storeAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-16 border-t border-white/10 pt-8">
          <p className="text-sm text-white/30">
            {`Copyright © ${year} | ${dictionary.footer.rights} | ${dictionary.footer.createdBy}`}
          </p>
        </div>
      </div>
    </footer>
  );
}
