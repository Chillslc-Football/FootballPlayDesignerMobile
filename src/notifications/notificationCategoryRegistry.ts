import type {
  NotificationCategoryDefinition,
  NotificationCategoryKey,
} from '../types/notificationPreference';

export const NOTIFICATION_CATEGORY_DEFINITIONS: NotificationCategoryDefinition[] = [
  {
    key: 'direct_messages',
    label: 'Direct Messages',
    availability: 'active',
  },
  {
    key: 'team_channels',
    label: 'Team Channels',
    availability: 'active',
  },
  {
    key: 'team_updates',
    label: 'Team Updates',
    availability: 'active',
  },
  {
    key: 'calendar_events',
    label: 'Calendar Events',
    availability: 'active',
  },
];

export function getEditableNotificationCategoryKeys(): NotificationCategoryKey[] {
  return NOTIFICATION_CATEGORY_DEFINITIONS.filter(
    (definition) => definition.availability === 'active',
  ).map((definition) => definition.key);
}

export function isEditableNotificationCategory(
  category: NotificationCategoryKey,
): boolean {
  return getEditableNotificationCategoryKeys().includes(category);
}
