import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { palette, spacing, typography } from '../../design-system';
import { FilmThumbnail } from '../../components/film/FilmThumbnail';
import { fetchProfileDisplayName } from '../../lib/teamRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import { isUploadFilm } from '../../types/teamFilm';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatFilmProviderBadge, resolveFilmProvider } from '../../utils/filmProvider';
import { isThumbnailSupported } from '../../utils/filmThumbnail';
import { formatTeamFilmDate } from '../../utils/teamFilmDisplay';
import { confirmDeleteTeamFilm } from '../../utils/filmDeleteAction';
import { showFilmOptionsMenu } from '../../utils/filmCardActions';

type Props = NativeStackScreenProps<FilmStackParamList, 'FilmDetail'>;

export function FilmDetailScreen({ navigation, route }: Props) {
  const { film } = route.params;
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdByName, setCreatedByName] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const actionMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showActionMessage = useCallback((message: string) => {
    if (actionMessageTimerRef.current) {
      clearTimeout(actionMessageTimerRef.current);
    }

    setActionMessage(message);
    actionMessageTimerRef.current = setTimeout(() => {
      setActionMessage(null);
      actionMessageTimerRef.current = null;
    }, 2000);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (actionMessageTimerRef.current) {
          clearTimeout(actionMessageTimerRef.current);
          actionMessageTimerRef.current = null;
        }
      };
    }, []),
  );

  const handleWatch = () => {
    navigation.navigate('WatchFilm', { film });
  };

  const handleDelete = useCallback(() => {
    confirmDeleteTeamFilm({
      film,
      teamId,
      navigation,
      onDeletingChange: setDeleting,
      onError: setError,
    });
  }, [film, navigation, teamId]);

  const showOverflowMenu = useCallback(() => {
    showFilmOptionsMenu({
      film,
      teamId,
      navigation,
      canManageFilm,
      onError: setError,
      onActionMessage: showActionMessage,
      onDeletingChange: setDeleting,
    });
  }, [canManageFilm, film, navigation, showActionMessage, teamId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={({ pressed }) => [styles.headerMenuButton, pressed && styles.buttonPressed]}
          onPress={showOverflowMenu}
          disabled={deleting}
          accessibilityLabel="Film options"
          accessibilityRole="button"
        >
          <Text style={styles.headerMenuIcon}>⋮</Text>
        </Pressable>
      ),
    });
  }, [deleting, navigation, showOverflowMenu]);

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

      {actionMessage ? (
        <View style={styles.actionToast}>
          <Text style={styles.actionToastText}>{actionMessage}</Text>
        </View>
      ) : null}

      {deleting ? (
        <View style={styles.deletingBlock}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.deletingText}>Deleting film…</Text>
        </View>
      ) : null}

      {canManageFilm ? (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            (deleting || pressed) && styles.buttonPressed,
          ]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>Delete Film</Text>
        </Pressable>
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
  actionToast: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionToastText: {
    ...typography.bodySmall,
    color: palette.text.primary,
    fontWeight: typography.subheading.fontWeight,
  },
  deletingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  deletingText: {
    ...typography.bodySmall,
    color: palette.text.secondary,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 44,
    paddingVertical: 12,
  },
  deleteButtonText: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  headerMenuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.OS === 'android' ? spacing.xs : 0,
    minHeight: 36,
    minWidth: 36,
    paddingHorizontal: spacing.sm,
  },
  headerMenuIcon: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
