import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { upsertPushDeviceToken } from '../lib/pushTokenRepository';
import type { PushPlatform } from '../types/pushToken';
import { createPushTraceId, pushDebugError, pushDebugLog } from './pushDebugLog';
import {
  acquireExpoPushToken,
  ensureAndroidNotificationChannel,
} from './pushNotificationSetup';
import { probeNotificationPermissions } from './notificationPermissionProbe';
import { getRegisteredPushToken, setRegisteredPushToken } from './registeredPushToken';

export type NotificationPermissionDisplayStatus = 'on' | 'off' | 'needs_permission';

export type NotificationPermissionRequestResult = 'granted' | 'denied' | 'blocked';

export type AndroidNotificationPackageInfo = {
  configPackage: string | null;
  runtimePackage: string | null;
  settingsPackage: string | null;
  packagesMatch: boolean;
  executionEnvironment: string;
};

export type NotificationPermissionSnapshot = {
  permission: Notifications.NotificationPermissionsStatus;
  displayStatus: NotificationPermissionDisplayStatus;
  androidPackageInfo: AndroidNotificationPackageInfo | null;
};

function resolvePlatform(): PushPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export function resolveAndroidNotificationPackageInfo(): AndroidNotificationPackageInfo {
  const configPackage = Constants.expoConfig?.android?.package ?? null;
  const runtimePackage = Platform.OS === 'android' ? Application.applicationId : null;
  const settingsPackage = runtimePackage ?? configPackage;
  const packagesMatch =
    configPackage != null && runtimePackage != null && configPackage === runtimePackage;
  const executionEnvironment = String(Constants.executionEnvironment ?? 'unknown');

  return {
    configPackage,
    runtimePackage,
    settingsPackage,
    packagesMatch,
    executionEnvironment,
  };
}

export function getNotificationPermissionDisplayStatus(
  permission: Notifications.NotificationPermissionsStatus,
): NotificationPermissionDisplayStatus {
  if (permission.granted) {
    return 'on';
  }

  if (permission.status === 'undetermined') {
    return 'needs_permission';
  }

  if (permission.status === 'denied' && permission.canAskAgain) {
    return 'needs_permission';
  }

  if (permission.status === 'denied' && !permission.canAskAgain) {
    return 'needs_permission';
  }

  return 'off';
}

export function shouldRequestNotificationPermissionInApp(
  permission: Notifications.NotificationPermissionsStatus,
): boolean {
  if (permission.granted) {
    return false;
  }

  return (
    permission.status === 'undetermined' ||
    (permission.status === 'denied' && permission.canAskAgain)
  );
}

export function getNotificationPermissionStatusLabel(
  status: NotificationPermissionDisplayStatus,
): string {
  switch (status) {
    case 'on':
      return 'On';
    case 'off':
      return 'Off';
    case 'needs_permission':
      return 'Needs permission';
  }
}

export function getNotificationSettingsActionLabel(
  status: NotificationPermissionDisplayStatus,
  permission?: Notifications.NotificationPermissionsStatus | null,
): string {
  if (status === 'on') {
    return 'Manage Notifications';
  }

  if (Platform.OS === 'android') {
    if (permission && !shouldRequestNotificationPermissionInApp(permission)) {
      return 'Open Android Settings';
    }

    return permission && shouldRequestNotificationPermissionInApp(permission)
      ? 'Turn On Notifications'
      : 'Open Android Settings';
  }

  return 'Turn On Notifications';
}

