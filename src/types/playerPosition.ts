export const PLAYER_POSITIONS = [
  'QB',
  'RB',
  'WR',
  'TE',
  'OL',
  'DL',
  'LB',
  'CB',
  'S',
  'K',
  'P',
  'LS',
  'ATH',
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export const PLAYER_POSITION_LABELS: Record<PlayerPosition, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  WR: 'Wide Receiver',
  TE: 'Tight End',
  OL: 'Offensive Line',
  DL: 'Defensive Line',
  LB: 'Linebacker',
  CB: 'Cornerback',
  S: 'Safety',
  K: 'Kicker',
  P: 'Punter',
  LS: 'Long Snapper',
  ATH: 'Athlete',
};

export function isPlayerPosition(value: string | null | undefined): value is PlayerPosition {
  return Boolean(value && PLAYER_POSITIONS.includes(value as PlayerPosition));
}

export function normalizePlayerPosition(value: string | null | undefined): PlayerPosition | null {
  return isPlayerPosition(value) ? value : null;
}

export type TeamMemberPlayerInfoUpdate = {
  jerseyNumber: number | null;
  primaryPosition: string | null;
  secondaryPosition: string | null;
};

/** Exact snake_case columns on public.team_members for Supabase writes. */
export type TeamMemberPlayerInfoDbPayload = {
  jersey_number: number | null;
  primary_position: string | null;
  secondary_position: string | null;
};

export function buildTeamMemberPlayerInfoDbPayload(
  update: TeamMemberPlayerInfoUpdate,
): TeamMemberPlayerInfoDbPayload {
  return {
    jersey_number: update.jerseyNumber,
    primary_position: update.primaryPosition,
    secondary_position: update.secondaryPosition,
  };
}
