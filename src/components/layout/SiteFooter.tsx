import Image from "next/image";
import { Mail } from "lucide-react";

import { FooterCornerShell } from "@/components/layout/FooterCornerShell";
import { SiteCopyright } from "@/components/layout/SiteCopyright";
import { StoreAddressDropdown } from "@/components/layout/StoreAddressDropdown";
import { StorePhoneDropdown } from "@/components/layout/StorePhoneDropdown";
import { FOOTER_PAYMENT_ASSETS } from "@/lib/payment-assets";
import { staticAssetUrl } from "@/lib/media/static-asset-url";
import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
} from "@/components/layout/SocialIcons";
import { AppLink } from "@/components/ui/AppLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type SiteFooterProps = {
  dictionary: Dictionary;
  locale: Locale;
};

const CONTACT_ICON_CLASS = "h-[15px] w-[15px] shrink-0 text-brand-yellow";

const FOOTER_PAYMENT_METHODS = [
  { src: FOOTER_PAYMENT_ASSETS.idram, alt: "Idram" },
  { src: FOOTER_PAYMENT_ASSETS.mastercard, alt: "Mastercard" },
  { src: FOOTER_PAYMENT_ASSETS.arca, alt: "ArCa" },
  { src: FOOTER_PAYMENT_ASSETS.visa, alt: "Visa" },
  { src: FOOTER_PAYMENT_ASSETS.telcell, alt: "Telcell" },
] as const;

export function SiteFooter({ dictionary, locale }: SiteFooterProps) {
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
      href: `/${locale}/legal/refund`,
      label: dictionary.footer.faq,
    },
  ] as const;

  return (
    <FooterCornerShell>
      <footer className="lazy-section relative w-full overflow-hidden rounded-tl-[50px] rounded-tr-[50px] bg-black">
        <p
          aria-hidden
          className="pointer-events-none absolute bottom-[18px] left-1/2 z-0 -translate-x-1/2 translate-y-1/2 font-mirage text-[281px] leading-[230px] whitespace-nowrap text-white/25 uppercase opacity-40 select-none"
        >
          GRILL.AM
        </p>

        <div className="page-container relative z-10 pt-[55px] pb-10">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[minmax(240px,1.6fr)_repeat(2,minmax(140px,1fr))_auto]">
            <div className="col-span-2 lg:col-span-1">
              <div className="relative h-[37px] w-[92px]">
                <Image
                  src={staticAssetUrl("/assets/brand/logo-footer.webp")}
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

            <div className="lg:-translate-x-[25px]">
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

            <div className="justify-self-start lg:justify-self-end">
              <h4 className="text-sm font-black tracking-[1.68px] text-white uppercase">
                {dictionary.footer.contactInfo}
              </h4>
              <ul className="mt-5 space-y-4 text-sm text-white/60">
                <li>
                  <StorePhoneDropdown
                    phones={dictionary.contact.storePhones}
                    whatsappPhones={dictionary.contact.storeWhatsAppPhones}
                    toggleLabel={dictionary.contact.callTitle}
                    variant="footer"
                  />
                </li>
                <li className="flex items-center gap-3">
                  <Mail className={CONTACT_ICON_CLASS} aria-hidden />
                  <a
                    href={`mailto:${dictionary.contact.storeEmail}`}
                    className="transition hover:text-white"
                  >
                    {dictionary.contact.storeEmail}
                  </a>
                </li>
                <li>
                  <StoreAddressDropdown
                    addresses={dictionary.contact.storeAddresses}
                    toggleLabel={dictionary.footer.addresses}
                    variant="footer"
                    locale={locale}
                  />
                </li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-16 flex flex-col gap-6 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <SiteCopyright
              className="text-sm text-white"
              linkClassName="font-bold transition hover:text-white/80"
            />

            <ul className="flex flex-wrap items-center gap-[11px]">
              {FOOTER_PAYMENT_METHODS.map((payment) => (
                <li
                  key={payment.alt}
                  className="relative h-[30px] w-[73px] overflow-hidden rounded-lg bg-white"
                >
                  <Image
                    src={payment.src}
                    alt={payment.alt}
                    fill
                    sizes="73px"
                    className="object-contain p-1"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </FooterCornerShell>
  );
}
