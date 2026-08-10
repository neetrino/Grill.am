import { YANDEX_STORE_MAP_EMBED_SRC } from "@/features/stores/yandex-map-embed";

type ContactMapProps = {
  title: string;
};

/** Contact map — Yandex constructor embed with all store pins. */
export function ContactMap({ title }: ContactMapProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="overflow-hidden rounded-[15px] border border-gray-100 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <div className="relative h-[280px] bg-gray-100 sm:h-[340px] lg:h-[400px]">
          <iframe
            title={title}
            src={YANDEX_STORE_MAP_EMBED_SRC}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
