import type { TeamRole } from '../types/team';

export function canEditPlayMetadata(role: TeamRole | null): boolean {
  return role === 'team_owner' || role === 'coach';
}
