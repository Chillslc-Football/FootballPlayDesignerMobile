import { getInvokeErrorMessage } from './supabaseInvoke';
import { supabase } from './supabase';

type PublicFilmPlaybackResponse = {
  title?: string;
  videoSourceType?: string;
  playbackUrl?: string;
  error?: string;
};

export type PublicFilmPlayback = {
  title: string;
  videoSourceType: string;
  playbackUrl: string;
};

export async function fetchPublicFilmPlayback(shareToken: string): Promise<PublicFilmPlayback> {
  const { data, error } = await supabase.functions.invoke('film-public-playback', {
    body: { shareToken },
  });

  if (error) {
    throw new Error(await getInvokeErrorMessage(error, 'Film not available.'));
  }

  const response = data as PublicFilmPlaybackResponse | null;

  if (response?.error) {
    throw new Error(response.error);
  }

  if (!response?.title || !response.playbackUrl) {
    throw new Error('Film not available.');
  }

  return {
    title: response.title,
    videoSourceType: response.videoSourceType ?? 'upload',
    playbackUrl: response.playbackUrl,
  };
}
