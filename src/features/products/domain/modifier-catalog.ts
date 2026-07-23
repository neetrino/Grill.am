export type ModifierCatalogItem = {
  id: string;
  kind: "ADDON" | "EXCLUSION";
  label: Partial<Record<"hy" | "en" | "ru", string>>;
  priceAmount: number;
};
