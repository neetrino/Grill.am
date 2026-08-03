import type { LucideIcon } from "lucide-react";
import {
  CupSoda,
  Drumstick,
  Flame,
  Gift,
  LayoutGrid,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
} from "lucide-react";

const CATEGORY_ICONS: readonly LucideIcon[] = [
  Salad,
  Gift,
  Drumstick,
  Flame,
  UtensilsCrossed,
  Sandwich,
  Soup,
  CupSoda,
];

/**
 * Picks a sidebar icon from category slug/title keywords, with a stable fallback.
 */
export function resolveCatalogCategoryIcon(
  slug: string,
  title: string,
  index: number,
): LucideIcon {
  const key = `${slug} ${title}`.toLowerCase();

  if (/salad|աղցան|салат/.test(key)) return Salad;
  if (/combo|կոմբո|комбо|акци|ակցի/.test(key)) return Gift;
  if (/shawarma|շաուրմ|шаурм/.test(key)) return Sandwich;
  if (/kebab|քաբաբ|кебаб/.test(key)) return UtensilsCrossed;
  if (/drink|ըմպել|напит|beverage/.test(key)) return CupSoda;
  if (/side|նախուտեստ|соус|sauce|appetizer/.test(key)) return Soup;
  if (/barbecue|խորոված|khorov|bbq/.test(key)) return Flame;
  if (/chicken|հավ|куриц|գրիլ|гриль/.test(key)) return Drumstick;

  return CATEGORY_ICONS[index % CATEGORY_ICONS.length] ?? UtensilsCrossed;
}

export const CatalogAllCategoriesIcon = LayoutGrid;
