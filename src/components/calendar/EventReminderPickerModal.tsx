import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { cardPresets, palette, radius, spacing, typography } from '../../design-system';
import {
  TEAM_EVENT_REMINDER_OPTIONS,
  type TeamEventReminderOptionValue,
} from '../../utils/teamEventReminderDisplay';

type EventReminderPickerModalProps = {
  visible: boolean;
  selectedValue: TeamEventReminderOptionValue;
  onSelect: (value: TeamEventReminderOptionValue) => void;
  onClose: () => void;
};

export function EventReminderPickerModal({
  visible,
  selectedValue,
  onSelect,
  onClose,
}: EventReminderPickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <View style={styles.sheet}>
          <Text style={styles.title}>Reminder</Text>

          {TEAM_EVENT_REMINDER_OPTIONS.map((option) => {
            const selected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  pressed && styles.optionRowPressed,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {selected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}

          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.optionRowPressed]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    ...cardPresets.default.container,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  optionRowSelected: {
    backgroundColor: palette.background.secondary,
  },
  optionRowPressed: {
    opacity: 0.88,
  },
  optionLabel: {
    ...typography.bodySmall,
    color: palette.text.primary,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: typography.subheading.fontWeight,
  },
  checkmark: {
    ...typography.bodySmall,
    color: palette.navigation.tabActive,
    fontWeight: typography.heading.fontWeight,
  },
  cancelButton: {
    marginTop: spacing.sm,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.bodySmall,
    color: palette.text.muted,
    fontWeight: typography.subheading.fontWeight,
  },
});
