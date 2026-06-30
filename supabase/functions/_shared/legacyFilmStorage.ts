import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { FILM_BUCKET, FILM_SIGNED_URL_TTL_SECONDS } from './filmStorage.ts';

function isLegacyObjectMissingError(error: { message?: string; statusCode?: string }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  const statusCode = error.statusCode?.toLowerCase() ?? '';

  return (
    statusCode === '404' ||
    message.includes('not found') ||
    message.includes('object not found') ||
    message.includes('does not exist')
  );
}

export async function legacyFilmObjectExists(
  admin: SupabaseClient,
  storagePath: string,
): Promise<boolean> {
  const folder = storagePath.split('/').slice(0, -1).join('/');
  const fileName = storagePath.split('/').pop() ?? '';

  const { data, error } = await admin.storage.from(FILM_BUCKET).list(folder, {
    search: fileName,
    limit: 1,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).some((entry) => entry.name === fileName);
}

export async function createLegacyFilmDownloadUrl(
  admin: SupabaseClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await admin.storage
    .from(FILM_BUCKET)
    .createSignedUrl(storagePath, FILM_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not load team film.');
  }

  return data.signedUrl;
}

export async function deleteLegacyFilmObject(
  admin: SupabaseClient,
  storagePath: string,
): Promise<boolean> {
  console.log(`Deleting legacy film object from Supabase Storage bucket "${FILM_BUCKET}": ${storagePath}`);

  const { data, error } = await admin.storage.from(FILM_BUCKET).remove([storagePath]);

  if (error) {
    if (isLegacyObjectMissingError(error)) {
      console.log(`Legacy film object already missing: ${storagePath}`);
      return false;
    }

    throw new Error(error.message);
  }

  const deleted = (data ?? []).length > 0;

  if (deleted) {
    console.log(`Deleted legacy film object: ${storagePath}`);
  } else {
    console.log(`Legacy film object already missing: ${storagePath}`);
  }

  return deleted;
}
