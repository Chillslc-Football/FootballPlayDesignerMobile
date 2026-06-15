import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { deletePushDeviceToken } from '../lib/pushTokenRepository';
import { createPushTraceId, pushDebugError, pushDebugLog } from './pushDebugLog';
import {
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  getRegisteredPushToken,
  setRegisteredPushToken,
} from './registeredPushToken';

let permissionRequestAttempted = false;

type ProjectIdLookup = {
  projectId: string | undefined;
  sources: Record<string, unknown>;
};

function getEasProjectIdLookup(): ProjectIdLookup {
  const expoConfigExtra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  const manifestExtra = Constants.manifest?.extra as { eas?: { projectId?: string } } | undefined;
  const manifest2Extra = Constants.manifest2?.extra as
    | { expoClient?: { extra?: { eas?: { projectId?: string } } } }
    | undefined;

  const sources = {
    expoConfigExtraEasProjectId: expoConfigExtra?.eas?.projectId ?? null,
    easConfigProjectId: Constants.easConfig?.projectId ?? null,
    manifestExtraEasProjectId: manifestExtra?.eas?.projectId ?? null,
    manifest2ExpoClientExtraEasProjectId:
      manifest2Extra?.expoClient?.extra?.eas?.projectId ?? null,
    hasExpoConfig: Boolean(Constants.expoConfig),
    hasEasConfig: Boolean(Constants.easConfig),
    hasManifest: Boolean(Constants.manifest),
    hasManifest2: Boolean(Constants.manifest2),
  };

  const projectId =
    expoConfigExtra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    manifestExtra?.eas?.projectId ??
    manifest2Extra?.expoClient?.extra?.eas?.projectId ??
    undefined;

  return { projectId, sources };
}

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    pushDebugLog('Android notification channel ensured', {
      channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
    });
  } catch (error) {
    pushDebugError('Failed to create Android notification channel', error);
    throw error;
  }
}

async function fetchExpoPushToken(traceId: string): Promise<string | null> {
  const lookup = getEasProjectIdLookup();

  pushDebugLog('STEP 6 EAS projectId lookup', {
    traceId,
    projectId: lookup.projectId ?? null,
    ...lookup.sources,
  });

  if (!lookup.projectId) {
    pushDebugLog('STEP 7 getExpoPushTokenAsync skipped: missing EAS projectId', { traceId });
    return null;
  }

  pushDebugLog('STEP 7 getExpoPushTokenAsync starting', {
    traceId,
    projectId: lookup.projectId,
  });

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: lookup.projectId,
    });

    pushDebugLog('STEP 8 Expo push token returned', {
      traceId,
      token: pushToken.data,
      tokenLength: pushToken.data.length,
    });

    return pushToken.data;
  } catch (error) {
    pushDebugError('STEP 7-8 getExpoPushTokenAsync failed', error, {
      traceId,
      projectId: lookup.projectId,
    });
    throw error;
  }
}

async function ensureNotificationPermission(traceId: string): Promise<boolean> {
  let before;

  try {
    before = await Notifications.getPermissionsAsync();
  } catch (error) {
    pushDebugError('STEP 4 getPermissionsAsync failed', error, { traceId });
    throw error;
  }

  pushDebugLog('STEP 4 notification permission before request', {
    traceId,
    status: before.status,
    canAskAgain: before.canAskAgain,
    granted: before.granted,
    expires: before.expires,
    android: before.android ?? null,
    ios: before.ios ?? null,
    permissionRequestAttempted,
    androidApiLevel: Platform.OS === 'android' ? Platform.Version : null,
  });

  if (before.status === 'granted') {
    pushDebugLog('STEP 5 permission request skipped: already granted', { traceId });
    return true;
  }

  if (before.status === 'denied') {
    pushDebugLog('STEP 5 permission request skipped: already denied', {
      traceId,
      canAskAgain: before.canAskAgain,
    });
    return false;
  }

  if (permissionRequestAttempted) {
    pushDebugLog('STEP 5 permission request skipped: already attempted this session', { traceId });
    return false;
  }

  permissionRequestAttempted = true;

  pushDebugLog('STEP 5 requestPermissionsAsync starting', { traceId });

  try {
    const after = await Notifications.requestPermissionsAsync();
    pushDebugLog('STEP 5 permission request result', {
      traceId,
      status: after.status,
      canAskAgain: after.canAskAgain,
      granted: after.granted,
      expires: after.expires,
      android: after.android ?? null,
      ios: after.ios ?? null,
    });
    return after.status === 'granted';
  } catch (error) {
    pushDebugError('STEP 5 requestPermissionsAsync failed', error, { traceId });
    throw error;
  }
}

export async function acquireExpoPushToken(): Promise<string | null> {
  const traceId = createPushTraceId();

  pushDebugLog('STEP 3 acquireExpoPushToken started', {
    traceId,
    isDevice: Device.isDevice,
    platform: Platform.OS,
    modelName: Device.modelName ?? null,
    brand: Device.brand ?? null,
    osVersion: Device.osVersion ?? null,
  });

  if (!Device.isDevice) {
    pushDebugLog('FLOW STOP: not a physical device', { traceId });
    return null;
  }

  try {
    await ensureAndroidNotificationChannel();
  } catch (error) {
    pushDebugError('FLOW STOP: Android channel setup failed', error, { traceId });
    return null;
  }

  try {
    const hasPermission = await ensureNotificationPermission(traceId);
    if (!hasPermission) {
      pushDebugLog('FLOW STOP: notification permission not granted', { traceId });
      return null;
    }
  } catch (error) {
    pushDebugError('FLOW STOP: notification permission flow failed', error, { traceId });
    return null;
  }

  try {
    const token = await fetchExpoPushToken(traceId);
    if (!token) {
      pushDebugLog('FLOW STOP: no Expo push token returned', { traceId });
    } else {
      pushDebugLog('acquireExpoPushToken completed successfully', { traceId, token });
    }
    return token;
  } catch (error) {
    pushDebugError('FLOW STOP: getExpoPushTokenAsync threw', error, { traceId });
    return null;
  }
}

export async function clearRegisteredPushTokenFromServer(): Promise<void> {
  const token = getRegisteredPushToken();
  if (!token) {
    return;
  }

  setRegisteredPushToken(null);

  try {
    await deletePushDeviceToken(token);
  } catch {
    // Sign-out should continue even if token cleanup fails.
  }
}
