import { THREAD_KIND_LABELS } from '../constants/teamChatConstants';
import type { TeamMessageThreadKind } from '../types/teamMessage';
import { splitTeamMessageBodyForDisplay } from './teamMessageMentionUtils';

const conversationTimeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
});

const conversationDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export function formatHomeChatChannelLabel(threadKind: TeamMessageThreadKind): string {
  if (threadKind === 'everyone') {
    return 'Team Chat';
  }

  if (threadKind === 'direct') {
    return THREAD_KIND_LABELS.direct;
  }

  return THREAD_KIND_LABELS[threadKind] ?? 'Messages';
}

export function previewTeamMessageBody(body: string, maxLength = 120): string {
  const trimmed = body.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function formatHomeChatPreviewLine(
  senderName: string | null | undefined,
  body: string,
  maxLength = 120,
): string {
  const name = senderName?.trim() || 'Someone';
  return `${name}: ${previewTeamMessageBody(body, maxLength)}`;
}

export function formatConversationListTitle(input: {
  thread_kind: TeamMessageThreadKind;
  title: string;
}): string {
  if (input.thread_kind === 'direct') {
    return input.title.trim() || THREAD_KIND_LABELS.direct;
  }

  if (input.thread_kind === 'custom') {
    return input.title.trim() || THREAD_KIND_LABELS.custom;
  }

  return formatHomeChatChannelLabel(input.thread_kind);
}

export const EMPTY_CONVERSATION_PREVIEW = 'No messages yet';

export function formatStoredMessageBodyForPreview(body: string): string {
  return splitTeamMessageBodyForDisplay(body)
    .map((segment) => segment.value)
    .join('');
}

/** Time for today, "Yesterday", or short date for older messages. */
export function formatConversationTimestamp(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    return conversationTimeFormatter.format(date);
  }

  if (dayDiff === 1) {
    return 'Yesterday';
  }

  return conversationDateFormatter.format(date);
}

export function formatConversationPreviewLine(
  threadKind: TeamMessageThreadKind,
  senderName: string | null | undefined,
  body: string,
  maxLength = 80,
): string {
  const previewBody = formatStoredMessageBodyForPreview(body);

  if (threadKind === 'direct') {
    return previewTeamMessageBody(previewBody, maxLength);
  }

  return formatHomeChatPreviewLine(senderName, previewBody, maxLength);
}

export function isDirectMessageThread(threadKind: TeamMessageThreadKind): boolean {
  return threadKind === 'direct';
}

export function isGroupConversationThread(threadKind: TeamMessageThreadKind): boolean {
  return threadKind !== 'direct';
}

/** Built-in role audience channels hidden from conversation lists. */
export function isRoleChannelThread(threadKind: TeamMessageThreadKind): boolean {
  return threadKind === 'coaches' || threadKind === 'players' || threadKind === 'parents';
}

/** Team Chat, DMs, and future custom groups shown in conversation lists. */
export function isVisibleConversationListThread(threadKind: TeamMessageThreadKind): boolean {
  return !isRoleChannelThread(threadKind);
}

/** Team Chat plus user-created custom groups shown on the Groups tab. */
export function isVisibleGroupsListThread(threadKind: TeamMessageThreadKind): boolean {
  if (threadKind === 'direct' || isRoleChannelThread(threadKind)) {
    return false;
  }

  return true;
}

export function isTeamChatThread(threadKind: TeamMessageThreadKind): boolean {
  return threadKind === 'everyone';
}

export function isCustomGroupThread(threadKind: TeamMessageThreadKind): boolean {
  return threadKind === 'custom';
}

/** Non-DM threads shown as compose targets (includes hidden role channels). */
export function isComposePickerGroupThread(threadKind: TeamMessageThreadKind): boolean {
  return threadKind !== 'direct';
}

export function sortComposePickerGroupTargets<
  T extends { threadKind: TeamMessageThreadKind; title: string },
>(items: T[]): T[] {
  const kindOrder: Partial<Record<TeamMessageThreadKind, number>> = {
    everyone: 0,
    coaches: 1,
    players: 2,
    parents: 3,
    custom: 4,
  };

  return [...items].sort((left, right) => {
    const leftOrder = kindOrder[left.threadKind] ?? 99;
    const rightOrder = kindOrder[right.threadKind] ?? 99;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
  });
}

export function groupTargetMatchesQuery(
  input: { title: string; threadKind: TeamMessageThreadKind },
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const title = input.title.trim().toLowerCase();
  const kindLabel = formatHomeChatChannelLabel(input.threadKind).toLowerCase();

  return title.includes(normalizedQuery) || kindLabel.includes(normalizedQuery);
}

export function buildAutoGroupNameFromLabels(labels: string[]): string {
  const names = labels.map((label) => label.trim()).filter(Boolean);
  const joined = names.join(', ');

  if (joined.length === 0) {
    return 'Group';
  }

  if (joined.length <= 80) {
    return joined;
  }

  return `${joined.slice(0, 77).trimEnd()}…`;
}

export function validateComposeSelection(
  selected: ReadonlyArray<{ kind: 'group' | 'person' }>,
): string | null {
  if (selected.length === 0) {
    return null;
  }

  const groupCount = selected.filter((target) => target.kind === 'group').length;
  const personCount = selected.filter((target) => target.kind === 'person').length;

  if (groupCount > 1) {
    return 'Select one group, or choose people to message together.';
  }

  if (groupCount === 1 && personCount > 0) {
    return 'Select either one group or one or more people, not both.';
  }

  return null;
}

export function sortGroupConversationsWithTeamChatFirst<
  T extends { id: string; threadKind: TeamMessageThreadKind; lastMessageAt: string | null; title: string },
>(items: T[]): T[] {
  const sorted = [...items].sort((left, right) => {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
  });

  const teamChatIndex = sorted.findIndex((item) => isTeamChatThread(item.threadKind));

  if (teamChatIndex <= 0) {
    return sorted;
  }

  const teamChat = sorted[teamChatIndex];

  return [teamChat, ...sorted.filter((item) => item.id !== teamChat.id)];
}
