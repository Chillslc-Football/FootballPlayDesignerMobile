import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../design-system';
import {
  CALENDAR_VIEW_MODES,
  CALENDAR_VIEW_MODE_LABELS,
  type CalendarViewMode,
} from '../../types/calendarView';

type CalendarViewModeSelectorProps = {
  value: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
};

export function CalendarViewModeSelector({ value, onChange }: CalendarViewModeSelectorProps) {
  return (
    <View style={styles.container}>
      {CALENDAR_VIEW_MODES.map((mode) => {
        const selected = mode === value;

        return (
          <Pressable
            key={mode}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && styles.segmentPressed,
            ]}
            onPress={() => onChange(mode)}
          >
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
              {CALENDAR_VIEW_MODE_LABELS[mode]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: palette.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  segmentSelected: {
    backgroundColor: palette.background.card,
    borderWidth: 1,
    borderColor: palette.border.default,
  },
  segmentPressed: {
    opacity: 0.9,
  },
  segmentLabel: {
    ...typography.caption,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.muted,
  },
  segmentLabelSelected: {
    color: palette.text.primary,
  },
});
