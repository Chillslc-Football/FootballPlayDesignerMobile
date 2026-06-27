import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { useAppTheme } from '../design-system';
import { spacing, typography } from '../design-system';
import { NOTIFICATION_CATEGORY_DEFINITIONS } from '../notifications/notificationCategoryRegistry';
import type { NotificationCategoryKey, NotificationCategoryPreferences } from '../types/notificationPreference';

type NotificationCategoryPreferenceListProps = {
  teamName: string | null;
  preferences: NotificationCategoryPreferences | null;
  loading: boolean;
  savingKey: NotificationCategoryKey | null;
  error: string | null;
  osNotificationsEnabled: boolean;
  onToggleCategory: (category: NotificationCategoryKey, enabled: boolean) => void;
};

export function NotificationCategoryPreferenceList({
  teamName,
  preferences,
  loading,
  savingKey,
  error,
  osNotificationsEnabled,
  onToggleCategory,
}: NotificationCategoryPreferenceListProps) {
  const { palette, cardPresets } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          ...cardPresets.default.container,
          gap: spacing.md,
        },
        sectionTitle: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.text.primary,
        },
        teamContextText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
        },
        helperText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 20,
        },
        errorText: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 20,
        },
        loadingRow: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        preferenceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          minHeight: 44,
        },
        preferenceLabel: {
          ...typography.bodySmall,
          color: palette.text.primary,
          flex: 1,
        },
      }),
    [cardPresets, palette],
  );

  const togglesEnabled = osNotificationsEnabled && Boolean(teamName) && Boolean(preferences);

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>App Notifications</Text>

      {teamName ? (
        <Text style={styles.teamContextText}>Preferences for {teamName}</Text>
      ) : (
        <Text style={styles.helperText}>Select a team to manage notification preferences.</Text>
      )}

      {!osNotificationsEnabled ? (
        <Text style={styles.helperText}>
          Enable device notifications above to manage notification types.
        </Text>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={palette.text.muted} size="small" />
        </View>
      ) : (
        NOTIFICATION_CATEGORY_DEFINITIONS.map((definition) => {
          const enabled = preferences?.[definition.key] ?? true;
          const isSaving = savingKey === definition.key;

          return (
            <View key={definition.key} style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>{definition.label}</Text>
              {isSaving ? (
                <ActivityIndicator color={palette.text.muted} size="small" />
              ) : (
                <Switch
                  value={enabled}
                  onValueChange={(nextValue) => onToggleCategory(definition.key, nextValue)}
                  trackColor={{
                    false: palette.border.default,
                    true: palette.navigation.tabActive,
                  }}
                  thumbColor={palette.text.primary}
                  disabled={!togglesEnabled}
                />
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
