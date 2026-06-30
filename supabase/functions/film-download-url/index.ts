import {
  errorResponse,
  filmStoragePathIsValid,
  filmStorageTeamId,
  jsonResponse,
} from '../_shared/filmStorage.ts';
import { resolveUploadedFilmPlaybackUrl } from '../_shared/filmPlayback.ts';
import {
  createServiceClient,
  createUserClient,
  requireAuthenticatedUser,
  requireTeamMember,
} from '../_shared/supabaseAuth.ts';

type DownloadUrlRequest = {
  storagePath?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({});
  }

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const body = (await request.json()) as DownloadUrlRequest;
    const storagePath = body.storagePath?.trim();

    if (!storagePath || !filmStoragePathIsValid(storagePath)) {
      return errorResponse('Invalid film storage path.');
    }

    const teamId = filmStorageTeamId(storagePath);

    if (!teamId) {
      return errorResponse('Invalid film storage path.');
    }

    const supabase = createUserClient(request.headers.get('Authorization'));
    await requireAuthenticatedUser(supabase);
    await requireTeamMember(supabase, teamId);

    const admin = createServiceClient();
    const playback = await resolveUploadedFilmPlaybackUrl(admin, storagePath);

    if (!playback) {
      return errorResponse('Could not load team film.', 404);
    }

    return jsonResponse({
      signedUrl: playback.signedUrl,
      storageBackend: playback.storageBackend,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load team film.';
    const status = message === 'Unauthorized.' ? 401 : 400;

    return errorResponse(message, status);
  }
});
