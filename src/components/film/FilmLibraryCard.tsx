import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { FilmThumbnail } from './FilmThumbnail';
import { cardPresets, palette, spacing, typography } from '../../design-system';
import { colors } from '../../theme';
import { isUploadFilm, type TeamFilm } from '../../types/teamFilm';
import { formatFilmProviderBadge, resolveFilmProvider } from '../../utils/filmProvider';
import { isThumbnailSupported } from '../../utils/filmThumbnail';
import { buildFilmSharePayload, formatTeamFilmRelativeAddedDate } from '../../utils/teamFilmDisplay';

type FilmLibraryCardProps = {
  film: TeamFilm;
  addedBy: string;
  onOpen: (film: TeamFilm) => void;
  onPress: (film: TeamFilm) => void;
};

const CARD_THUMBNAIL_HEIGHT = 72;

export function FilmLibraryCard({ film, addedBy, onOpen, onPress }: FilmLibraryCardProps) {
  const provider = resolveFilmProvider(film.video_source, film.video_source_type);
  const providerBadge = formatFilmProviderBadge(provider);
  const showThumbnail = isThumbnailSupported(provider);

  const handleShare = () => {
    void Share.share(buildFilmSharePayload(film));
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(film)}
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

        <Text style={styles.meta}>
          Added by {addedBy} · {formatTeamFilmRelativeAddedDate(film.created_at)}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.openButton,
              pressed && styles.actionPressed,
            ]}
            onPress={() => onOpen(film)}
          >
            <Text style={styles.openButtonText}>Open</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.shareButton,
              pressed && styles.actionPressed,
            ]}
            onPress={handleShare}
          >
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardPresets.default.container,
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  meta: {
    ...typography.caption,
    color: palette.text.muted,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  openButton: {
    backgroundColor: colors.accent,
  },
  shareButton: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionPressed: {
    opacity: 0.85,
  },
  openButtonText: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: colors.background,
  },
  shareButtonText: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: colors.text,
  },
});
