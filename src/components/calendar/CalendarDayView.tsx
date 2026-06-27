import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../design-system';
import type { TeamEvent } from '../../types/teamEvent';
import {
  addDays,
  buildEventsByDateKey,
  formatDayHeading,
  getEventsForDate,
} from '../../utils/calendarViewDisplay';
import { isPastTeamEvent } from '../../utils/teamEventDisplay';
import { CalendarEmptyState } from './CalendarEmptyState';
import { CalendarEventCard } from './CalendarEventCard';

type CalendarDayViewProps = {
  events: TeamEvent[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onOpenEvent: (event: TeamEvent) => void;
};

export function CalendarDayView({
  events,
  selectedDate,
  onSelectedDateChange,
  onOpenEvent,
}: CalendarDayViewProps) {
  const eventsByDate = useMemo(() => buildEventsByDateKey(events), [events]);
  const dayEvents = useMemo(
    () => getEventsForDate(eventsByDate, selectedDate),
    [eventsByDate, selectedDate],
  );

  const handlePreviousDay = () => {
    onSelectedDateChange(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    onSelectedDateChange(addDays(selectedDate, 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={handlePreviousDay} hitSlop={8}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerLabel}>{formatDayHeading(selectedDate)}</Text>
        <Pressable style={styles.navButton} onPress={handleNextDay} hitSlop={8}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      {dayEvents.length === 0 ? (
        <CalendarEmptyState title="No events" message="Nothing scheduled for this day." />
      ) : (
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
    gap: spacing.sm,
  },
  headerLabel: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.primary,
    textAlign: 'center',
    flex: 1,
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
  eventList: {
    gap: spacing.md,
  },
});
