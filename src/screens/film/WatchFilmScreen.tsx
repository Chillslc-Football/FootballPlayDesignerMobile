import { useCallback, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { palette, spacing, typography } from '../../design-system';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { colors } from '../../theme';
import { getBrowserOpenHint } from '../../utils/teamFilmDisplay';

type Props = NativeStackScreenProps<FilmStackParamList, 'WatchFilm'>;

export function WatchFilmScreen({ route }: Props) {
  const { film } = route.params;
  const hasOpenedRef = useRef(false);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(film.video_source);
  }, [film.video_source]);

  useFocusEffect(
    useCallback(() => {
      if (hasOpenedRef.current) {
        return;
      }

      hasOpenedRef.current = true;
      openInBrowser();
    }, [openInBrowser]),
  );

  const browserHint = getBrowserOpenHint(film.video_source_type);

  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
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
});
