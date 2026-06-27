import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  fetchNotificationPreferencesForTeam,
  upsertNotificationPreferenceForTeam,
} from '../lib/notificationPreferenceRepository';
import { isEditableNotificationCategory } from './notificationCategoryRegistry';
import type {
  NotificationCategoryKey,
  NotificationCategoryPreferences,
} from '../types/notificationPreference';

type UseNotificationCategoryPreferencesOptions = {
  userId?: string | null;
  teamId?: string | null;
};

export function useNotificationCategoryPreferences({
  userId,
  teamId,
}: UseNotificationCategoryPreferencesOptions) {
  const [preferences, setPreferences] = useState<NotificationCategoryPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<NotificationCategoryKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!userId || !teamId) {
        setPreferences(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const loaded = await fetchNotificationPreferencesForTeam(userId, teamId);
        setPreferences(loaded);
        setError(null);
      } catch (loadError) {
        setPreferences(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load notification preferences.',
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [teamId, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const setCategoryEnabled = useCallback(
    async (category: NotificationCategoryKey, enabled: boolean) => {
      if (!userId || !teamId || !isEditableNotificationCategory(category)) {
        return;
      }

      setSavingKey(category);
      setPreferences((current) =>
        current
          ? {
              ...current,
              [category]: enabled,
            }
          : current,
      );

      try {
        const next = await upsertNotificationPreferenceForTeam(userId, teamId, category, enabled);
        setPreferences(next);
        setError(null);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Failed to save notification preference.',
        );
        await refresh({ silent: true });
      } finally {
        setSavingKey(null);
      }
    },
    [refresh, teamId, userId],
  );

  return {
    preferences,
    loading,
    savingKey,
    error,
    setCategoryEnabled,
    refresh,
  };
}
