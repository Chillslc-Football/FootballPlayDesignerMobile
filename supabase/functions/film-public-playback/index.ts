import { errorResponse, jsonResponse } from '../_shared/filmStorage.ts';
import { resolveUploadedFilmPlaybackUrl } from '../_shared/filmPlayback.ts';
import { createServiceClient } from '../_shared/supabaseAuth.ts';

type PublicPlaybackRequest = {
  shareToken?: string;
};

type PublicFilmRow = {
  title: string;
  video_source_type: string;
  video_source: string;
  is_public_shared: boolean;
  share_token: string | null;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({});
  }

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const body = (await request.json()) as PublicPlaybackRequest;
    const shareToken = body.shareToken?.trim();

    if (!shareToken) {
      return errorResponse('Missing share token.');
    }

    const admin = createServiceClient();
    const { data, error } = await admin
      .from('team_films')
      .select('title, video_source_type, video_source, is_public_shared, share_token')
      .eq('share_token', shareToken)
      .eq('is_public_shared', true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const film = data as PublicFilmRow | null;

    if (!film || film.share_token !== shareToken) {
      return errorResponse('Film not found or sharing is disabled.', 404);
    }

    if (film.video_source_type === 'upload') {
      const playback = await resolveUploadedFilmPlaybackUrl(admin, film.video_source);

      if (!playback) {
        return errorResponse('Could not load team film.', 404);
      }

      return jsonResponse({
        title: film.title,
        videoSourceType: film.video_source_type,
        playbackUrl: playback.signedUrl,
        storageBackend: playback.storageBackend,
      });
    }

    return jsonResponse({
      title: film.title,
      videoSourceType: film.video_source_type,
      playbackUrl: film.video_source,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load team film.';
    return errorResponse(message, 400);
  }
});
