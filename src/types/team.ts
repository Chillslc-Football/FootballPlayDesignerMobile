export type TeamRole = 'team_owner' | 'coach' | 'player' | 'parent';

export type Team = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type TeamMembership = {
  role: TeamRole;
  team: Team;
};

export type TeamRosterMember = {
  user_id: string;
  role: TeamRole;
  display_name: string | null;
};
