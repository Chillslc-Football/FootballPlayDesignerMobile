import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  createLegacyFilmDownloadUrl,
  legacyFilmObjectExists,
} from './legacyFilmStorage.ts';
import { createR2DownloadUrl, r2ObjectExists } from './r2Client.ts';

export async function resolveUploadedFilmPlaybackUrl(
  admin: SupabaseClient,
  storagePath: string,
): Promise<{ signedUrl: string; storageBackend: 'r2' | 'supabase' } | null> {
  if (await r2ObjectExists(storagePath)) {
    const signedUrl = await createR2DownloadUrl(storagePath);
    return { signedUrl, storageBackend: 'r2' };
  }

  if (await legacyFilmObjectExists(admin, storagePath)) {
    const signedUrl = await createLegacyFilmDownloadUrl(admin, storagePath);
    return { signedUrl, storageBackend: 'supabase' };
  }

  return null;
}
