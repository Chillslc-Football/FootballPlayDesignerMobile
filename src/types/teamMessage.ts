export type TeamMessageThread = {
  id: string;
  team_id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type TeamMessage = {
  id: string;
  thread_id: string;
  team_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};
