import { Flame, Truck, Beef } from "lucide-react";
import type { ReactNode } from "react";

import {
  AboutReveal,
  AboutStagger,
  AboutStaggerItem,
} from "@/features/about/ui/AboutReveal";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type AboutValuesProps = {
  copy: Dictionary["about"]["values"];
};

const VALUE_ICONS = [Flame, Beef, Truck] as const;

const VALUE_THEMES = [
  {
    card: "bg-brand-red text-white",
    icon: "bg-brand-yellow text-brand-ink",
    body: "text-white/85",
  },
  {
    card: "bg-brand-yellow text-brand-ink",
    icon: "bg-brand-red text-white",
    body: "text-brand-ink/75",
  },
  {
    card: "bg-brand-ink text-white",
    icon: "bg-brand-yellow text-brand-ink",
    body: "text-white/75",
  },
] as const;

const VALUE_FROM = ["left", "up", "right"] as const;

export function AboutValues({ copy }: AboutValuesProps) {
  return (
    <section data-about-band className="py-16 sm:py-20 lg:py-24">
      <div className="page-container">
        <AboutReveal>
          <h2 className="max-w-2xl text-[clamp(1.75rem,4vw,2.75rem)] font-black leading-tight tracking-tight text-brand-ink uppercase">
            {copy.title}
          </h2>
        </AboutReveal>

        <AboutStagger
          className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-3 md:gap-6"
          stagger={0.14}
        >
          {copy.items.map((item, index) => {
            const Icon = VALUE_ICONS[index] ?? Flame;
            const theme = VALUE_THEMES[index] ?? VALUE_THEMES[0];
            const from = VALUE_FROM[index] ?? "up";
            return (
              <AboutStaggerItem key={item.title} from={from}>
                <ValueBlock
                  icon={
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                  }
                  title={item.title}
                  body={item.body}
                  theme={theme}
                />
              </AboutStaggerItem>
            );
          })}
        </AboutStagger>
      </div>
    </section>
  );
}

function ValueBlock({
  icon,
  title,
  body,
  theme,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  theme: (typeof VALUE_THEMES)[number];
}) {
  return (
    <div
      className={`h-full rounded-[24px] px-6 py-7 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(7,16,20,0.14)] sm:rounded-[28px] sm:px-7 sm:py-8 ${theme.card}`}
    >
      <div
        className={`flex size-12 items-center justify-center rounded-full ${theme.icon}`}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-bold sm:text-xl">{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed sm:text-base ${theme.body}`}>
        {body}
      </p>
    </div>
  );
}
