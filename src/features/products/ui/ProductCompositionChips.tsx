import { Minus } from "lucide-react";

type ProductCompositionChipsProps = {
  title: string;
  items: string[];
};

/** Splits composition text into Figma-style ingredient pills. */
export function parseCompositionItems(composition: string): string[] {
  return composition
    .split(/[,;|/\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 24);
}

export function ProductCompositionChips({
  title,
  items,
}: ProductCompositionChipsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[30px] bg-white p-6">
      <h2 className="text-sm leading-5 font-bold text-[#101828]">{title}</h2>
      <ul className="mt-4 flex flex-wrap gap-[5px]">
        {items.map((item) => (
          <li
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(219,11,32,0.24)] bg-[#fff4ee] px-3 py-1.5 text-xs leading-4 font-medium text-brand-red"
          >
            <Minus className="size-3.5 shrink-0" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
