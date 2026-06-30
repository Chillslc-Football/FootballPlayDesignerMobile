import { Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import { deleteTeamFilm } from '../lib/filmRepository';
import type { FilmStackParamList } from '../navigation/FilmStack';
import type { TeamFilm } from '../types/teamFilm';

type FilmNavigation = NavigationProp<FilmStackParamList>;

export function confirmDeleteTeamFilm({
  film,
  teamId,
  navigation,
  onDeletingChange,
  onError,
}: {
  film: TeamFilm;
  teamId: string;
  navigation: FilmNavigation;
  onDeletingChange?: (deleting: boolean) => void;
  onError?: (message: string | null) => void;
}): void {
  Alert.alert(
    'Delete film?',
    'Delete this film from the team library? This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            onDeletingChange?.(true);
            onError?.(null);

            try {
              await deleteTeamFilm(teamId, film);
              navigation.reset({
                index: 0,
                routes: [{ name: 'FilmLibrary', params: { successMessage: 'Film deleted.' } }],
              });
            } catch (deleteError) {
              const message =
                deleteError instanceof Error ? deleteError.message : 'Failed to delete team film.';
              onError?.(message);
            } finally {
              onDeletingChange?.(false);
            }
          })();
        },
      },
    ],
  );
}