export async function readNotificationPermissionSnapshot(): Promise<NotificationPermissionSnapshot> {
  if (Platform.OS === 'android') {
    await ensureAndroidNotificationChannel();
  }

  const permission = await Notifications.getPermissionsAsync();
  const displayStatus = getNotificationPermissionDisplayStatus(permission);
  const androidPackageInfo = Platform.OS === 'android' ? resolveAndroidNotificationPackageInfo() : null;

  await probeNotificationPermissions('permission_read', permission);

  pushDebugLog('Notification permission snapshot', {
    platform: Platform.OS,
    displayStatus,
    granted: permission.granted,
    permissionStatus: permission.status,
    canAskAgain: permission.canAskAgain,
    androidImportance: permission.android?.importance ?? null,
    androidInterruptionFilter: permission.android?.interruptionFilter ?? null,
    androidPackageInfo,
    ios: permission.ios ?? null,
    rawPermission: permission,
  });

  if (androidPackageInfo && !androidPackageInfo.packagesMatch) {
    console.warn(
      '[NotificationPermission] Config package differs from runtime package — Android settings may target the wrong app.',
      androidPackageInfo,
    );
  }

  return {
    permission,
    displayStatus,
    androidPackageInfo,
  };
}

export async function readNotificationPermissionStatus(): Promise<NotificationPermissionDisplayStatus> {
  const snapshot = await readNotificationPermissionSnapshot();
  return snapshot.displayStatus;
}

export async function requestNotificationPermissionFromUser(): Promise<NotificationPermissionRequestResult> {
  await ensureAndroidNotificationChannel();

  const before = await Notifications.getPermissionsAsync();

  if (before.granted) {
    return 'granted';
  }

  if (before.status === 'denied' && !before.canAskAgain) {
    return 'blocked';
  }

  const after = await Notifications.requestPermissionsAsync();

  await probeNotificationPermissions('permission_request', after);

  pushDebugLog('User-initiated notification permission request', {
    status: after.status,
    granted: after.granted,
    canAskAgain: after.canAskAgain,
    androidImportance: after.android?.importance ?? null,
    displayStatus: getNotificationPermissionDisplayStatus(after),
    rawPermission: after,
  });

  if (after.granted) {
    return 'granted';
  }

  if (after.status === 'denied' && !after.canAskAgain) {
    return 'blocked';
  }

  return 'denied';
}

export async function openAppNotificationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    const packageInfo = resolveAndroidNotificationPackageInfo();
    const pkg = packageInfo.settingsPackage;

    pushDebugLog('Opening Android notification settings', packageInfo);

    if (!packageInfo.packagesMatch) {
      pushDebugLog(
        'Android notification settings package mismatch — system settings may not match expo config',
        packageInfo,
      );
    }

    if (pkg && typeof Platform.Version === 'number' && Platform.Version >= 26) {
      try {
        await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
          { key: 'android.provider.extra.APP_PACKAGE', value: pkg },
        ]);
        pushDebugLog('Opened Android app notification settings', {
          package: pkg,
          ...packageInfo,
        });
        return;
      } catch (error) {
        pushDebugError('Failed to open Android notification settings intent', error, {
          package: pkg,
          ...packageInfo,
        });
      }
    }
  }

  await Linking.openSettings();
  pushDebugLog('Opened app settings fallback');
}

export async function registerPushTokenForUser(userId: string): Promise<boolean> {
  const traceId = createPushTraceId();

  if (!Device.isDevice) {
    pushDebugLog('registerPushTokenForUser skipped: not a physical device', { traceId, userId });
    return false;
  }

  let token: string | null = null;

  try {
    token = await acquireExpoPushToken();
  } catch (error) {
    pushDebugError('registerPushTokenForUser acquireExpoPushToken failed', error, {
      traceId,
      userId,
    });
    return false;
  }

  if (!token) {
    pushDebugLog('registerPushTokenForUser finished without token', { traceId, userId });
    return false;
  }

  if (getRegisteredPushToken() === token) {
    pushDebugLog('registerPushTokenForUser skipped: token already registered', {
      traceId,
      userId,
      token,
    });
    return true;
  }

  try {
    await upsertPushDeviceToken(
      userId,
      token,
      resolvePlatform(),
      Device.modelName ?? null,
      traceId,
    );
    setRegisteredPushToken(token);
    pushDebugLog('registerPushTokenForUser completed', { traceId, userId, token });
    return true;
  } catch (error) {
    pushDebugError('registerPushTokenForUser persist failed', error, { traceId, userId, token });
    return false;
  }
}
