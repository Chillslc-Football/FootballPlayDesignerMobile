import { StyleSheet, Text, View } from 'react-native';

import { fontSize, palette, radius, spacing, typography } from '../../design-system';

type CalendarMonthDayEventChipTone = 'default';

type CalendarMonthDayEventChipProps = {
  title: string;
  /** Reserved for future event category colors. */
  tone?: CalendarMonthDayEventChipTone;
};

export function CalendarMonthDayEventChip({
  title,
  tone = 'default',
}: CalendarMonthDayEventChipProps) {
  return (
    <View style={[styles.chip, tone === 'default' && styles.chipDefault]}>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 16,
    justifyContent: 'center',
  },
  chipDefault: {
    backgroundColor: palette.background.card,
    borderWidth: 1,
    borderColor: palette.border.subtle,
  },
  title: {
    fontSize: fontSize.caption,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.secondary,
    lineHeight: 14,
  },
});
