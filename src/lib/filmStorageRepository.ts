import { supabase } from './supabase';

export const FILM_BUCKET = 'film';
export const FILM_SIGNED_URL_TTL_SECONDS = 8 * 60 * 60;
export const MAX_FILM_BYTES = 524_288_000;

export type FilmFileExtension = 'mp4' | 'mov' | 'webm';

const CACHE_REFRESH_BUFFER_MS = 60 * 60 * 1000;

type CachedSignedUrl = {
  signedUrl: string;
  expiresAt: number;
};

const signedUrlCache = new Map<string, CachedSignedUrl>();

const EXTENSION_TO_MIME: Record<FilmFileExtension, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

export type FilmUploadPayload = {
  uri: string;
  mimeType: string | null;
  fileName: string | null;
};

export function buildFilmStoragePath(
  teamId: string,
  filmId: string,
  extension: FilmFileExtension,
): string {
  return `${teamId}/${filmId}/original.${extension}`;
}

export function extensionFromMimeType(mimeType: string | null | undefined): FilmFileExtension | null {
  const normalized = mimeType?.trim().toLowerCase() ?? '';

  if (normalized === 'video/mp4') {
    return 'mp4';
  }

  if (normalized === 'video/quicktime') {
    return 'mov';
  }

  if (normalized === 'video/webm') {
    return 'webm';
  }

  return null;
}

export function extensionFromFileName(fileName: string | null | undefined): FilmFileExtension | null {
  const normalized = fileName?.trim().toLowerCase() ?? '';
  const match = normalized.match(/\.(mp4|mov|webm)$/);

  if (!match?.[1]) {
    return null;
  }

  return match[1] as FilmFileExtension;
}

export function resolveFilmFileExtension(payload: FilmUploadPayload): FilmFileExtension | null {
  return (
    extensionFromMimeType(payload.mimeType) ??
    extensionFromFileName(payload.fileName) ??
    extensionFromFileName(payload.uri)
  );
}

export function mimeTypeForExtension(extension: FilmFileExtension): string {
  return EXTENSION_TO_MIME[extension];
}

export function invalidateFilmSignedUrlCache(storagePath: string | null | undefined): void {
  const normalized = storagePath?.trim();

  if (!normalized) {
    return;
  }

  signedUrlCache.delete(normalized);
}

export async function createFilmSignedUrl(
  storagePath: string | null | undefined,
  options?: { forceRefresh?: boolean },
): Promise<string | null> {
  const normalized = storagePath?.trim();

  if (!normalized) {
    return null;
  }

  if (!options?.forceRefresh) {
    const cached = signedUrlCache.get(normalized);

    if (cached && cached.expiresAt > Date.now() + CACHE_REFRESH_BUFFER_MS) {
      return cached.signedUrl;
    }
  }

  const { data, error } = await supabase.storage
    .from(FILM_BUCKET)
    .createSignedUrl(normalized, FILM_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not load team film.');
  }

  signedUrlCache.set(normalized, {
    signedUrl: data.signedUrl,
    expiresAt: Date.now() + FILM_SIGNED_URL_TTL_SECONDS * 1000,
  });

  return data.signedUrl;
}

export async function uploadFilmFile(
  storagePath: string,
  payload: FilmUploadPayload,
  extension: FilmFileExtension,
): Promise<void> {
  const response = await fetch(payload.uri);

  if (!response.ok) {
    throw new Error('Could not read the selected video.');
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_FILM_BYTES) {
    throw new Error('Video is too large. Choose a file under 500 MB.');
  }

  const { error } = await supabase.storage.from(FILM_BUCKET).upload(storagePath, arrayBuffer, {
    contentType: mimeTypeForExtension(extension),
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteFilmFile(storagePath: string | null | undefined): Promise<void> {
  const normalized = storagePath?.trim();

  if (!normalized) {
    return;
  }

  const { error } = await supabase.storage.from(FILM_BUCKET).remove([normalized]);

  if (error) {
    throw new Error(error.message);
  }

  invalidateFilmSignedUrlCache(normalized);
}
