import { updateProfileAvatarPath } from './profileRepository';
import { supabase } from './supabase';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_FILENAME = 'avatar.jpg';
export const AVATAR_SIGNED_URL_TTL_SECONDS = 8 * 60 * 60;

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const CACHE_REFRESH_BUFFER_MS = 60 * 60 * 1000;

type CachedSignedUrl = {
  signedUrl: string;
  expiresAt: number;
};

const signedUrlCache = new Map<string, CachedSignedUrl>();

export type AvatarUploadPayload = {
  uri: string;
};

export function buildAvatarStoragePath(userId: string): string {
  return `${userId}/${AVATAR_FILENAME}`;
}

export function invalidateAvatarSignedUrlCache(
  storagePath: string | null | undefined,
): void {
  const normalized = storagePath?.trim();

  if (!normalized) {
    return;
  }

  signedUrlCache.delete(normalized);
}

export async function createAvatarSignedUrl(
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
    .from(AVATAR_BUCKET)
    .createSignedUrl(normalized, AVATAR_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not load profile photo.');
  }

  signedUrlCache.set(normalized, {
    signedUrl: data.signedUrl,
    expiresAt: Date.now() + AVATAR_SIGNED_URL_TTL_SECONDS * 1000,
  });

  return data.signedUrl;
}

export async function uploadAvatarFile(
  userId: string,
  image: AvatarUploadPayload,
): Promise<string> {
  const path = buildAvatarStoragePath(userId);
  const response = await fetch(image.uri);

  if (!response.ok) {
    throw new Error('Could not read the selected photo.');
  }

  const arrayBuffer = await response.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_AVATAR_BYTES) {
    throw new Error('Photo is too large. Choose a smaller image.');
  }

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function deleteAvatarFile(
  storagePath: string | null | undefined,
): Promise<void> {
  const normalized = storagePath?.trim();

  if (!normalized) {
    return;
  }

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([normalized]);

  if (error) {
    throw new Error(error.message);
  }

  invalidateAvatarSignedUrlCache(normalized);
}

export async function replaceUserAvatar(
  userId: string,
  image: AvatarUploadPayload,
  previousPath: string | null,
): Promise<string> {
  const newPath = await uploadAvatarFile(userId, image);

  await updateProfileAvatarPath(userId, newPath);
  invalidateAvatarSignedUrlCache(previousPath);
  invalidateAvatarSignedUrlCache(newPath);

  return newPath;
}

export async function removeUserAvatar(
  userId: string,
  currentPath: string | null,
): Promise<void> {
  if (currentPath) {
    await deleteAvatarFile(currentPath);
  }

  await updateProfileAvatarPath(userId, null);
  invalidateAvatarSignedUrlCache(currentPath);
}
