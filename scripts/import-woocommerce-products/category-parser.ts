/**
 * Parses WooCommerce `Категории` values.
 * Escaped commas (`\,`) belong to the category name; unescaped commas separate categories.
 */
export function parseWooCommerceCategories(raw: string): string[] {
  const value = raw.trim();
  if (!value) return [];

  const parts: string[] = [];
  let current = "";

  for (let index = 0; index < value.length; index += 1) {
    const ch = value[index];
    const next = value[index + 1];

    if (ch === "\\" && next === ",") {
      current += ",";
      index += 1;
      continue;
    }

    if (ch === ",") {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);

  return parts;
}
