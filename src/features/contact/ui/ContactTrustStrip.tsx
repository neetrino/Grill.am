import { Clock, Headphones, ShieldCheck, ThumbsUp } from "lucide-react";

type ContactTrustStripProps = {
  support: string;
  response: string;
  safe: string;
  satisfaction: string;
};

/** Four trust points under the contact map. */
export function ContactTrustStrip({
  support,
  response,
  safe,
  satisfaction,
}: ContactTrustStripProps) {
  const items = [
    { label: support, Icon: Headphones },
    { label: response, Icon: Clock },
    { label: safe, Icon: ShieldCheck },
    { label: satisfaction, Icon: ThumbsUp },
  ] as const;

  return (
    <section className="border-t border-gray-100 bg-white">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-4 lg:gap-8 lg:px-8">
        {items.map(({ label, Icon }) => (
          <li
            key={label}
            className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-red/30 text-brand-red">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-gray-800">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
