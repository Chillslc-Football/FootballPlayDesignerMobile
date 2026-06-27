export function titleFromVideoFilename(fileName: string | null | undefined): string {
  const trimmed = fileName?.trim() ?? '';

  if (trimmed.length === 0) {
    return 'Team Film';
  }

  const withoutExtension = trimmed.replace(/\.[^/.]+$/, '');
  const normalized = withoutExtension.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  return normalized.length > 0 ? normalized : 'Team Film';
}

export function formatFilmFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
