import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../design-system';
import type { TeamEvent } from '../../types/teamEvent';
import {
  addDays,
  buildEventsByDateKey,
  formatWeekRangeLabel,
  getEventsForDate,
  getWeekDates,
  getWeekdayLabels,
  isToday,
} from '../../utils/calendarViewDisplay';
import { isPastTeamEvent } from '../../utils/teamEventDisplay';
import { CalendarEmptyState } from './CalendarEmptyState';
import { CalendarEventCard } from './CalendarEventCard';

type CalendarWeekViewProps = {
  events: TeamEvent[];
  anchorDate: Date;
  onAnchorDateChange: (date: Date) => void;
  onOpenEvent: (event: TeamEvent) => void;
};

export function CalendarWeekView({
  events,
  anchorDate,
  onAnchorDateChange,
  onOpenEvent,
}: CalendarWeekViewProps) {
  const eventsByDate = useMemo(() => buildEventsByDateKey(events), [events]);
  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);
  const weekHasEvents = useMemo(
    () => weekDates.some((date) => getEventsForDate(eventsByDate, date).length > 0),
    [eventsByDate, weekDates],
  );

  const handlePreviousWeek = () => {
    onAnchorDateChange(addDays(anchorDate, -7));
  };

  const handleNextWeek = () => {
    onAnchorDateChange(addDays(anchorDate, 7));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={handlePreviousWeek} hitSlop={8}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerLabel}>{formatWeekRangeLabel(weekDates)}</Text>
        <Pressable style={styles.navButton} onPress={handleNextWeek} hitSlop={8}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      {!weekHasEvents ? (
        <CalendarEmptyState title="No events this week" message="Nothing scheduled for this week." />
      ) : (
        weekDates.map((date, index) => {
          const dayEvents = getEventsForDate(eventsByDate, date);

          if (dayEvents.length === 0) {
            return null;
          }

          const weekdayLabel = getWeekdayLabels()[index] ?? '';
          const today = isToday(date);

          return (
            <View key={date.toISOString()} style={styles.daySection}>
              <Text style={[styles.dayHeading, today && styles.dayHeadingToday]}>
                {weekdayLabel} {date.getMonth() + 1}/{date.getDate()}
              </Text>
              <View style={styles.eventList}>
                {dayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    isPast={isPastTeamEvent(event)}
                    onPress={() => onOpenEvent(event)}
                  />
                ))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.primary,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 22,
    color: palette.text.primary,
    lineHeight: 24,
  },
  daySection: {
    gap: spacing.sm,
  },
  dayHeading: {
    ...typography.label,
    marginLeft: spacing.xs,
  },
  dayHeadingToday: {
    color: palette.accent.default,
  },
  eventList: {
    gap: spacing.md,
  },
});
