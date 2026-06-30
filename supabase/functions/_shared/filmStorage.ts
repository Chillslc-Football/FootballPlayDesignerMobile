export const FILM_BUCKET = 'film';
export const FILM_SIGNED_URL_TTL_SECONDS = 8 * 60 * 60;
export const FILM_UPLOAD_URL_TTL_SECONDS = 60 * 60;
export const MAX_FILM_BYTES = 524_288_000;

const UUID_PATTERN =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export function filmStorageTeamId(objectPath: string): string | null {
  const teamId = objectPath.split('/')[0]?.trim();

  if (!teamId || !new RegExp(UUID_PATTERN, 'i').test(teamId)) {
    return null;
  }

  return teamId;
}

export function filmStoragePathIsValid(objectPath: string): boolean {
  const segments = objectPath.trim().split('/');

  if (segments.length !== 3) {
    return false;
  }

  const [teamId, filmId, fileName] = segments;

  if (!new RegExp(UUID_PATTERN, 'i').test(teamId)) {
    return false;
  }

  if (!new RegExp(UUID_PATTERN, 'i').test(filmId)) {
    return false;
  }

  return /^original\.(mp4|mov|webm)$/i.test(fileName);
}

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}
