import { fetchProfileMembersByUserIds } from './profileRepository';
import { supabase } from './supabase';
import { createSafeRealtimeUnsubscribe } from './realtimeChannelCleanup';
import type { ProfileMemberFields } from '../types/profile';
import type {
  DirectMessageEligibleMember,
  DirectMessageThreadWithUnread,
  TeamMessage,
  TeamMessageHomeSummary,
  TeamMessageMentionAudience,
  TeamMessageThread,
  TeamMessageThreadKind,
  TeamMessageThreadWithUnread,
} from '../types/teamMessage';
import { resolveProfileDisplayName } from '../utils/profileDisplay';
import {
  formatConversationListTitle,
  formatConversationPreviewLine,
} from '../utils/teamMessageDisplay';

type TeamMessageThreadRow = {
  id: string;
  team_id: string;
  title: string;
  thread_kind: TeamMessageThreadKind;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

type TeamMessageThreadWithUnreadRow = TeamMessageThreadRow & {
  unread_count: number | string;
};

type DirectMessageThreadWithUnreadRow = TeamMessageThreadWithUnreadRow & {
  other_user_id: string;
  other_display_name: string | null;
};

type DirectMessageEligibleMemberRow = {
  user_id: string;
  role: string;
  display_name: string | null;
};

type TeamMessageRow = {
  id: string;
  thread_id: string;
  team_id: string;
  sender_id: string;
  body: string;
  mention_audiences?: TeamMessageMentionAudience[] | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

const MESSAGE_COLUMNS =
  'id, thread_id, team_id, sender_id, body, mention_audiences, created_at, edited_at, deleted_at';

function parseUnreadCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function rowToThread(row: TeamMessageThreadRow): TeamMessageThread {
  return {
    id: row.id,
    team_id: row.team_id,
    title: row.title,
    thread_kind: row.thread_kind ?? 'everyone',
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_message_at: row.last_message_at,
  };
}

function rowToThreadWithUnread(row: TeamMessageThreadWithUnreadRow): TeamMessageThreadWithUnread {
  return {
    ...rowToThread(row),
    unread_count: parseUnreadCount(row.unread_count),
  };
}

function rowToDirectThreadWithUnread(
  row: DirectMessageThreadWithUnreadRow,
): DirectMessageThreadWithUnread {
  return {
    ...rowToThreadWithUnread(row),
    other_user_id: row.other_user_id,
    other_display_name: row.other_display_name,
    other_avatar_url: null,
  };
}

async function enrichDirectThreadsWithOtherUserAvatars(
  threads: DirectMessageThreadWithUnread[],
): Promise<DirectMessageThreadWithUnread[]> {
  if (threads.length === 0) {
    return threads;
  }

  const otherUserIds = [...new Set(threads.map((thread) => thread.other_user_id))];
  const profileByUserId = await fetchProfileMembersByUserIds(otherUserIds);

  return threads.map((thread) => ({
    ...thread,
    other_avatar_url: profileByUserId.get(thread.other_user_id)?.avatar_url ?? null,
  }));
}

function collectUniqueSenderIds(rows: TeamMessageRow[]): string[] {
  return [...new Set(rows.map((row) => row.sender_id))];
}

function rowsToMessages(
  rows: TeamMessageRow[],
  profileBySenderId: Map<string, ProfileMemberFields>,
): TeamMessage[] {
  return rows.map((row) => {
    const profile = profileBySenderId.get(row.sender_id);

    return {
      id: row.id,
      thread_id: row.thread_id,
      team_id: row.team_id,
      sender_id: row.sender_id,
      sender_name: profile ? resolveProfileDisplayName(profile) : null,
      sender_avatar_url: profile?.avatar_url ?? null,
      body: row.body,
      mention_audiences: row.mention_audiences ?? [],
      created_at: row.created_at,
      edited_at: row.edited_at,
      deleted_at: row.deleted_at,
    };
  });
}

async function enrichMessagesWithSenderProfiles(rows: TeamMessageRow[]): Promise<TeamMessage[]> {
  const senderIds = collectUniqueSenderIds(rows);
  const profileBySenderId = await fetchProfileMembersByUserIds(senderIds);
  return rowsToMessages(rows, profileBySenderId);
}

export async function listAccessibleTeamMessageThreads(
  teamId: string,
): Promise<TeamMessageThreadWithUnread[]> {
  const { data, error } = await supabase.rpc('list_accessible_team_message_threads', {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TeamMessageThreadWithUnreadRow[]).map(rowToThreadWithUnread);
}

export async function listDirectMessageThreads(
  teamId: string,
): Promise<DirectMessageThreadWithUnread[]> {
  const { data, error } = await supabase.rpc('list_direct_message_threads', {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const threads = ((data ?? []) as DirectMessageThreadWithUnreadRow[]).map(
    rowToDirectThreadWithUnread,
  );

  return enrichDirectThreadsWithOtherUserAvatars(threads);
}

export async function listDmEligibleMembers(teamId: string): Promise<DirectMessageEligibleMember[]> {
  const { data, error } = await supabase.rpc('list_dm_eligible_members', {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DirectMessageEligibleMemberRow[]).map((row) => ({
    user_id: row.user_id,
    role: row.role,
    display_name: row.display_name,
  }));
}

export async function getOrCreateDirectMessageThread(
  teamId: string,
  targetUserId: string,
): Promise<TeamMessageThread> {
  const { data, error } = await supabase.rpc('get_or_create_direct_message_thread', {
    p_team_id: teamId,
    p_target_user_id: targetUserId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Failed to start direct message.');
  }

  return rowToThread(data as TeamMessageThreadRow);
}

export async function getOrCreateTeamChatThread(teamId: string): Promise<TeamMessageThread> {
  const { data, error } = await supabase.rpc('get_or_create_team_chat_thread', {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Failed to load team chat thread.');
  }

  return rowToThread(data as TeamMessageThreadRow);
}

export async function createCustomGroupThread(
  teamId: string,
  name: string,
  memberIds: string[],
): Promise<TeamMessageThread> {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new Error('Group name is required.');
  }

  const { data, error } = await supabase.rpc('create_custom_group_thread', {
    p_team_id: teamId,
    p_name: trimmedName,
    p_member_ids: memberIds,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Failed to create group.');
  }

  return rowToThread(data as TeamMessageThreadRow);
}

export async function fetchTeamMessagesByThread(
  teamId: string,
  threadId: string,
): Promise<TeamMessage[]> {
  const { data, error } = await supabase
    .from('team_messages')
    .select(MESSAGE_COLUMNS)
    .eq('team_id', teamId)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return enrichMessagesWithSenderProfiles((data ?? []) as TeamMessageRow[]);
}

export async function fetchLatestMessagesByThreadIds(
  teamId: string,
  threadIds: string[],
  options?: { excludeSenderId?: string },
): Promise<Map<string, TeamMessage>> {
  const uniqueThreadIds = [...new Set(threadIds)];
  const excludeSenderId = options?.excludeSenderId;

  if (uniqueThreadIds.length === 0) {
    return new Map();
  }

  const latestRows = await Promise.all(
    uniqueThreadIds.map(async (threadId) => {
      let query = supabase
        .from('team_messages')
        .select(MESSAGE_COLUMNS)
        .eq('team_id', teamId)
        .eq('thread_id', threadId)
        .is('deleted_at', null);

      if (excludeSenderId) {
        query = query.neq('sender_id', excludeSenderId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as TeamMessageRow;
    }),
  );

  const rows = latestRows.filter((row): row is TeamMessageRow => row != null);

  if (rows.length === 0) {
    return new Map();
  }

  const messages = await enrichMessagesWithSenderProfiles(rows);
  const messagesByThreadId = new Map<string, TeamMessage>();

  for (const message of messages) {
    messagesByThreadId.set(message.thread_id, message);
  }

  return messagesByThreadId;
}

export async function fetchLatestTeamMessageSummary(
  teamId: string,
): Promise<TeamMessageHomeSummary | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const [channels, directMessages] = await Promise.all([
    listAccessibleTeamMessageThreads(teamId),
    listDirectMessageThreads(teamId),
  ]);

  const allThreads = [...channels, ...directMessages];

  if (allThreads.length === 0) {
    return null;
  }

  const latestMessagesByThreadId = await fetchLatestMessagesByThreadIds(
    teamId,
    allThreads.map((thread) => thread.id),
    { excludeSenderId: user.id },
  );

  if (latestMessagesByThreadId.size === 0) {
    return null;
  }

  let latestMessage: TeamMessage | null = null;

  for (const message of latestMessagesByThreadId.values()) {
    if (
      !latestMessage ||
      new Date(message.created_at).getTime() > new Date(latestMessage.created_at).getTime()
    ) {
      latestMessage = message;
    }
  }

  if (!latestMessage) {
    return null;
  }

  const latestThread = allThreads.find((thread) => thread.id === latestMessage.thread_id);

  if (!latestThread) {
    return null;
  }

  return {
    channelLabel: formatConversationListTitle(latestThread),
    previewLine: formatConversationPreviewLine(
      latestThread.thread_kind,
      latestMessage.sender_name,
      latestMessage.body,
    ),
    created_at: latestMessage.created_at,
  };
}

export async function markThreadRead(threadId: string, upToMessageId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_thread_read', {
    p_thread_id: threadId,
    p_up_to_message_id: upToMessageId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTeamMessageUnreadCount(teamId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_team_message_unread_count', {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data === 'number') {
    return data;
  }

  if (typeof data === 'string') {
    const parsed = Number(data);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export async function sendTeamMessage(
  teamId: string,
  threadId: string,
  senderId: string,
  body: string,
): Promise<TeamMessage> {
  const trimmedBody = body.trim();

  if (trimmedBody.length === 0) {
    throw new Error('Message cannot be empty.');
  }

  const { data, error } = await supabase
    .from('team_messages')
    .insert({
      team_id: teamId,
      thread_id: threadId,
      sender_id: senderId,
      body: trimmedBody,
    })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const [message] = await enrichMessagesWithSenderProfiles([data as TeamMessageRow]);
  return message;
}

export type TeamMessagesSubscriptionOptions = {
  channelName?: string;
};

export function subscribeTeamMessagesByThread(
  teamId: string,
  threadId: string,
  onChange: () => void,
  options?: TeamMessagesSubscriptionOptions,
): () => void {
  const channelName = options?.channelName ?? `team-messages:${teamId}:${threadId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'team_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return createSafeRealtimeUnsubscribe(channel);
}
