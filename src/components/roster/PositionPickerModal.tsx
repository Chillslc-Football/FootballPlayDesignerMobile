import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { radius, spacing, typography } from '../../design-system';
import { PLAYER_POSITION_LABELS } from '../../types/playerPosition';

type PositionPickerModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string | null;
  allowNone?: boolean;
  onSelect: (value: string | null) => void;
  onClose: () => void;
};

export function PositionPickerModal({
  visible,
  title,
  options,
  selectedValue,
  allowNone = false,
  onSelect,
  onClose,
}: PositionPickerModalProps) {
  const { palette, cardPresets } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          maxHeight: '70%',
        },
        title: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.text.primary,
          marginBottom: spacing.md,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          minHeight: 44,
        },
        optionRowSelected: {
          backgroundColor: palette.background.secondary,
        },
        optionRowPressed: {
          opacity: 0.9,
        },
        optionLabel: {
          ...typography.bodySmall,
          color: palette.text.primary,
        },
        optionLabelSelected: {
          fontWeight: typography.subheading.fontWeight,
        },
        optionMeta: {
          ...typography.caption,
          color: palette.text.muted,
          marginTop: 2,
        },
        checkmark: {
          ...typography.bodySmall,
          fontWeight: typography.heading.fontWeight,
          color: palette.navigation.tabActive,
        },
        cancelButton: {
          marginTop: spacing.sm,
          alignItems: 'center',
          paddingVertical: spacing.sm,
        },
        cancelButtonText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
        },
      }),
    [cardPresets, palette],
  );

  const pickerOptions: Array<{ value: string | null; label: string; meta?: string }> = [
    ...(allowNone ? [{ value: null, label: 'None' }] : []),
    ...options.map((position) => ({
      value: position,
      label: position,
      meta: PLAYER_POSITION_LABELS[position as keyof typeof PLAYER_POSITION_LABELS],
    })),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          {pickerOptions.map((option) => {
            const selected = option.value === selectedValue;

            return (
              <Pressable
                key={option.value ?? 'none'}
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
                <View>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  {option.meta ? <Text style={styles.optionMeta}>{option.meta}</Text> : null}
                </View>
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
