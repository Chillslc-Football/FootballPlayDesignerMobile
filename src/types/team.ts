import type { TeamFormat } from './teamFormat';

export type TeamRole = 'team_owner' | 'coach' | 'player' | 'parent';

export type Team = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  team_format: TeamFormat | null;
};

export type TeamMembership = {
  role: TeamRole;
  team: Team;
};

export type TeamRosterMember = {
  user_id: string;
  role: TeamRole;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  jersey_number: number | null;
  primary_position: string | null;
  secondary_position: string | null;
};
