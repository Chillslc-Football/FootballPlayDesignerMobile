export const DEFAULT_TEAM_UPDATE_TYPE = 'announcement' as const;

export type TeamUpdateType = typeof DEFAULT_TEAM_UPDATE_TYPE;

export type TeamUpdate = {
  id: string;
  team_id: string;
  title: string;
  body: string;
  update_type: TeamUpdateType;
  is_pinned: boolean;
  show_on_home: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateTeamUpdateInput = {
  teamId: string;
  body: string;
  title?: string;
  update_type?: TeamUpdateType;
  is_pinned?: boolean;
  createdBy: string;
};
