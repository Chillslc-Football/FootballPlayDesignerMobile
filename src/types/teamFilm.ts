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
