export function formatPlayType(playType: 'offensive' | 'defensive'): string {
  return playType === 'defensive' ? 'Defense' : 'Offense';
}

export function resolvePlayerDisplayLabel(
  slotId: string,
  customLabel?: string | null,
): string {
  if (typeof customLabel !== 'string') {
    return slotId;
  }

  const normalized = customLabel.trim().toUpperCase().slice(0, 3);
  return normalized.length > 0 ? normalized : slotId;
}

export function formatCategories(categories: string[]): string {
  if (categories.length === 0) {
    return 'None';
  }

  return categories.join(', ');
}
