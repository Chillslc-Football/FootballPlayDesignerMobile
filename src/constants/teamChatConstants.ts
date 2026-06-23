import type { TeamMessageThreadKind } from '../types/teamMessage';

export const THREAD_KIND_LABELS: Record<TeamMessageThreadKind, string> = {
  everyone: 'Everyone',
  coaches: 'Coaches',
  players: 'Players',
  parents: 'Parents',
  direct: 'Direct Message',
};

export function getConversationTitle(input: {
  thread_kind: TeamMessageThreadKind;
  title: string;
}): string {
  if (input.thread_kind === 'direct') {
    return input.title.trim() || THREAD_KIND_LABELS.direct;
  }

  return THREAD_KIND_LABELS[input.thread_kind] ?? input.title.trim();
}
