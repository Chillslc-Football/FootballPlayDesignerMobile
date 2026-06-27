import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { pushDebugLog } from './pushDebugLog';
import {
  getNotificationPermissionDisplayStatus,
  resolveAndroidNotificationPackageInfo,
  type AndroidNotificationPackageInfo,
} from './notificationPermissions';

/** TEMP investigation helper — remove after notification status bug is confirmed fixed. */
export type NotificationPermissionProbeSource =
  | 'settings_focus'
  | 'app_resume'
  | 'settings_after_open_system_settings'
  | 'permission_read'
  | 'permission_request';

export type NotificationPermissionProbeResult = {
  source: NotificationPermissionProbeSource;
  at: string;
  appState: string;
  androidApiLevel: number | string;
  permission: Notifications.NotificationPermissionsStatus;
  displayStatus: ReturnType<typeof getNotificationPermissionDisplayStatus>;
  androidPackageInfo: AndroidNotificationPackageInfo | null;
  /** Debug only — channel importance does not reflect app-level POST_NOTIFICATIONS grant. */
  androidChannels: Notifications.NotificationChannel[] | null;
};

async function readAndroidChannelsForProbe(): Promise<Notifications.NotificationChannel[] | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return await Notifications.getNotificationChannelsAsync();
  } catch (error) {
    console.log('[NotificationPermissionProbe] getNotificationChannelsAsync failed', error);
    return null;
  }
}

export async function probeNotificationPermissions(
  source: NotificationPermissionProbeSource,
  permissionOverride?: Notifications.NotificationPermissionsStatus,
): Promise<NotificationPermissionProbeResult> {
  const permission = permissionOverride ?? (await Notifications.getPermissionsAsync());
  const androidChannels = await readAndroidChannelsForProbe();
  const displayStatus = getNotificationPermissionDisplayStatus(permission);
  const androidPackageInfo =
    Platform.OS === 'android' ? resolveAndroidNotificationPackageInfo() : null;

  const result: NotificationPermissionProbeResult = {
    source,
    at: new Date().toISOString(),
    appState: 'unknown',
    androidApiLevel: Platform.OS === 'android' ? Platform.Version : 'n/a',
    permission,
    displayStatus,
    androidPackageInfo,
    androidChannels,
  };

  console.log('[NotificationPermissionProbe]', JSON.stringify(result, null, 2));

  if (androidPackageInfo && !androidPackageInfo.packagesMatch) {
    console.warn(
      '[NotificationPermissionProbe] configPackage !== runtimePackage — you may have enabled notifications for the wrong app in system settings.',
      androidPackageInfo,
    );
  }

  pushDebugLog(`Notification permission probe: ${source}`, result);

  return result;
}

export async function probeNotificationPermissionsWithAppState(
  source: NotificationPermissionProbeSource,
  appState: string,
): Promise<NotificationPermissionProbeResult> {
  const result = await probeNotificationPermissions(source);
  result.appState = appState;
  console.log('[NotificationPermissionProbe] appState', appState);
  return result;
}
