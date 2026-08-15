const COMBO_CATEGORY_PATTERN = /combo|կոմբո|комбо/iu;

type NamedCategory = {
  slug: string;
  title: string;
};

/** True when a storefront category is the combos / combo-offers group. */
export function isComboCategory(category: NamedCategory): boolean {
  return COMBO_CATEGORY_PATTERN.test(`${category.slug} ${category.title}`);
}

/** First matching combo category, if the catalog has one. */
export function findComboCategory<T extends NamedCategory>(
  categories: readonly T[],
): T | undefined {
  return categories.find(isComboCategory);
}
