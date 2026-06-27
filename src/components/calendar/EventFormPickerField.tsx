import { Pressable, StyleSheet, Text, View } from 'react-native';

import { inputPresets, palette, spacing, typography } from '../../design-system';
import { EventFormFieldError, EventFormFieldLabel } from './EventFormFieldLabel';

type EventFormPickerFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  error?: string | null;
};

export function EventFormPickerField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  required = false,
  optional = false,
  error = null,
}: EventFormPickerFieldProps) {
  return (
    <View style={styles.field}>
      <EventFormFieldLabel label={label} required={required} optional={optional} />
      <Pressable
        style={({ pressed }) => [
          styles.fieldButton,
          error && styles.fieldButtonError,
          disabled && styles.fieldButtonDisabled,
          pressed && !disabled && styles.fieldButtonPressed,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
          {value || placeholder}
        </Text>
      </Pressable>
      <EventFormFieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.lg,
  },
  fieldButton: {
    ...inputPresets.default.field,
    justifyContent: 'center',
    marginBottom: 0,
  },
  fieldButtonError: {
    borderColor: palette.status.error,
  },
  fieldButtonDisabled: {
    opacity: 0.6,
  },
  fieldButtonPressed: {
    backgroundColor: palette.background.card,
  },
  fieldValue: {
    ...typography.bodySmall,
    color: palette.text.primary,
  },
  fieldPlaceholder: {
    color: palette.text.muted,
  },
});
