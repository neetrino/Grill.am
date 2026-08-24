import type { LucideIcon } from "lucide-react";

type AboutStoryCardProps = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export function AboutStoryCard({ icon: Icon, title, body }: AboutStoryCardProps) {
  return (
    <article className="group flex h-full min-h-[11.5rem] flex-col rounded-[22px] bg-brand-yellow px-5 py-5 transition duration-300 hover:-translate-y-1 hover:bg-brand-yellow-soft hover:shadow-[0_14px_32px_rgba(7,16,20,0.16)] sm:min-h-[13rem] sm:rounded-[26px] sm:px-5 sm:py-6">
      <div className="flex size-10 items-center justify-center rounded-full bg-brand-red text-white sm:size-11">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="mt-4 text-[15px] font-bold tracking-tight text-brand-ink sm:text-base">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-ink/75 sm:text-[13.5px] sm:leading-6">
        {body}
      </p>
    </article>
  );
}
