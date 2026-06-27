import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typography } from '../../design-system';
import type { TeamEvent } from '../../types/teamEvent';
import {
  addDays,
  buildEventsByDateKey,
  formatSelectedDayLabel,
  formatWeekRangeLabel,
  getEventsForDate,
  getWeekDates,
  getWeekdayLabels,
  isSameLocalDay,
  isToday,
  startOfDay,
} from '../../utils/calendarViewDisplay';
import { isPastTeamEvent } from '../../utils/teamEventDisplay';
import { CalendarEmptyState } from './CalendarEmptyState';
import { CalendarEventCard } from './CalendarEventCard';

type CalendarScheduleViewProps = {
  events: TeamEvent[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onOpenEvent: (event: TeamEvent) => void;
};

export function CalendarScheduleView({
  events,
  selectedDate,
  onSelectedDateChange,
  onOpenEvent,
}: CalendarScheduleViewProps) {
  const eventsByDate = useMemo(() => buildEventsByDateKey(events), [events]);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekdayLabels = getWeekdayLabels();
  const selectedDayEvents = useMemo(
    () => getEventsForDate(eventsByDate, selectedDate),
    [eventsByDate, selectedDate],
  );

  const handlePreviousWeek = () => {
    onSelectedDateChange(addDays(selectedDate, -7));
  };

  const handleNextWeek = () => {
    onSelectedDateChange(addDays(selectedDate, 7));
  };

  const handleSelectDay = (date: Date) => {
    onSelectedDateChange(startOfDay(date));
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

      <View style={styles.weekStrip}>
        {weekDates.map((date, index) => {
          const selected = isSameLocalDay(date, selectedDate);
          const today = isToday(date);
          const weekdayLabel = weekdayLabels[index] ?? '';

          return (
            <Pressable
              key={date.toISOString()}
              style={({ pressed }) => [
                styles.weekDayCell,
                selected && styles.weekDayCellSelected,
                pressed && styles.weekDayCellPressed,
              ]}
              onPress={() => handleSelectDay(date)}
            >
              <Text style={[styles.weekdayLabel, selected && styles.weekdayLabelSelected]}>
                {weekdayLabel}
              </Text>
              <Text
                style={[
                  styles.weekDayNumber,
                  selected && styles.weekDayNumberSelected,
                  today && !selected && styles.weekDayNumberToday,
                ]}
              >
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedDaySection}>
        <Text style={styles.selectedDayTitle}>{formatSelectedDayLabel(selectedDate)}</Text>

        {selectedDayEvents.length === 0 ? (
          <CalendarEmptyState
            title="No events"
            message="No events scheduled for this day."
          />
        ) : (
          <View style={styles.eventList}>
            {selectedDayEvents.map((event) => (
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
  weekStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    gap: spacing.xs,
  },
  weekDayCellSelected: {
    backgroundColor: palette.background.secondary,
    borderWidth: 1,
    borderColor: palette.accent.default,
  },
  weekDayCellPressed: {
    opacity: 0.88,
  },
  weekdayLabel: {
    ...typography.caption,
    color: palette.text.muted,
    fontWeight: typography.label.fontWeight,
  },
  weekdayLabelSelected: {
    color: palette.text.primary,
  },
  weekDayNumber: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
  },
  weekDayNumberSelected: {
    color: palette.text.primary,
  },
  weekDayNumberToday: {
    color: palette.accent.default,
  },
  selectedDaySection: {
    gap: spacing.sm,
  },
  selectedDayTitle: {
    ...typography.label,
    marginLeft: spacing.xs,
  },
  eventList: {
    gap: spacing.md,
  },
});
