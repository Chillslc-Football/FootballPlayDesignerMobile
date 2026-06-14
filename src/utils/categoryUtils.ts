export function normalizeCategories(categories: unknown): string[] {
  if (!Array.isArray(categories)) {
    return [];
  }

  const normalized = categories
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return [...new Set(normalized)];
}
