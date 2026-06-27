import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import { palette, spacing, typography } from '../../design-system';
import { FilmThumbnail } from '../../components/film/FilmThumbnail';
import { deleteTeamFilm } from '../../lib/filmRepository';
import { fetchProfileDisplayName } from '../../lib/teamRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import { teamFilmToDraft, isUploadFilm } from '../../types/teamFilm';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatFilmProviderBadge, resolveFilmProvider } from '../../utils/filmProvider';
import { isThumbnailSupported } from '../../utils/filmThumbnail';
import { buildFilmSharePayload, formatTeamFilmDate } from '../../utils/teamFilmDisplay';

type Props = NativeStackScreenProps<FilmStackParamList, 'FilmDetail'>;

export function FilmDetailScreen({ navigation, route }: Props) {
  const { film } = route.params;
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdByName, setCreatedByName] = useState<string | null>(null);
  const [copyConfirmed, setCopyConfirmed] = useState(false);

  const canManageFilm = canEditPlayMetadata(selectedTeamMemberRole);
  const notes = film.notes?.trim();
  const teamId = selectedTeam?.id ?? film.team_id;
  const provider = resolveFilmProvider(film.video_source, film.video_source_type);
  const providerBadge = formatFilmProviderBadge(provider);
  const showThumbnail = isThumbnailSupported(provider);
  const isUpload = isUploadFilm(film);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void fetchProfileDisplayName(film.created_by).then((name) => {
        if (active) {
          setCreatedByName(name);
        }
      });

      return () => {
        active = false;
      };
    }, [film.created_by]),
  );

  const handleWatch = () => {
    navigation.navigate('WatchFilm', { film });
  };

  const handleShare = async () => {
    try {
      const payload = buildFilmSharePayload(film);
      await Share.share(payload);
    } catch (shareError) {
      if (shareError instanceof Error && shareError.message.includes('User did not share')) {
        return;
      }

      const message =
        shareError instanceof Error ? shareError.message : 'Failed to share film link.';
      setError(message);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(film.video_source);
      setCopyConfirmed(true);
      setTimeout(() => setCopyConfirmed(false), 2000);
    } catch (copyError) {
      const message =
        copyError instanceof Error ? copyError.message : 'Failed to copy film link.';
      setError(message);
    }
  };

  const handleEdit = () => {
    navigation.navigate('FilmForm', {
      draft: teamFilmToDraft(film),
      editingExisting: true,
      isUpload,
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete film?', 'Delete this film from the team library? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            setError(null);

            try {
              await deleteTeamFilm(teamId, film);
              navigation.popToTop();
            } catch (deleteError) {
              const message =
                deleteError instanceof Error ? deleteError.message : 'Failed to delete team film.';
              setError(message);
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{film.title}</Text>

      <Text style={styles.providerBadge}>{providerBadge}</Text>

      {showThumbnail ? (
        <FilmThumbnail
          videoSource={film.video_source}
          provider={provider}
          height={140}
          rounded
        />
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.watchButton, pressed && styles.buttonPressed]}
        onPress={handleWatch}
        disabled={deleting}
      >
        <Text style={styles.watchButtonText}>Open Film</Text>
      </Pressable>
      <Text style={styles.watchNote}>
        {isUpload
          ? 'Uploaded film plays inside Winner\'s Choice.'
          : 'Video opens in the provider app or browser.'}
      </Text>

      {notes ? (
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <Text style={styles.fieldValue}>{notes}</Text>
        </View>
      ) : null}

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Added by</Text>
        <Text style={styles.fieldValue}>{createdByName ?? 'Team member'}</Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Added on</Text>
        <Text style={styles.fieldValue}>{formatTeamFilmDate(film.created_at)}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.shareActions}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={handleShare}
          disabled={deleting}
        >
          <Text style={styles.secondaryButtonText}>Share</Text>
        </Pressable>

        {!isUpload ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={handleCopyLink}
            disabled={deleting}
          >
            <Text style={styles.secondaryButtonText}>
              {copyConfirmed ? 'Link copied' : 'Copy Link'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {canManageFilm ? (
        <View style={styles.manageActions}>
          <Pressable
            style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
            onPress={handleEdit}
            disabled={deleting}
          >
            <Text style={styles.editButtonText}>Edit Film</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              (deleting || pressed) && styles.buttonPressed,
            ]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={colors.gold} size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Film</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.heading,
    color: palette.text.primary,
    marginBottom: spacing.sm,
  },
  providerBadge: {
    ...typography.subheading,
    color: palette.text.secondary,
    fontWeight: typography.subheading.fontWeight,
    marginBottom: spacing.md,
  },
  watchButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  watchNote: {
    ...typography.bodySmall,
    color: palette.text.muted,
    marginBottom: spacing.xl,
    lineHeight: typography.body.lineHeight,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.text.muted,
    fontWeight: typography.subheading.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  fieldValue: {
    ...typography.body,
    color: palette.text.secondary,
    lineHeight: 24,
  },
  error: {
    ...typography.body,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  shareActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    flex: 1,
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
  manageActions: {
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gold,
  },
});
