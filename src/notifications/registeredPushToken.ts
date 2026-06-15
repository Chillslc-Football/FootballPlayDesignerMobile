export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

let registeredPushToken: string | null = null;

export function getRegisteredPushToken(): string | null {
  return registeredPushToken;
}

export function setRegisteredPushToken(token: string | null): void {
  registeredPushToken = token;
}
