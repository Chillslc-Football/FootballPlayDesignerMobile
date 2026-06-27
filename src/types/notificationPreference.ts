export const NOTIFICATION_CATEGORY_KEYS = [
  'direct_messages',
  'team_channels',
  'team_updates',
  'calendar_events',
  'rsvp_updates',
] as const;

export type NotificationCategoryKey = (typeof NOTIFICATION_CATEGORY_KEYS)[number];

export type NotificationCategoryAvailability = 'active' | 'coming_soon';

export type NotificationCategoryDefinition = {
  key: NotificationCategoryKey;
  label: string;
  availability: NotificationCategoryAvailability;
  description?: string;
};

export type NotificationCategoryPreferences = Record<NotificationCategoryKey, boolean>;

export type UserTeamNotificationPreferenceRow = {
  user_id: string;
  team_id: string;
  category: NotificationCategoryKey | string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES: NotificationCategoryPreferences = {
  direct_messages: true,
  team_channels: true,
  team_updates: true,
  calendar_events: true,
  rsvp_updates: true,
};
