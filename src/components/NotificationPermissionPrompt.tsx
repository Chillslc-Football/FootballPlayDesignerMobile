import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { cardPresets, palette, radius, spacing, typography } from '../design-system';
import {
  readNotificationPermissionStatus,
  registerPushTokenForUser,
  requestNotificationPermissionFromUser,
  openAppNotificationSettings,
} from '../notifications/notificationPermissions';
import {
  dismissNotificationPrompt,
  isNotificationPromptDismissed,
} from '../utils/notificationPromptPreference';

export function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [working, setWorking] = useState(false);

  const evaluatePrompt = useCallback(async () => {
    if (!user) {
      setVisible(false);
      setChecking(false);
      return;
    }

    setChecking(true);

    try {
      const [dismissed, permissionStatus] = await Promise.all([
        isNotificationPromptDismissed(),
        readNotificationPermissionStatus(),
      ]);

      setVisible(!dismissed && permissionStatus !== 'on');
    } catch {
      setVisible(false);
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    void evaluatePrompt();
  }, [evaluatePrompt]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void evaluatePrompt();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [evaluatePrompt]);

  const handleDismiss = () => {
    void dismissNotificationPrompt();
    setVisible(false);
  };

  const handleTurnOn = () => {
    if (!user || working) {
      return;
    }

    void (async () => {
      setWorking(true);

      try {
        const result = await requestNotificationPermissionFromUser();

        if (result === 'granted') {
          await registerPushTokenForUser(user.id);
          setVisible(false);
          return;
        }

        if (result === 'blocked') {
          await openAppNotificationSettings();
          return;
        }

        await openAppNotificationSettings();
      } finally {
        setWorking(false);
      }
    })();
  };

  if (checking || !visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Turn on notifications</Text>
          <Pressable
            style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification prompt"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.body}>
          Get alerts for chats, team updates, and schedule changes.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || working) && styles.buttonPressed,
          ]}
          onPress={handleTurnOn}
          disabled={working}
        >
          {working ? (
            <ActivityIndicator color={palette.background.primary} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Turn On Notifications</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    zIndex: 20,
  },
  card: {
    ...cardPresets.default.container,
    gap: spacing.md,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
    flex: 1,
  },
  body: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: palette.navigation.tabActive,
    borderRadius: radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: {
    ...typography.bodySmall,
    fontWeight: typography.heading.fontWeight,
    color: palette.background.primary,
  },
  dismissButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  dismissText: {
    ...typography.bodySmall,
    color: palette.text.muted,
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
