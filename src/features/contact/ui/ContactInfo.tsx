import type { ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { telHref } from "@/lib/phone";

type ContactInfoProps = {
  copy: Dictionary["contact"];
};

const CARD_CLASS =
  "rounded-[15px] border border-gray-100 bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.05)] sm:p-6";

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className={CARD_CLASS}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-red text-white">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </article>
  );
}

/** Contact details — three branded cards (call / write / HQ). */
export function ContactInfo({ copy }: ContactInfoProps) {
  return (
    <div className="flex flex-col gap-4">
      <InfoCard icon={<Phone className="size-5" aria-hidden />} title={copy.callTitle}>
        <p className="mb-3 text-sm leading-relaxed text-gray-600">
          {copy.callDescription}
        </p>
        <ul className="space-y-2">
          {copy.storePhones.map((phone, index) => (
            <li key={phone}>
              <a
                href={telHref(phone)}
                className="text-base font-semibold text-brand-red transition hover:text-brand-red-hot"
              >
                {index === 0
                  ? `${phone} (${copy.deliveryPhoneLabel})`
                  : phone}
              </a>
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard icon={<Mail className="size-5" aria-hidden />} title={copy.writeTitle}>
        <p className="mb-3 text-sm leading-relaxed text-gray-600">
          {copy.writeDescription}
        </p>
        <a
          href={`mailto:${copy.storeEmail}`}
          className="text-base font-semibold text-brand-red transition hover:text-brand-red-hot"
        >
          {copy.storeEmail}
        </a>
      </InfoCard>

      <InfoCard icon={<MapPin className="size-5" aria-hidden />} title={copy.hqTitle}>
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          {copy.hqDescription}
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {copy.storeAddresses.map((address) => (
            <li
              key={address}
              className="flex items-start gap-2 text-sm font-medium text-gray-800"
            >
              <MapPin
                className="mt-0.5 size-3.5 shrink-0 text-brand-red"
                aria-hidden
              />
              <span>{address}</span>
            </li>
          ))}
        </ul>
      </InfoCard>
    </div>
  );
}
