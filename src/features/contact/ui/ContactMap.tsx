type ContactMapProps = {
  title: string;
};

/** Official Grill.am Yandex Maps Constructor widget (same as grill.am/contact). */
const YANDEX_MAP_EMBED_SRC =
  "https://yandex.ru/map-widget/v1/?um=constructor%3Abb3de1b26b88b4a4466f05324e1c51572dffd23e5059ee6b685e8eb7d12da0d9&source=constructor";

/** Contact map — Yandex constructor embed with all store pins. */
export function ContactMap({ title }: ContactMapProps) {
  return (
    <section className="mx-auto max-w-7xl py-10 lg:py-14">
      <div className="overflow-hidden rounded-[15px] border border-gray-100 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <div className="relative h-[280px] bg-gray-100 sm:h-[340px] lg:h-[400px]">
          <iframe
            title={title}
            src={YANDEX_MAP_EMBED_SRC}
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
