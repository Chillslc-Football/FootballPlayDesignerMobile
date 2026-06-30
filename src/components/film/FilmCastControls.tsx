import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CastButton,
  CastState,
  useCastState,
  useRemoteMediaClient,
} from 'react-native-google-cast';

import { canUseFilmCast, loadFilmOnCastClient } from '../../utils/filmCastMedia';

type FilmCastControlsProps = {
  signedUrl: string;
  title?: string;
};

function FilmCastControlsNative({ signedUrl, title }: FilmCastControlsProps) {
  const castState = useCastState();
  const client = useRemoteMediaClient();

  useEffect(() => {
    if (!client) {
      return;
    }

    let cancelled = false;

    void loadFilmOnCastClient(client, signedUrl, title).catch(() => {
      if (!cancelled) {
        // Signed URLs can expire; in-app playback remains available.
      }
    });

    return () => {
      cancelled = true;
    };
  }, [client, signedUrl, title]);

  if (castState == null || castState === CastState.NO_DEVICES_AVAILABLE) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <CastButton style={styles.castButton} tintColor="#ffffff" />
    </View>
  );
}

export function FilmCastControls(props: FilmCastControlsProps) {
  if (!canUseFilmCast()) {
    return null;
  }

  return <FilmCastControlsNative {...props} />;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  castButton: {
    width: 44,
    height: 44,
  },
});
