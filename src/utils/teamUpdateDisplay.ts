import { DEFAULT_TEAM_UPDATE_TYPE, type TeamUpdateType } from '../types/teamUpdate';

const UPDATE_TYPE_LABELS: Record<TeamUpdateType, string> = {
  announcement: 'Announcement',
};

export function formatTeamUpdateType(updateType: TeamUpdateType): string {
  return UPDATE_TYPE_LABELS[updateType] ?? UPDATE_TYPE_LABELS[DEFAULT_TEAM_UPDATE_TYPE];
}

export function previewTeamUpdateBody(body: string, maxLength = 120): string {
  const trimmed = body.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function deriveTeamUpdateTitle(body: string): string {
  const trimmed = body.trim();
  const firstLine = trimmed.split(/\r?\n/, 1)[0]?.trim() ?? '';

  return firstLine || 'Team Update';
}

export function formatTeamUpdateDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
