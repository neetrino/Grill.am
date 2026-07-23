type CategoryParentLink = {
  id: string;
  parentId: string | null;
};

/**
 * Expands selected category ids to include every descendant in the tree.
 * Used so parent-category filters also match products on child categories.
 */
export function expandCategoryIdsWithDescendants(
  rootIds: readonly string[],
  categoryLinks: readonly CategoryParentLink[],
): string[] {
  if (rootIds.length === 0) return [];

  const childrenByParent = new Map<string, string[]>();
  for (const category of categoryLinks) {
    if (!category.parentId) continue;
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category.id);
    childrenByParent.set(category.parentId, siblings);
  }

  const expanded = new Set<string>(rootIds);
  const queue = [...rootIds];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) continue;
    for (const childId of childrenByParent.get(current) ?? []) {
      if (expanded.has(childId)) continue;
      expanded.add(childId);
      queue.push(childId);
    }
  }

  return [...expanded];
}
