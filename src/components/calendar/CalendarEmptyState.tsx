import { StyleSheet, Text, View } from 'react-native';

import { cardPresets, palette, spacing, typography } from '../../design-system';

type CalendarEmptyStateProps = {
  title: string;
  message: string;
};

export function CalendarEmptyState({ title, message }: CalendarEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const sectionCardStyle = {
  ...cardPresets.default.container,
  marginBottom: 0,
};

const styles = StyleSheet.create({
  emptyState: {
    ...sectionCardStyle,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
  },
});
