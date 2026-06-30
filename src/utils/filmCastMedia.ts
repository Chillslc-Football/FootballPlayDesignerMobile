import { NativeModules, Platform } from 'react-native';
import { MediaStreamType } from 'react-native-google-cast';
import type RemoteMediaClient from 'react-native-google-cast/lib/typescript/api/RemoteMediaClient';

export function canUseFilmCast(): boolean {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  return Boolean(NativeModules.RNGCCastContext);
}

export async function loadFilmOnCastClient(
  client: RemoteMediaClient,
  playbackUrl: string,
  title?: string,
): Promise<void> {
  await client.loadMedia({
    autoplay: true,
    mediaInfo: {
      contentUrl: playbackUrl,
      contentType: 'video/mp4',
      streamType: MediaStreamType.BUFFERED,
      metadata: {
        type: 'movie',
        title: title?.trim() || 'Shared film',
      },
    },
  });
}
