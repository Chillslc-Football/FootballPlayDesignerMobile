import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

import * as Notifications from 'expo-notifications';

import {
  readNotificationPermissionSnapshot,
  registerPushTokenForUser,
  type NotificationPermissionDisplayStatus,
} from './notificationPermissions';
import { probeNotificationPermissionsWithAppState } from './notificationPermissionProbe';

const RESUME_REFRESH_DELAY_MS = 300;
const RESUME_REFRESH_RETRY_DELAY_MS = 800;

async function refreshWithResumeRetries(
  refresh: (options?: { silent?: boolean; source?: 'app_resume' }) => Promise<void>,
): Promise<void> {
  await refresh({ silent: true, source: 'app_resume' });
  await new Promise((resolve) => setTimeout(resolve, RESUME_REFRESH_RETRY_DELAY_MS));
  await refresh({ silent: true, source: 'app_resume' });
}

function isBackgroundAppState(state: AppStateStatus): boolean {
  return state === 'background' || state === 'inactive';
}

type UseNotificationPermissionStatusOptions = {
  userId?: string | null;
  registerTokenWhenEnabled?: boolean;
};

export function useNotificationPermissionStatus({
  userId,
  registerTokenWhenEnabled = false,
}: UseNotificationPermissionStatusOptions) {
  const [status, setStatus] = useState<NotificationPermissionDisplayStatus>('needs_permission');
  const [permission, setPermission] =
    useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  const appStateRef = useRef(AppState.currentState);

  isFocusedRef.current = isFocused;

  const refresh = useCallback(
    async (options?: { silent?: boolean; source?: 'settings_focus' | 'app_resume' }) => {
      const silent = options?.silent ?? false;
      const source = options?.source ?? 'settings_focus';

      if (!silent) {
        setLoading(true);
      }

      try {
        const snapshot = await readNotificationPermissionSnapshot();
        setStatus(snapshot.displayStatus);
        setPermission(snapshot.permission);

        console.log('[NotificationPermissionProbe] settings refresh', {
          source,
          displayStatus: snapshot.displayStatus,
          permission: snapshot.permission,
          androidPackageInfo: snapshot.androidPackageInfo,
        });

        if (registerTokenWhenEnabled && snapshot.permission.granted && userId) {
          await registerPushTokenForUser(userId);
        }
      } catch {
        setStatus('needs_permission');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [registerTokenWhenEnabled, userId],
  );

  useFocusEffect(
    useCallback(() => {
      void probeNotificationPermissionsWithAppState('settings_focus', AppState.currentState);
      void refresh({ source: 'settings_focus' });
    }, [refresh]),
  );

  useEffect(() => {
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      console.log('[NotificationPermissionProbe] AppState change', {
        from: previousState,
        to: nextState,
        settingsFocused: isFocusedRef.current,
      });

      if (!isBackgroundAppState(previousState) || nextState !== 'active') {
        return;
      }

      if (resumeTimer) {
        clearTimeout(resumeTimer);
      }

      resumeTimer = setTimeout(() => {
        if (isFocusedRef.current) {
          void probeNotificationPermissionsWithAppState('app_resume', nextState);
          void refreshWithResumeRetries(refresh);
        }
      }, RESUME_REFRESH_DELAY_MS);
    });

    return () => {
      subscription.remove();
      if (resumeTimer) {
        clearTimeout(resumeTimer);
      }
    };
  }, [refresh]);

  return {
    status,
    permission,
    loading,
    refresh,
  };
}
