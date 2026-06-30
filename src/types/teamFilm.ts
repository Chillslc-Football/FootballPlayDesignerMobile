export const TEAM_FILM_VIDEO_SOURCE_TYPES = [
  'youtube',
  'hudl',
  'google_drive',
  'dropbox',
  'upload',
  'external',
] as const;

export type TeamFilmVideoSourceType = (typeof TEAM_FILM_VIDEO_SOURCE_TYPES)[number];

export type TeamFilm = {
  id: string;
  team_id: string;
  title: string;
  notes: string | null;
  video_source_type: TeamFilmVideoSourceType;
  video_source: string;
  is_public_shared: boolean;
  share_token: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TeamFilmDraft = {
  id: string;
  title: string;
  notes: string | null;
  video_source: string;
};

export function teamFilmToDraft(film: TeamFilm): TeamFilmDraft {
  return {
    id: film.id,
    title: film.title,
    notes: film.notes,
    video_source: film.video_source,
  };
}

export function createEmptyTeamFilmDraft(): TeamFilmDraft {
  return {
    id: '',
    title: '',
    notes: null,
    video_source: '',
  };
}

export function generateFilmId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function isUploadFilm(film: Pick<TeamFilm, 'video_source_type'>): boolean {
  return film.video_source_type === 'upload';
}

export function generateShareToken(): string {
  return generateFilmId();
}
