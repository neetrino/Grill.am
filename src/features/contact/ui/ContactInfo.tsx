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
  className = "",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`${CARD_CLASS} ${className}`.trim()}>
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
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-4">
        <InfoCard
          icon={<Phone className="size-5" aria-hidden />}
          title={copy.callTitle}
        >
          <p className="mb-3 text-sm leading-relaxed text-gray-600">
            {copy.callDescription}
          </p>
          <ul className="space-y-2">
            {copy.storePhones.map((phone) => (
              <li key={phone}>
                <a
                  href={telHref(phone)}
                  className="text-base font-semibold text-brand-red transition hover:text-brand-red-hot"
                >
                  {phone}
                </a>
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard
          icon={<Mail className="size-5" aria-hidden />}
          title={copy.writeTitle}
        >
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
      </div>

      <InfoCard
        icon={<MapPin className="size-5" aria-hidden />}
        title={copy.hqTitle}
        className="flex flex-1 flex-col"
      >
        {copy.hqDescription ? (
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            {copy.hqDescription}
          </p>
        ) : null}
        <ul className="grid flex-1 grid-cols-1 content-start gap-2 sm:grid-cols-2">
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
