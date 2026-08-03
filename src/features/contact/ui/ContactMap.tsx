type ContactMapProps = {
  title: string;
};

const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.1234567890123!2d44.5150!3d40.1812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x406aa2dab8fc8b5b%3A0x3d1479ab4e9b8c5e!2sAbovyan%20St%2C%20Yerevan%2C%20Armenia!5e0!3m2!1sen!2sam!4v1234567890123!5m2!1sen!2sam";

/** Full-width contact map — lazy iframe, no client JS. */
export function ContactMap({ title }: ContactMapProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="overflow-hidden rounded-[15px] border border-gray-100 bg-white shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <div className="relative h-[240px] bg-gray-100 sm:h-[280px] lg:h-[320px]">
          <iframe
            title={title}
            src={MAP_EMBED_SRC}
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
