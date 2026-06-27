import { StyleSheet, Text, View } from 'react-native';

import { inputPresets, palette, spacing, typography } from '../../design-system';

type EventFormFieldLabelProps = {
  label: string;
  required?: boolean;
  optional?: boolean;
};

export function EventFormFieldLabel({
  label,
  required = false,
  optional = false,
}: EventFormFieldLabelProps) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      {optional ? <Text style={styles.optionalMark}>(Optional)</Text> : null}
    </View>
  );
}

type EventFormFieldErrorProps = {
  message: string | null;
};

export function EventFormFieldError({ message }: EventFormFieldErrorProps) {
  if (!message) {
    return null;
  }

  return <Text style={styles.fieldError}>{message}</Text>;
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  fieldLabel: {
    ...inputPresets.default.label,
    marginBottom: 0,
    flexShrink: 1,
  },
  requiredMark: {
    color: palette.status.error,
  },
  optionalMark: {
    ...typography.caption,
    color: palette.text.muted,
  },
  fieldError: {
    ...inputPresets.default.error,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
