import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { UploadFilmPlayer } from '../../components/film/UploadFilmPlayer';
import { palette, spacing, typography } from '../../design-system';
import { fetchPublicFilmPlayback } from '../../lib/publicFilmPlaybackRepository';
import { colors } from '../../theme';

type PublicFilmShareScreenProps = {
  shareToken: string;
};

export function PublicFilmShareScreen({ shareToken }: PublicFilmShareScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<string>('upload');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setTitle(null);
    setPlaybackUrl(null);

    void fetchPublicFilmPlayback(shareToken)
      .then((playback) => {
        if (!active) {
          return;
        }

        setTitle(playback.title);
        setPlaybackUrl(playback.playbackUrl);
        setVideoSourceType(playback.videoSourceType);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Film not available.';
        setError(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [shareToken]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading film…</Text>
      </View>
    );
  }

  if (error || !title || !playbackUrl) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Film not available.</Text>
        {error && error !== 'Film not available.' ? (
          <Text style={styles.errorDetail}>{error}</Text>
        ) : null}
      </View>
    );
  }

  const isUpload = videoSourceType === 'upload';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      {isUpload ? (
        <UploadFilmPlayer signedUrl={playbackUrl} />
      ) : (
        <View style={styles.externalContainer}>
          <Text style={styles.externalText}>This film opens in your browser or provider app.</Text>
          <Pressable
            style={({ pressed }) => [styles.openButton, pressed && styles.buttonPressed]}
            onPress={() => {
              void Linking.openURL(playbackUrl);
            }}
          >
            <Text style={styles.openButtonText}>Open Film</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: palette.text.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: palette.text.secondary,
  },
  errorTitle: {
    ...typography.heading,
    color: palette.text.primary,
    textAlign: 'center',
  },
  errorDetail: {
    ...typography.bodySmall,
    color: palette.text.muted,
    textAlign: 'center',
  },
  externalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  externalText: {
    ...typography.body,
    color: palette.text.secondary,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
  },
  openButton: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    minHeight: 48,
    minWidth: 200,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  openButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
