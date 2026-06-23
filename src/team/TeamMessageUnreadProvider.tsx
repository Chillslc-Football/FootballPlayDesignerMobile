import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';

import { getTeamMessageUnreadCount } from '../lib/teamMessageRepository';
import { parseTeamMessageNotificationData } from '../notifications/teamMessageNotificationNavigation';
import { useTeam } from './TeamProvider';

type TeamMessageUnreadContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const TeamMessageUnreadContext = createContext<TeamMessageUnreadContextValue | undefined>(
  undefined,
);

type TeamMessageUnreadProviderProps = {
  children: ReactNode;
};

export function TeamMessageUnreadProvider({ children }: TeamMessageUnreadProviderProps) {
  const { selectedTeam } = useTeam();
  const [unreadCount, setUnreadCount] = useState(0);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const refreshUnreadCount = useCallback(async () => {
    const teamId = selectedTeamIdRef.current;

    if (!teamId) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getTeamMessageUnreadCount(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setUnreadCount(count);
    } catch {
      if (selectedTeamIdRef.current === teamId) {
        setUnreadCount(0);
      }
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [selectedTeam?.id, refreshUnreadCount]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const payload = parseTeamMessageNotificationData(notification.request.content.data);

      if (!payload) {
        return;
      }

      if (payload.teamId === selectedTeamIdRef.current) {
        void refreshUnreadCount();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
    }),
    [unreadCount, refreshUnreadCount],
  );

  return (
    <TeamMessageUnreadContext.Provider value={value}>{children}</TeamMessageUnreadContext.Provider>
  );
}

export function useTeamMessageUnread() {
  const context = useContext(TeamMessageUnreadContext);

  if (!context) {
    throw new Error('useTeamMessageUnread must be used within a TeamMessageUnreadProvider');
  }

  return context;
}

export function formatUnreadTabBadge(count: number): string | undefined {
  if (count <= 0) {
    return undefined;
  }

  if (count > 99) {
    return '99+';
  }

  return String(count);
}
