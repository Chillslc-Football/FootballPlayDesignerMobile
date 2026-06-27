import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSize, iconSizes, palette, radius, spacing, typography } from '../../design-system';
import {
  CALENDAR_VIEW_MODES,
  CALENDAR_VIEW_MODE_LABELS,
  type CalendarViewMode,
} from '../../types/calendarView';

type CalendarViewModeSelectorProps = {
  value: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
  showAddButton?: boolean;
  onAddEvent?: () => void;
};

export function CalendarViewModeSelector({
  value,
  onChange,
  showAddButton = false,
  onAddEvent,
}: CalendarViewModeSelectorProps) {
  return (
    <View style={styles.toolbarRow}>
      <View style={styles.selectorContainer}>
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

      {showAddButton && onAddEvent ? (
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={onAddEvent}
          accessibilityRole="button"
          accessibilityLabel="Add event"
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  selectorContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: palette.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: 6,
    minHeight: 32,
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
    fontSize: fontSize.caption,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.muted,
  },
  segmentLabelSelected: {
    color: palette.text.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.interactive.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.88,
  },
  addButtonText: {
    fontSize: iconSizes.lg,
    lineHeight: 24,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
  },
});
