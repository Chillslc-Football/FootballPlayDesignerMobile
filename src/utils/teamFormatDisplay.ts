import { isTeamFormat, TEAM_FORMAT_OPTIONS, type TeamFormat } from '../types/teamFormat';

export function formatTeamFormatLabel(format: TeamFormat | string | null | undefined): string {
  if (!format || !isTeamFormat(format)) {
    return 'Format unavailable';
  }

  return TEAM_FORMAT_OPTIONS.find((option) => option.value === format)?.label ?? 'Format unavailable';
}
