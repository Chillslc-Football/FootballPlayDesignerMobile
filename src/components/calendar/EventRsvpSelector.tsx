import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../design-system';
import type { TeamEventRsvpStatus } from '../../types/teamEventRsvp';

type RsvpOption = {
  status: TeamEventRsvpStatus;
  label: string;
  selectedBorderColor: string;
  selectedBackgroundColor: string;
};

const RSVP_OPTIONS: RsvpOption[] = [
  {
    status: 'accepted',
    label: '🟢 Accept',
    selectedBorderColor: palette.status.success,
    selectedBackgroundColor: 'rgba(90, 158, 122, 0.15)',
  },
  {
    status: 'tentative',
    label: '🟡 Tentative',
    selectedBorderColor: palette.status.warning,
    selectedBackgroundColor: 'rgba(184, 149, 107, 0.15)',
  },
  {
    status: 'declined',
    label: '🔴 Decline',
    selectedBorderColor: palette.status.error,
    selectedBackgroundColor: 'rgba(224, 112, 112, 0.15)',
  },
];

type EventRsvpSelectorProps = {
  selectedStatus: TeamEventRsvpStatus | null;
  saving: boolean;
  onSelect: (status: TeamEventRsvpStatus) => void;
};

export function EventRsvpSelector({ selectedStatus, saving, onSelect }: EventRsvpSelectorProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Your RSVP</Text>
        {saving ? <ActivityIndicator color={palette.text.muted} size="small" /> : null}
      </View>

      <View style={styles.chipRow}>
        {RSVP_OPTIONS.map((option) => {
          const selected = selectedStatus === option.status;

          return (
            <Pressable
              key={option.status}
              style={({ pressed }) => [
                styles.chip,
                selected && {
                  borderColor: option.selectedBorderColor,
                  backgroundColor: option.selectedBackgroundColor,
                },
                (pressed || saving) && styles.chipPressed,
              ]}
              onPress={() => onSelect(option.status)}
              disabled={saving}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    color: palette.text.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipLabel: {
    ...typography.caption,
    color: palette.text.secondary,
    fontWeight: typography.subheading.fontWeight,
  },
  chipLabelSelected: {
    color: palette.text.primary,
  },
});
