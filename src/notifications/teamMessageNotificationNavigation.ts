export type TeamMessageNotificationPayload = {
  teamId: string;
  threadId?: string;
  messageId?: string;
  senderId?: string;
};

let pendingNavigation: TeamMessageNotificationPayload | null = null;
let navigationReadyListener: (() => void) | null = null;

export function parseTeamMessageNotificationData(
  data: unknown,
): TeamMessageNotificationPayload | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;

  if (record.notification_type !== 'team_message') {
    return null;
  }

  if (typeof record.team_id !== 'string' || record.team_id.length === 0) {
    return null;
  }

  return {
    teamId: record.team_id,
    threadId: typeof record.thread_id === 'string' ? record.thread_id : undefined,
    messageId: typeof record.message_id === 'string' ? record.message_id : undefined,
    senderId: typeof record.sender_id === 'string' ? record.sender_id : undefined,
  };
}

export function setPendingTeamMessageNavigation(
  payload: TeamMessageNotificationPayload,
): void {
  pendingNavigation = payload;
}

export function peekPendingTeamMessageNavigation(): TeamMessageNotificationPayload | null {
  return pendingNavigation;
}

export function clearPendingTeamMessageNavigation(): void {
  pendingNavigation = null;
}

export function setTeamMessageNavigationReadyListener(listener: (() => void) | null): void {
  navigationReadyListener = listener;
}

export function notifyTeamMessageNavigationReady(): void {
  navigationReadyListener?.();
}
