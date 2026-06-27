import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { UploadFilmPlayer } from '../../components/film/UploadFilmPlayer';
import { palette, spacing, typography } from '../../design-system';
import { createFilmSignedUrl } from '../../lib/filmStorageRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { colors } from '../../theme';
import { resolveFilmProvider } from '../../utils/filmProvider';
import { getBrowserOpenHint } from '../../utils/teamFilmDisplay';

type Props = NativeStackScreenProps<FilmStackParamList, 'WatchFilm'>;

function ExternalFilmWatch({ videoSource, provider }: { videoSource: string; provider: ReturnType<typeof resolveFilmProvider> }) {
  const hasOpenedRef = useRef(false);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(videoSource);
  }, [videoSource]);

  useFocusEffect(
    useCallback(() => {
      if (hasOpenedRef.current) {
        return;
      }

      hasOpenedRef.current = true;
      openInBrowser();
    }, [openInBrowser]),
  );

  const browserHint = getBrowserOpenHint(provider);

  return (
    <View style={styles.browserContainer}>
      <View style={styles.browserPrompt}>
        <Text style={styles.promptTitle}>Open in browser</Text>
        <Text style={styles.promptText}>
          {browserHint ?? 'Video opens in the provider app or browser.'}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={openInBrowser}
        >
          <Text style={styles.primaryButtonText}>Open Film</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={openInBrowser}
        >
          <Text style={styles.secondaryButtonText}>Open in Browser</Text>
        </Pressable>
      </View>
    </View>
  );
}

function UploadFilmWatch({ storagePath }: { storagePath: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    void createFilmSignedUrl(storagePath)
      .then((url) => {
        if (!active) {
          return;
        }

        if (!url) {
          setError('Could not load uploaded film.');
          return;
        }

        setSignedUrl(url);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Could not load uploaded film.';
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
  }, [storagePath]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading film…</Text>
      </View>
    );
  }

  if (error || !signedUrl) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error ?? 'Could not load uploaded film.'}</Text>
      </View>
    );
  }

  return <UploadFilmPlayer signedUrl={signedUrl} />;
}

export function WatchFilmScreen({ route }: Props) {
  const { film } = route.params;
  const provider = resolveFilmProvider(film.video_source, film.video_source_type);

  if (provider === 'upload') {
    return <UploadFilmWatch storagePath={film.video_source} />;
  }

  return <ExternalFilmWatch videoSource={film.video_source} provider={provider} />;
}

const styles = StyleSheet.create({
  browserContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  browserPrompt: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  promptTitle: {
    ...typography.heading,
    color: palette.text.primary,
    textAlign: 'center',
  },
  promptText: {
    ...typography.body,
    color: palette.text.secondary,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: palette.text.secondary,
  },
  errorText: {
    ...typography.body,
    color: colors.gold,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
  },
});
