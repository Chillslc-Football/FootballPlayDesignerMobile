import { getInvokeErrorMessage } from './supabaseInvoke';
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

type FilmDownloadUrlResponse = {
  signedUrl?: string;
  error?: string;
};

type FilmUploadUrlResponse = {
  uploadUrl?: string;
  error?: string;
};

type FilmDeleteObjectResponse = {
  ok?: boolean;
  error?: string;
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

async function invokeFilmFunction<T extends { error?: string }>(
  functionName: string,
  body: Record<string, string>,
  fallbackMessage: string,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    throw new Error(await getInvokeErrorMessage(error, fallbackMessage));
  }

  const response = data as T | null;

  if (response?.error) {
    throw new Error(response.error);
  }

  return response ?? ({} as T);
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

  const response = await invokeFilmFunction<FilmDownloadUrlResponse>(
    'film-download-url',
    { storagePath: normalized },
    'Could not load team film.',
  );

  if (!response.signedUrl) {
    throw new Error('Could not load team film.');
  }

  signedUrlCache.set(normalized, {
    signedUrl: response.signedUrl,
    expiresAt: Date.now() + FILM_SIGNED_URL_TTL_SECONDS * 1000,
  });

  return response.signedUrl;
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

  const contentType = mimeTypeForExtension(extension);
  const uploadResponse = await invokeFilmFunction<FilmUploadUrlResponse>(
    'film-upload-url',
    {
      storagePath,
      contentType,
    },
    'Could not prepare film upload.',
  );

  if (!uploadResponse.uploadUrl) {
    throw new Error('Could not prepare film upload.');
  }

  const putResponse = await fetch(uploadResponse.uploadUrl, {
    method: 'PUT',
    body: arrayBuffer,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!putResponse.ok) {
    throw new Error('Failed to upload team film.');
  }
}

export async function deleteFilmFile(storagePath: string | null | undefined): Promise<void> {
  const normalized = storagePath?.trim();

  if (!normalized) {
    return;
  }

  await invokeFilmFunction<FilmDeleteObjectResponse>(
    'film-delete-object',
    { storagePath: normalized },
    'Could not delete team film.',
  );

  invalidateFilmSignedUrlCache(normalized);
}
