import { ReactNode, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

import { useAuth } from '../auth/AuthProvider';
import { upsertPushDeviceToken } from '../lib/pushTokenRepository';
import type { PushPlatform } from '../types/pushToken';
import { createPushTraceId, pushDebugError, pushDebugLog } from './pushDebugLog';
import { acquireExpoPushToken } from './pushNotificationSetup';
import { getRegisteredPushToken, setRegisteredPushToken } from './registeredPushToken';

type PushNotificationProviderProps = {
  children: ReactNode;
};

function resolvePlatform(): PushPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

async function persistPushToken(
  userId: string,
  expoPushToken: string,
  traceId: string,
): Promise<void> {
  pushDebugLog('STEP 9 upsertPushDeviceToken call starting', {
    traceId,
    userId,
    platform: resolvePlatform(),
    deviceLabel: Device.modelName ?? null,
    token: expoPushToken,
  });

  try {
    await upsertPushDeviceToken(
      userId,
      expoPushToken,
      resolvePlatform(),
      Device.modelName ?? null,
      traceId,
    );
    setRegisteredPushToken(expoPushToken);
    pushDebugLog('STEP 10 upsertPushDeviceToken completed in provider', {
      traceId,
      userId,
      token: expoPushToken,
    });
  } catch (error) {
    pushDebugError('STEP 10 upsertPushDeviceToken failed in provider', error, {
      traceId,
      userId,
    });
    throw error;
  }
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { user, session, loading } = useAuth();
  const activeUserIdRef = useRef<string | null>(null);
  const mountCountRef = useRef(0);

  mountCountRef.current += 1;

  pushDebugLog('PushNotificationProvider render', {
    mountCount: mountCountRef.current,
    authLoading: loading,
    hasSession: Boolean(session),
    hasUser: Boolean(user),
    userId: user?.id ?? null,
  });

  useEffect(() => {
    pushDebugLog('STEP 1 PushNotificationProvider mounted');
  }, []);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (loading) {
      pushDebugLog('STEP 2 auth still loading; registration waiting', {
        hasSession: Boolean(session),
        hasUser: Boolean(user),
      });
      return;
    }

    if (!session) {
      pushDebugLog('FLOW STOP: no authenticated session in provider', {
        hasUser: Boolean(user),
      });
      return;
    }

    if (!user) {
      pushDebugLog('FLOW STOP: session exists but user is null', {
        sessionUserId: session.user?.id ?? null,
      });
      return;
    }

    pushDebugLog('STEP 2 authenticated user detected', {
      userId: user.id,
      email: user.email ?? null,
    });

    const traceId = createPushTraceId();
    let cancelled = false;

    const registerToken = async () => {
      pushDebugLog('registerToken started', { traceId, userId: user.id });

      let token: string | null = null;

      try {
        token = await acquireExpoPushToken();
      } catch (error) {
        pushDebugError('registerToken acquireExpoPushToken threw unexpectedly', error, {
          traceId,
          userId: user.id,
        });
        return;
      }

      if (cancelled) {
        pushDebugLog('FLOW STOP: registerToken cancelled before persist', {
          traceId,
          userId: user.id,
          hadToken: Boolean(token),
        });
        return;
      }

      if (activeUserIdRef.current !== user.id) {
        pushDebugLog('FLOW STOP: user changed during registration', {
          traceId,
          expectedUserId: user.id,
          activeUserId: activeUserIdRef.current,
          hadToken: Boolean(token),
        });
        return;
      }

      if (!token) {
        pushDebugLog('FLOW STOP: registerToken finished without token', {
          traceId,
          userId: user.id,
        });
        return;
      }

      if (getRegisteredPushToken() === token) {
        pushDebugLog('registerToken skipped: token already registered in memory', {
          traceId,
          userId: user.id,
          token,
        });
        return;
      }

      try {
        await persistPushToken(user.id, token, traceId);
      } catch (error) {
        pushDebugError('FLOW STOP: registerToken persist failed', error, {
          traceId,
          userId: user.id,
          token,
        });
      }
    };

    void registerToken();

    const pushTokenSubscription = Notifications.addPushTokenListener(({ data }) => {
      const listenerTraceId = createPushTraceId();
      pushDebugLog('Push token listener fired', {
        traceId: listenerTraceId,
        userId: user.id,
        token: data,
      });

      if (activeUserIdRef.current !== user.id) {
        pushDebugLog('Push token listener ignored: user changed', {
          traceId: listenerTraceId,
          expectedUserId: user.id,
          activeUserId: activeUserIdRef.current,
        });
        return;
      }

      void persistPushToken(user.id, data, listenerTraceId).catch((error) => {
        pushDebugError('Push token listener persist failed', error, {
          traceId: listenerTraceId,
          userId: user.id,
          token: data,
        });
      });
    });

    return () => {
      cancelled = true;
      pushTokenSubscription.remove();
      pushDebugLog('PushNotificationProvider registration effect cleaned up', {
        traceId,
        userId: user.id,
      });
    };
  }, [loading, session, user?.id]);

  return children;
}
