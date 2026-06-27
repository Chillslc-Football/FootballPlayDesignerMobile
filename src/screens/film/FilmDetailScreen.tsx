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
import { deleteTeamFilm } from '../../lib/filmRepository';
import { fetchProfileDisplayName } from '../../lib/teamRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import { teamFilmToDraft } from '../../types/teamFilm';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import {
  formatTeamFilmDate,
  formatTeamFilmVideoSourceType,
} from '../../utils/teamFilmDisplay';

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
      await Share.share({
        title: film.title,
        message: `${film.title}\n${film.video_source}`,
        url: film.video_source,
      });
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
              await deleteTeamFilm(teamId, film.id);
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

      <Pressable
        style={({ pressed }) => [styles.watchButton, pressed && styles.buttonPressed]}
        onPress={handleWatch}
        disabled={deleting}
      >
        <Text style={styles.watchButtonText}>Watch Film</Text>
      </Pressable>
      <Text style={styles.watchNote}>Video opens in the provider app or browser.</Text>

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

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Source</Text>
        <Text style={styles.fieldValue}>
          {formatTeamFilmVideoSourceType(film.video_source_type)}
        </Text>
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

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={handleCopyLink}
          disabled={deleting}
        >
          <Text style={styles.secondaryButtonText}>
            {copyConfirmed ? 'Link copied' : 'Copy Link'}
          </Text>
        </Pressable>
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
    marginBottom: spacing.lg,
  },
  watchButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
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
