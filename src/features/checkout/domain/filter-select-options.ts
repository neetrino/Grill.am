export type FilterableSelectOption = {
  value: string;
  label: string;
};

/** Case-insensitive substring filter for combobox options. */
export function filterSelectOptions<T extends FilterableSelectOption>(
  options: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) {
    return [...options];
  }

  return options.filter((option) =>
    option.label.toLocaleLowerCase().includes(needle),
  );
}
