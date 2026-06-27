import type { TeamRosterMember } from '../types/team';
import { normalizeRosterPosition } from './teamPlayPositions';

export function getRosterPlayerLabel(member: Pick<TeamRosterMember, 'display_name'>): string {
  return member.display_name?.trim() || 'Team member';
}

export function getRosterPlayerInitials(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return '?';
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const firstInitial = parts[0]?.[0] ?? '';
  const lastInitial = parts[parts.length - 1]?.[0] ?? '';

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function formatRosterJerseyNumber(jerseyNumber: number | null | undefined): string | null {
  if (jerseyNumber === null || jerseyNumber === undefined) {
    return null;
  }

  return `#${jerseyNumber}`;
}

export function formatRosterPositionLine(
  primaryPosition: TeamRosterMember['primary_position'],
  secondaryPosition: TeamRosterMember['secondary_position'],
): string | null {
  if (primaryPosition && secondaryPosition) {
    return `${primaryPosition} / ${secondaryPosition}`;
  }

  if (primaryPosition) {
    return primaryPosition;
  }

  if (secondaryPosition) {
    return secondaryPosition;
  }

  return null;
}

export function parseJerseyNumberInput(value: string): number | null | 'invalid' {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    return 'invalid';
  }

  return parsed;
}

export function filterTeamPlayers(roster: TeamRosterMember[]): TeamRosterMember[] {
  return roster.filter((member) => member.role === 'player');
}

export function filterPlayersBySearch(
  players: TeamRosterMember[],
  query: string,
): TeamRosterMember[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return players;
  }

  return players.filter((player) => {
    const label = getRosterPlayerLabel(player).toLowerCase();
    const jerseyLabel =
      player.jersey_number !== null ? `#${player.jersey_number}`.toLowerCase() : '';

    return label.includes(normalized) || jerseyLabel.includes(normalized);
  });
}

export function mapRosterMemberPlayerInfo(row: {
  jersey_number?: number | null;
  primary_position?: string | null;
  secondary_position?: string | null;
}): Pick<TeamRosterMember, 'jersey_number' | 'primary_position' | 'secondary_position'> {
  return {
    jersey_number: row.jersey_number ?? null,
    primary_position: normalizeRosterPosition(row.primary_position),
    secondary_position: normalizeRosterPosition(row.secondary_position),
  };
}
