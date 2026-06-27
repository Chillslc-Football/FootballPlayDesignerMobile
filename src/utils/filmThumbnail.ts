import type { FilmProvider } from './filmProvider';

const YOUTUBE_THUMBNAIL_BASE = 'https://img.youtube.com/vi';

export function getYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id || null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      const queryId = parsed.searchParams.get('v');

      if (queryId) {
        return queryId;
      }

      const pathMatch = parsed.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/);

      if (pathMatch?.[2]) {
        return pathMatch[2];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isThumbnailSupported(provider: FilmProvider): boolean {
  return provider === 'youtube';
}

export function getThumbnailUrl(url: string, provider?: FilmProvider): string | null {
  if (provider && !isThumbnailSupported(provider)) {
    return null;
  }

  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  return `${YOUTUBE_THUMBNAIL_BASE}/${videoId}/hqdefault.jpg`;
}
