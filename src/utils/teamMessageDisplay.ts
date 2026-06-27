import { THREAD_KIND_LABELS } from '../constants/teamChatConstants';
import type { TeamMessageThreadKind } from '../types/teamMessage';

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
