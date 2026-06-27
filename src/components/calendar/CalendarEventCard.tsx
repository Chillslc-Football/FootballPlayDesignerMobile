import { Pressable, StyleSheet, Text, View } from 'react-native';

import { iconSizes, palette, radius, spacing, typography } from '../../design-system';
import type { TeamEvent } from '../../types/teamEvent';
import {
  formatTeamEventListDate,
  formatTeamEventListTimeRange,
} from '../../utils/teamEventDisplay';

type CalendarEventCardProps = {
  event: TeamEvent;
  isPast: boolean;
  onPress: () => void;
};

export function CalendarEventCard({ event, isPast, onPress }: CalendarEventCardProps) {
  const location = event.location?.trim();

  return (
    <Pressable
      style={({ pressed }) => [styles.eventCard, pressed && styles.eventCardPressed]}
      onPress={onPress}
    >
      <View style={styles.eventCardContent}>
        <View style={styles.eventCardHeader}>
          <Text style={[styles.eventTitle, isPast && styles.eventTitlePast]} numberOfLines={2}>
            {event.title}
          </Text>
          {isPast ? (
            <View style={styles.pastBadge}>
              <Text style={styles.pastBadgeText}>Past</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.eventDate, isPast && styles.eventDatePast]}>
          {formatTeamEventListDate(event.starts_at, event.ends_at)}
        </Text>
        <Text style={styles.eventTime}>
          {formatTeamEventListTimeRange(event.starts_at, event.ends_at)}
        </Text>

        {location ? (
          <Text style={styles.eventLocation} numberOfLines={1}>
            📍 {location}
          </Text>
        ) : null}
      </View>

      <Text style={styles.eventChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.background.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  eventCardPressed: {
    backgroundColor: palette.background.secondary,
  },
  eventCardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  eventTitle: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
    flex: 1,
  },
  eventTitlePast: {
    color: palette.text.secondary,
  },
  pastBadge: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pastBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.label.fontWeight,
    color: palette.text.muted,
    textTransform: 'uppercase',
    letterSpacing: typography.label.letterSpacing,
  },
  eventDate: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.primary,
  },
  eventDatePast: {
    color: palette.text.secondary,
  },
  eventTime: {
    ...typography.bodySmall,
    color: palette.text.muted,
  },
  eventLocation: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    marginTop: spacing.xs,
  },
  eventChevron: {
    fontSize: iconSizes.lg,
    color: palette.text.muted,
    fontWeight: '300',
    marginLeft: spacing.sm,
  },
});
