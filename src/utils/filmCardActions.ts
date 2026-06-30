import { Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import type { FilmStackParamList } from '../navigation/FilmStack';
import { isUploadFilm, teamFilmToDraft, type TeamFilm } from '../types/teamFilm';
import { confirmDeleteTeamFilm } from './filmDeleteAction';
import { copyPublicFilmUrl, resolvePublicFilmShareUrl, sharePublicFilmUrl } from './filmShare';

type FilmNavigation = NavigationProp<FilmStackParamList>;

export type FilmCardActionCallbacks = {
  onError?: (message: string | null) => void;
  onActionMessage?: (message: string) => void;
  onDeletingChange?: (deleting: boolean) => void;
};

function getShareErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to share film link.';
}

function getCopyErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to copy film link.';
}

function isShareCancelled(error: unknown): boolean {
  return error instanceof Error && error.message.includes('User did not share');
}

export async function shareTeamFilm(
  teamId: string,
  film: TeamFilm,
  canManageFilm: boolean,
): Promise<void> {
  const publicUrl = await resolvePublicFilmShareUrl(teamId, film, canManageFilm);
  await sharePublicFilmUrl(publicUrl);
}

export async function copyTeamFilmLink(
  teamId: string,
  film: TeamFilm,
  canManageFilm: boolean,
): Promise<void> {
  const publicUrl = await resolvePublicFilmShareUrl(teamId, film, canManageFilm);
  await copyPublicFilmUrl(publicUrl);
}

export function editTeamFilm(navigation: FilmNavigation, film: TeamFilm): void {
  navigation.navigate('FilmForm', {
    draft: teamFilmToDraft(film),
    editingExisting: true,
    isUpload: isUploadFilm(film),
  });
}

export function showFilmOptionsMenu({
  film,
  teamId,
  navigation,
  canManageFilm,
  onError,
  onActionMessage,
  onDeletingChange,
}: {
  film: TeamFilm;
  teamId: string;
  navigation: FilmNavigation;
  canManageFilm: boolean;
} & FilmCardActionCallbacks): void {
  const options: Array<{
    text: string;
    style?: 'cancel' | 'destructive' | 'default';
    onPress?: () => void;
  }> = [];

  if (canManageFilm) {
    options.push({
      text: 'Edit',
      onPress: () => editTeamFilm(navigation, film),
    });
  }

  options.push({
    text: 'Share',
    onPress: () => {
      void shareTeamFilm(teamId, film, canManageFilm).catch((shareError) => {
        if (isShareCancelled(shareError)) {
          return;
        }

        onError?.(getShareErrorMessage(shareError));
      });
    },
  });

  options.push({
    text: 'Copy Link',
    onPress: () => {
      void copyTeamFilmLink(teamId, film, canManageFilm)
        .then(() => onActionMessage?.('Link copied'))
        .catch((copyError) => {
          onError?.(getCopyErrorMessage(copyError));
        });
    },
  });

  if (canManageFilm) {
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        confirmDeleteTeamFilm({
          film,
          teamId,
          navigation,
          onDeletingChange,
          onError,
        });
      },
    });
  }

  options.push({ text: 'Cancel', style: 'cancel' });

  Alert.alert('Film options', undefined, options);
}
