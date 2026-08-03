import Image from "next/image";

type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
  tone: "red" | "white" | "cream" | "yellow";
};

type HomeFeaturesProps = {
  titleLead: string;
  titleAccent: string;
  items: readonly FeatureItem[];
};

const TONE_CLASSES: Record<FeatureItem["tone"], string> = {
  red: "bg-brand-red text-white",
  white: "bg-white text-brand-red ring-1 ring-black/5",
  cream: "bg-brand-cream text-brand-ink",
  yellow: "bg-brand-yellow text-brand-ink",
};

const DESCRIPTION_CLASSES: Record<FeatureItem["tone"], string> = {
  red: "text-white/89",
  white: "text-[rgba(245,37,22,0.57)]",
  cream: "text-[#7a5a2a]",
  yellow: "text-[#7a5a2a]",
};

export function HomeFeatures({
  titleLead,
  titleAccent,
  items,
}: HomeFeaturesProps) {
  return (
    <section className="w-full overflow-hidden py-12 sm:py-16 lg:py-20">
      <div className="relative mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute top-4 -left-8 hidden w-[220px] opacity-90 xl:block xl:w-[300px]">
          <Image
            src="/assets/home/feature-scooter.webp"
            alt=""
            width={382}
            height={421}
            className="h-auto w-full object-contain"
          />
        </div>

        <h2 className="relative z-10 mb-8 text-center text-4xl leading-none font-black tracking-tight text-brand-ink uppercase sm:mb-10 sm:text-6xl lg:mb-12 lg:text-[100px] lg:leading-[0.92] xl:text-[120px]">
          {titleLead}
          <br />
          <span className="text-brand-red-hot">{titleAccent}</span>
        </h2>

        <ul className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4 xl:gap-6">
          {items.map((item) => (
            <li
              key={item.title}
              className={`relative min-h-[220px] overflow-hidden rounded-3xl sm:min-h-[257px] ${TONE_CLASSES[item.tone]}`}
            >
              <div className="absolute top-4 -left-5 h-[160px] w-[150px] sm:top-5 sm:-left-6 sm:h-[200px] sm:w-[180px]">
                <Image
                  src={item.imageSrc}
                  alt=""
                  fill
                  sizes="180px"
                  className="object-contain"
                />
              </div>
              <div className="relative z-10 ml-[40%] flex h-full flex-col justify-center py-8 pr-4 pl-1 sm:ml-[42%] sm:py-10 sm:pr-5 sm:pl-2">
                <h3 className="text-[20px] leading-[1.2] font-black sm:text-[24px] sm:leading-[30px]">
                  {item.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-[22.75px] sm:mt-3 ${DESCRIPTION_CLASSES[item.tone]}`}
                >
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
