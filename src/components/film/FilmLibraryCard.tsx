import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FilmThumbnail } from './FilmThumbnail';
import { cardPresets, palette, spacing, typography } from '../../design-system';
import { colors } from '../../theme';
import { isUploadFilm, type TeamFilm } from '../../types/teamFilm';
import { formatFilmProviderBadge, resolveFilmProvider } from '../../utils/filmProvider';
import { isThumbnailSupported } from '../../utils/filmThumbnail';
import {
  formatTeamFilmRelativeAddedDate,
  previewTeamFilmNotes,
} from '../../utils/teamFilmDisplay';

type FilmLibraryCardProps = {
  film: TeamFilm;
  addedBy: string;
  onWatch: (film: TeamFilm) => void;
  onShowOptions: (film: TeamFilm) => void;
};

const CARD_THUMBNAIL_HEIGHT = 72;

export function FilmLibraryCard({ film, addedBy, onWatch, onShowOptions }: FilmLibraryCardProps) {
  const provider = resolveFilmProvider(film.video_source, film.video_source_type);
  const providerBadge = formatFilmProviderBadge(provider);
  const showThumbnail = isThumbnailSupported(provider);
  const notesPreview = previewTeamFilmNotes(film.notes);

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.cardBody, pressed && styles.cardPressed]}
        onPress={() => onWatch(film)}
        accessibilityRole="button"
        accessibilityLabel={`Watch ${film.title}`}
      >
        {showThumbnail ? (
          <FilmThumbnail
            videoSource={film.video_source}
            provider={provider}
            height={CARD_THUMBNAIL_HEIGHT}
          />
        ) : null}

        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>
            {showThumbnail || isUploadFilm(film) ? film.title : `🎥 ${film.title}`}
          </Text>

          <Text style={styles.providerBadge}>{providerBadge}</Text>

          {notesPreview ? (
            <Text style={styles.notesPreview} numberOfLines={2}>
              {notesPreview}
            </Text>
          ) : null}

          <Text style={styles.meta}>
            Added by {addedBy} · {formatTeamFilmRelativeAddedDate(film.created_at)}
          </Text>

          <Text style={styles.watchHint}>Tap to watch</Text>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        onPress={() => onShowOptions(film)}
        accessibilityLabel="Film options"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Text style={styles.menuIcon}>⋮</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardPresets.default.container,
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBody: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xl + spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.primary,
    marginBottom: spacing.xs,
  },
  providerBadge: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    fontWeight: typography.subheading.fontWeight,
    marginBottom: spacing.xs,
  },
  notesPreview: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    lineHeight: typography.bodySmall.lineHeight,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: palette.text.muted,
    marginBottom: spacing.xs,
  },
  watchHint: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: typography.subheading.fontWeight,
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    zIndex: 1,
  },
  menuButtonPressed: {
    opacity: 0.7,
  },
  menuIcon: {
    color: palette.text.secondary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
});
