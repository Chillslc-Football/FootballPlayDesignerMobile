export type TeamFormat = '11v11' | '8v8' | '7v7';

export const TEAM_FORMAT_OPTIONS: { value: TeamFormat; label: string }[] = [
  { value: '11v11', label: '11v11 (standard)' },
  { value: '8v8', label: '8v8' },
  { value: '7v7', label: '7v7' },
];

export function isTeamFormat(value: string | null | undefined): value is TeamFormat {
  return value === '11v11' || value === '8v8' || value === '7v7';
}
