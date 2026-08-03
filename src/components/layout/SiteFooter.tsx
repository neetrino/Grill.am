import Image from "next/image";
import { Mail, Phone } from "lucide-react";

import { FooterAddressDropdown } from "@/components/layout/FooterAddressDropdown";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
} from "@/components/layout/SocialIcons";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { telHref } from "@/lib/phone";

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

const CONTACT_ICON_CLASS = "h-[15px] w-[15px] shrink-0 text-[#FF4A12]";

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
      href: dictionary.contact.social.whatsapp,
      label: "WhatsApp",
      Icon: WhatsAppIcon,
    },
  ] as const;

  const navLinks = [
    {
      href: `/${locale}/products`,
      label: dictionary.footer.categories,
    },
    {
      href: `/${locale}/products`,
      label: dictionary.footer.promotions,
    },
    {
      href: `/${locale}/products`,
      label: dictionary.footer.bestsellers,
    },
    {
      href: `/${locale}/about`,
      label: dictionary.nav.about,
    },
    {
      href: `/${locale}/contact`,
      label: dictionary.nav.contact,
    },
  ] as const;

  const supportLinks = [
    {
      href: `/${locale}/legal/delivery`,
      label: dictionary.footer.refundPolicy,
    },
    {
      href: `/${locale}/legal/terms`,
      label: dictionary.footer.terms,
    },
    {
      href: `/${locale}/legal/privacy`,
      label: dictionary.footer.privacyPolicy,
    },
    {
      href: `/${locale}/contact`,
      label: dictionary.footer.faq,
    },
  ] as const;

  return (
    <footer className="relative mt-auto hidden overflow-hidden rounded-tl-[30px] rounded-tr-[30px] bg-black md:block">
      <p
        aria-hidden
        className="pointer-events-none absolute bottom-[18px] left-[19px] z-0 translate-y-1/2 font-mirage text-[281px] leading-[230px] whitespace-nowrap text-white/25 uppercase opacity-40 select-none"
      >
        GRILL.AM
      </p>

      <div className="relative z-10 mx-auto max-w-[1440px] px-10 pt-[71px] pb-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[minmax(240px,1.6fr)_repeat(4,minmax(140px,1fr))]">
          <div className="col-span-2 lg:col-span-1">
            <div className="relative h-[37px] w-[92px]">
              <Image
                src="/assets/brand/logo.webp"
                alt={dictionary.brand}
                fill
                sizes="92px"
                className="object-contain object-left"
              />
            </div>
            <p className="mt-[19.5px] mb-[22.75px] max-w-[280px] text-sm leading-[22.75px] text-white/50">
              {dictionary.footer.description}
            </p>
            <div className="flex items-center gap-3 pt-6">
              {socialLinks.map(({ href, label, Icon }) => {
                const isExternalHttp = href.startsWith("http");
                return (
                  <a
                    key={label}
                    href={href}
                    {...(isExternalHttp
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/8 text-white/60 transition hover:bg-white/15 hover:text-white"
                    aria-label={label}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.quickLinks}
            </h4>
            <ul className="mt-[9px] space-y-3 text-sm text-white/50">
              {navLinks.map(({ href, label }) => (
                <li key={label}>
                  <AppLink
                    href={href}
                    prefetchPolicy="intent"
                    className="transition hover:text-white"
                  >
                    {label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.support}
            </h4>
            <ul className="mt-6 space-y-4 text-sm text-white/60">
              {supportLinks.map(({ href, label }) => (
                <li key={label}>
                  <AppLink
                    href={href}
                    prefetchPolicy="intent"
                    className="transition hover:text-white"
                  >
                    {label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.hours}
            </h4>
            <div className="mt-5 space-y-2 text-sm">
              <p className="text-white/50">{dictionary.footer.hoursWeekdaysLabel}</p>
              <p className="font-semibold text-white">
                {dictionary.footer.hoursWeekdays}
              </p>
              <p className="pt-1 text-white/50">
                {dictionary.footer.hoursWeekendLabel}
              </p>
              <p className="font-semibold text-white">
                {dictionary.footer.hoursWeekend}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black tracking-[1.68px] text-white uppercase">
              {dictionary.footer.contactInfo}
            </h4>
            <ul className="mt-5 space-y-4 text-sm text-white/60">
              {dictionary.contact.storePhones.map((phone) => (
                <li key={phone} className="flex items-center gap-3">
                  <Phone className={CONTACT_ICON_CLASS} aria-hidden />
                  <a
                    href={telHref(phone)}
                    className="transition hover:text-white"
                  >
                    {phone}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <Mail className={CONTACT_ICON_CLASS} aria-hidden />
                <a
                  href={`mailto:${dictionary.contact.storeEmail}`}
                  className="transition hover:text-white"
                >
                  {dictionary.contact.storeEmail}
                </a>
              </li>
              <FooterAddressDropdown
                addresses={dictionary.contact.storeAddresses}
                toggleLabel={dictionary.footer.addresses}
              />
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-16 pt-8">
          <p className="text-sm text-white">
            {`Copyright © ${year} | All Rights Reserved | Created by `}
            <a
              href="https://neetrino.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold transition hover:text-white/80"
            >
              Neetrino IT Company
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
