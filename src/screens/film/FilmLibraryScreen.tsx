import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CalendarEmptyState } from '../../components/calendar/CalendarEmptyState';
import { FilmLibraryCard } from '../../components/film/FilmLibraryCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { spacing, typography } from '../../design-system';
import { fetchTeamFilmsByTeam } from '../../lib/filmRepository';
import { fetchTeamRoster } from '../../lib/teamRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import type { TeamFilm } from '../../types/teamFilm';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { buildFilmSharePayload, resolvePublicFilmShareUrl } from '../../utils/filmShare';

type NavigationProp = NativeStackNavigationProp<FilmStackParamList, 'FilmLibrary'>;
type FilmLibraryRouteProp = RouteProp<FilmStackParamList, 'FilmLibrary'>;

export function FilmLibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FilmLibraryRouteProp>();
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [films, setFilms] = useState<TeamFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);
  const successMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canManageFilm = canEditPlayMetadata(selectedTeamMemberRole);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  useEffect(() => {
    const message = route.params?.successMessage;

    if (!message) {
      return;
    }

    setSuccessMessage(message);
    navigation.setParams({ successMessage: undefined });

    if (successMessageTimerRef.current) {
      clearTimeout(successMessageTimerRef.current);
    }

    successMessageTimerRef.current = setTimeout(() => {
      setSuccessMessage(null);
      successMessageTimerRef.current = null;
    }, 3000);

    return () => {
      if (successMessageTimerRef.current) {
        clearTimeout(successMessageTimerRef.current);
        successMessageTimerRef.current = null;
      }
    };
  }, [navigation, route.params?.successMessage]);

  const loadFilms = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);

    try {
      const [loadedFilms, roster] = await Promise.all([
        fetchTeamFilmsByTeam(teamId),
        fetchTeamRoster(teamId),
      ]);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const names: Record<string, string> = {};

      for (const member of roster) {
        names[member.user_id] = member.display_name ?? 'Team member';
      }

      setFilms(loadedFilms);
      setCreatorNames(names);
      loadedTeamIdRef.current = teamId;
    } catch (loadError) {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team film.';
      setError(message);
      setFilms([]);
      setCreatorNames({});
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setFilms([]);
        setError(null);
        setLoading(false);
        setCreatorNames({});
        loadedTeamIdRef.current = null;
        return;
      }

      void loadFilms(teamId);
    }, [selectedTeam?.id, loadFilms]),
  );

  const handleAddFilm = () => {
    navigation.navigate('FilmAddMethod');
  };

  const handleOpenFilmDetail = (film: TeamFilm) => {
    navigation.navigate('FilmDetail', { film });
  };

  const handleOpenFilm = (film: TeamFilm) => {
    navigation.navigate('WatchFilm', { film });
  };

  const handleShareFilm = useCallback(
    async (film: TeamFilm) => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        return;
      }

      try {
        const publicUrl = await resolvePublicFilmShareUrl(teamId, film, canManageFilm);
        await Share.share(buildFilmSharePayload(publicUrl));
      } catch (shareError) {
        if (shareError instanceof Error && shareError.message.includes('User did not share')) {
          return;
        }

        const message =
          shareError instanceof Error ? shareError.message : 'Failed to share film link.';
        setError(message);
      }
    },
    [canManageFilm, selectedTeam?.id],
  );

  const emptyMessage = useMemo(() => {
    if (canManageFilm) {
      return 'Game film shared here helps your team review together. Tap Add Film to get started.';
    }

    return 'Game film shared here helps your team review together. Ask your coach to add film.';
  }, [canManageFilm]);

  if (loading) {
    return (
      <ScreenContainer title="Film" subtitle={selectedTeam?.name} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Film" subtitle={selectedTeam?.name}>
      {successMessage ? (
        <View style={styles.successToast}>
          <Text style={styles.successToastText}>{successMessage}</Text>
        </View>
      ) : null}

      {canManageFilm ? (
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={handleAddFilm}
        >
          <Text style={styles.addButtonText}>Add Film</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && films.length === 0 ? (
        <View style={styles.emptyStateWrap}>
          <CalendarEmptyState title="No film yet" message={emptyMessage} />
          {canManageFilm ? (
            <Pressable
              style={({ pressed }) => [styles.emptyAddButton, pressed && styles.addButtonPressed]}
              onPress={handleAddFilm}
            >
              <Text style={styles.addButtonText}>Add Film</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {films.map((film) => (
        <FilmLibraryCard
          key={film.id}
          film={film}
          addedBy={creatorNames[film.created_by] ?? 'Team member'}
          onOpen={handleOpenFilm}
          onPress={handleOpenFilmDetail}
          onShare={handleShareFilm}
        />
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  addButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    marginBottom: spacing.lg,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  successToast: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  successToastText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  error: {
    ...typography.body,
    color: colors.gold,
    marginBottom: spacing.lg,
  },
  emptyStateWrap: {
    gap: spacing.lg,
  },
  emptyAddButton: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
});
