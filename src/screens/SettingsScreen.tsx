import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { NotificationCategoryPreferenceList } from '../components/NotificationCategoryPreferenceList';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme } from '../design-system';
import { radius, spacing, typography } from '../design-system';
import { MoreStackParamList } from '../navigation/MoreStack';
import { useNotificationCategoryPreferences } from '../notifications/useNotificationCategoryPreferences';
import {
  getNotificationPermissionStatusLabel,
  getNotificationSettingsActionLabel,
  openAppNotificationSettings,
  requestNotificationPermissionFromUser,
  registerPushTokenForUser,
  shouldRequestNotificationPermissionInApp,
} from '../notifications/notificationPermissions';
import { useNotificationPermissionStatus } from '../notifications/useNotificationPermissionStatus';
import { useAuth } from '../auth/AuthProvider';
import { useTeam } from '../team/TeamProvider';

type Props = NativeStackScreenProps<MoreStackParamList, 'Settings'>;

export function SettingsScreen(_props: Props) {
  const { user } = useAuth();
  const { selectedTeam } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [working, setWorking] = useState(false);
  const { status, permission, loading, refresh } = useNotificationPermissionStatus({
    userId: user?.id,
    registerTokenWhenEnabled: true,
  });
  const {
    preferences,
    loading: categoryPreferencesLoading,
    savingKey,
    error: categoryPreferencesError,
    setCategoryEnabled,
  } = useNotificationCategoryPreferences({
    userId: user?.id,
    teamId: selectedTeam?.id,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sections: {
          gap: spacing.lg,
        },
        sectionCard: {
          ...cardPresets.default.container,
          gap: spacing.md,
        },
        sectionTitle: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.text.primary,
        },
        statusRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        statusLabel: {
          ...typography.bodySmall,
          color: palette.text.secondary,
        },
        statusValue: {
          ...typography.bodySmall,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
        },
        actionButton: {
          backgroundColor: palette.background.secondary,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border.default,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
        actionButtonPressed: {
          opacity: 0.88,
        },
        actionButtonText: {
          ...typography.bodySmall,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
        },
      }),
    [cardPresets, palette],
  );

  const osNotificationsEnabled = permission?.granted === true;

  const handleNotificationAction = () => {
    if (!user || working) {
      return;
    }

    void (async () => {
      setWorking(true);

      try {
        if (status === 'on') {
          await openAppNotificationSettings();
          return;
        }

        if (permission && shouldRequestNotificationPermissionInApp(permission)) {
          const result = await requestNotificationPermissionFromUser();

          if (result === 'granted') {
            await registerPushTokenForUser(user.id);
            await refresh({ silent: true });
            return;
          }

          await openAppNotificationSettings();
          return;
        }

        await openAppNotificationSettings();
      } finally {
        setWorking(false);
      }
    })();
  };

  const actionLabel = getNotificationSettingsActionLabel(status, permission);

  return (
    <ScreenContainer title="Notifications" subtitle="Manage alerts and preferences">
      <View style={styles.sections}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Device Notifications</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            {loading ? (
              <ActivityIndicator color={palette.text.muted} size="small" />
            ) : (
              <Text style={styles.statusValue}>{getNotificationPermissionStatusLabel(status)}</Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              (pressed || working || loading) && styles.actionButtonPressed,
            ]}
            onPress={handleNotificationAction}
            disabled={working || loading}
          >
            {working ? (
              <ActivityIndicator color={palette.text.primary} size="small" />
            ) : (
              <Text style={styles.actionButtonText}>{actionLabel}</Text>
            )}
          </Pressable>
        </View>

        <NotificationCategoryPreferenceList
          teamName={selectedTeam?.name ?? null}
          preferences={preferences}
          loading={categoryPreferencesLoading}
          savingKey={savingKey}
          error={categoryPreferencesError}
          osNotificationsEnabled={osNotificationsEnabled}
          onToggleCategory={(category, enabled) => {
            void setCategoryEnabled(category, enabled);
          }}
        />
      </View>
    </ScreenContainer>
  );
}
