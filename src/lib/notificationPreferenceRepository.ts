import { supabase } from './supabase';
import {
  DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES,
  type NotificationCategoryKey,
  type NotificationCategoryPreferences,
  type UserTeamNotificationPreferenceRow,
} from '../types/notificationPreference';
import { getEditableNotificationCategoryKeys } from '../notifications/notificationCategoryRegistry';
import {
  clearNotificationCategoryPreferences,
  loadNotificationCategoryPreferences,
} from '../utils/notificationCategoryPreference';

const COLUMNS = 'user_id, team_id, category, enabled, created_at, updated_at';

function rowsToPreferences(
  rows: UserTeamNotificationPreferenceRow[],
): NotificationCategoryPreferences {
  const preferences = { ...DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES };

  for (const row of rows) {
    if (isNotificationCategoryKey(row.category)) {
      preferences[row.category] = row.enabled;
    }
  }

  return preferences;
}

function isNotificationCategoryKey(value: string): value is NotificationCategoryKey {
  return value in DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES;
}

async function upsertPreferenceRows(
  userId: string,
  teamId: string,
  values: Partial<Record<NotificationCategoryKey, boolean>>,
): Promise<void> {
  const editableKeys = getEditableNotificationCategoryKeys();
  const rows = editableKeys
    .filter((category) => typeof values[category] === 'boolean')
    .map((category) => ({
      user_id: userId,
      team_id: teamId,
      category,
      enabled: values[category] as boolean,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('user_team_notification_preferences')
    .upsert(rows, { onConflict: 'user_id,team_id,category' });

  if (error) {
    throw new Error(error.message);
  }
}

async function seedDefaultPreferences(userId: string, teamId: string): Promise<void> {
  const editableKeys = getEditableNotificationCategoryKeys();
  const defaults = Object.fromEntries(
    editableKeys.map((category) => [category, DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES[category]]),
  ) as Partial<Record<NotificationCategoryKey, boolean>>;

  await upsertPreferenceRows(userId, teamId, defaults);
}

async function migrateLegacyLocalPreferencesIfNeeded(
  userId: string,
  teamId: string,
): Promise<void> {
  const legacy = await loadNotificationCategoryPreferences();
  const editableKeys = getEditableNotificationCategoryKeys();
  const hasLegacyOverride = editableKeys.some(
    (category) => legacy[category] !== DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES[category],
  );

  if (!hasLegacyOverride) {
    return;
  }

  const legacyValues = Object.fromEntries(
    editableKeys.map((category) => [category, legacy[category]]),
  ) as Partial<Record<NotificationCategoryKey, boolean>>;

  await upsertPreferenceRows(userId, teamId, legacyValues);
  await clearNotificationCategoryPreferences();
}

export async function fetchNotificationPreferencesForTeam(
  userId: string,
  teamId: string,
): Promise<NotificationCategoryPreferences> {
  const { data, error } = await supabase
    .from('user_team_notification_preferences')
    .select(COLUMNS)
    .eq('user_id', userId)
    .eq('team_id', teamId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as UserTeamNotificationPreferenceRow[];
  const editableKeys = getEditableNotificationCategoryKeys();
  const storedEditableCount = rows.filter((row) =>
    editableKeys.includes(row.category as NotificationCategoryKey),
  ).length;

  if (storedEditableCount === 0) {
    await migrateLegacyLocalPreferencesIfNeeded(userId, teamId);

    const { data: afterMigrate, error: afterMigrateError } = await supabase
      .from('user_team_notification_preferences')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('team_id', teamId);

    if (afterMigrateError) {
      throw new Error(afterMigrateError.message);
    }

    const afterMigrateRows = (afterMigrate ?? []) as UserTeamNotificationPreferenceRow[];
    const afterMigrateEditableCount = afterMigrateRows.filter((row) =>
      editableKeys.includes(row.category as NotificationCategoryKey),
    ).length;

    if (afterMigrateEditableCount === 0) {
      await seedDefaultPreferences(userId, teamId);
    }

    const { data: seeded, error: reloadError } = await supabase
      .from('user_team_notification_preferences')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('team_id', teamId);

    if (reloadError) {
      throw new Error(reloadError.message);
    }

    return rowsToPreferences((seeded ?? []) as UserTeamNotificationPreferenceRow[]);
  }

  const preferences = rowsToPreferences(rows);
  const missingKeys = editableKeys.filter(
    (category) => !rows.some((row) => row.category === category),
  );

  if (missingKeys.length > 0) {
    const missingValues = Object.fromEntries(
      missingKeys.map((category) => [
        category,
        DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES[category],
      ]),
    ) as Partial<Record<NotificationCategoryKey, boolean>>;

    await upsertPreferenceRows(userId, teamId, missingValues);

    for (const category of missingKeys) {
      preferences[category] = DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES[category];
    }
  }

  return preferences;
}

export async function upsertNotificationPreferenceForTeam(
  userId: string,
  teamId: string,
  category: NotificationCategoryKey,
  enabled: boolean,
): Promise<NotificationCategoryPreferences> {
  const { error } = await supabase.from('user_team_notification_preferences').upsert(
    {
      user_id: userId,
      team_id: teamId,
      category,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,team_id,category' },
  );

  if (error) {
    throw new Error(error.message);
  }

  return fetchNotificationPreferencesForTeam(userId, teamId);
}
