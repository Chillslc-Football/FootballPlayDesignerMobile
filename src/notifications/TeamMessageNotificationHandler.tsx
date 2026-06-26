import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

import { navigateToTab, navigationRef } from '../navigation/navigationRef';
import { useTeam } from '../team/TeamProvider';
import {
  clearPendingTeamMessageNavigation,
  parseTeamMessageNotificationData,
  peekPendingTeamMessageNavigation,
  setPendingTeamMessageNavigation,
  setTeamMessageNavigationReadyListener,
  type TeamMessageNotificationPayload,
} from './teamMessageNotificationNavigation';

function logTeamMessagePush(message: string, details?: Record<string, unknown>): void {
  if (details) {
    console.log(`[team-message-push] ${message}`, details);
    return;
  }

  console.log(`[team-message-push] ${message}`);
}

export function TeamMessageNotificationHandler() {
  const { memberships, selectedTeam, selectTeam, loading: teamLoading } = useTeam();
  const handledColdStartRef = useRef(false);
  const processingRef = useRef(false);

  const navigateToMessages = useCallback((): boolean => {
    const pending = peekPendingTeamMessageNavigation();
    const navigated = navigateToTab('Chat');

    if (navigated) {
      logTeamMessagePush('navigated to Chat tab');

      if (!pending?.threadId) {
        clearPendingTeamMessageNavigation();
      } else {
        logTeamMessagePush('pending thread navigation retained for ConversationListScreen', {
          threadId: pending.threadId,
        });
      }
    }

    return navigated;
  }, []);

  const navigateToHomeFallback = useCallback((): void => {
    if (navigationRef.isReady()) {
      navigateToTab('Home');
      logTeamMessagePush('fell back to Home tab');
    } else {
      logTeamMessagePush('Home fallback skipped: navigation not ready');
    }

    clearPendingTeamMessageNavigation();
  }, []);

  const tryCompletePendingNavigation = useCallback((): void => {
    const pending = peekPendingTeamMessageNavigation();

    if (!pending || teamLoading) {
      return;
    }

    if (!selectedTeam || selectedTeam.id !== pending.teamId) {
      return;
    }

    if (!navigateToMessages()) {
      logTeamMessagePush('pending Chat navigation waiting for nav ready', pending);
    }
  }, [navigateToMessages, selectedTeam, teamLoading]);

  const processTeamMessageTap = useCallback(
    async (payload: TeamMessageNotificationPayload, source: 'tap' | 'cold-start') => {
      if (processingRef.current) {
        logTeamMessagePush('ignored duplicate tap while processing', { source, ...payload });
        return;
      }

      processingRef.current = true;

      try {
        logTeamMessagePush(`handling notification ${source}`, payload);

        if (teamLoading) {
          setPendingTeamMessageNavigation(payload);
          logTeamMessagePush('teams still loading; stored pending navigation', payload);
          return;
        }

        const isMember = memberships.some((membership) => membership.team.id === payload.teamId);

        if (!isMember) {
          logTeamMessagePush('user is not a member of team; using Home fallback', {
            teamId: payload.teamId,
          });
          navigateToHomeFallback();
          return;
        }

        setPendingTeamMessageNavigation(payload);

        if (selectedTeam?.id !== payload.teamId) {
          logTeamMessagePush('switching active team for notification', {
            fromTeamId: selectedTeam?.id ?? null,
            toTeamId: payload.teamId,
          });
          await selectTeam(payload.teamId);
        }

        requestAnimationFrame(() => {
          tryCompletePendingNavigation();
        });
      } catch (error) {
        logTeamMessagePush('notification handling failed; using Home fallback', {
          teamId: payload.teamId,
          error: error instanceof Error ? error.message : String(error),
        });
        navigateToHomeFallback();
      } finally {
        processingRef.current = false;
      }
    },
    [
      memberships,
      navigateToHomeFallback,
      selectTeam,
      selectedTeam?.id,
      teamLoading,
      tryCompletePendingNavigation,
    ],
  );

  useEffect(() => {
    setTeamMessageNavigationReadyListener(() => {
      tryCompletePendingNavigation();
    });

    return () => {
      setTeamMessageNavigationReadyListener(null);
    };
  }, [tryCompletePendingNavigation]);

  useEffect(() => {
    tryCompletePendingNavigation();
  }, [selectedTeam?.id, teamLoading, tryCompletePendingNavigation]);

  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      const payload = parseTeamMessageNotificationData(
        response.notification.request.content.data,
      );

      if (!payload) {
        return;
      }

      void processTeamMessageTap(payload, 'tap');
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    if (!handledColdStartRef.current) {
      handledColdStartRef.current = true;

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) {
          return;
        }

        const payload = parseTeamMessageNotificationData(
          response.notification.request.content.data,
        );

        if (!payload) {
          return;
        }

        void processTeamMessageTap(payload, 'cold-start');
      });
    }

    return () => {
      subscription.remove();
    };
  }, [processTeamMessageTap]);

  return null;
}
