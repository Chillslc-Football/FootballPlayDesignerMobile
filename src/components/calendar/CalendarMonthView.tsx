import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSize, palette, radius, spacing, typography } from '../../design-system';
import type { TeamEvent } from '../../types/teamEvent';
import {
  addMonths,
  buildEventsByDateKey,
  formatMonthLabel,
  formatSelectedDayLabel,
  getEventsForDate,
  getMonthCellEventPreview,
  getMonthGridCells,
  getWeekdayLabels,
  isSameLocalDay,
  isToday,
} from '../../utils/calendarViewDisplay';
import { isPastTeamEvent } from '../../utils/teamEventDisplay';
import { CalendarEmptyState } from './CalendarEmptyState';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarMonthDayEventChip } from './CalendarMonthDayEventChip';

type CalendarMonthViewProps = {
  events: TeamEvent[];
  visibleMonth: Date;
  selectedDate: Date;
  onVisibleMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  onOpenEvent: (event: TeamEvent) => void;
};

export function CalendarMonthView({
  events,
  visibleMonth,
  selectedDate,
  onVisibleMonthChange,
  onSelectDate,
  onOpenEvent,
}: CalendarMonthViewProps) {
  const eventsByDate = useMemo(() => buildEventsByDateKey(events), [events]);
  const monthCells = useMemo(
    () => getMonthGridCells(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );
  const selectedDayEvents = useMemo(
    () => getEventsForDate(eventsByDate, selectedDate),
    [eventsByDate, selectedDate],
  );
  const [hasTappedDay, setHasTappedDay] = useState(false);

  const handlePreviousMonth = () => {
    onVisibleMonthChange(addMonths(visibleMonth, -1));
    setHasTappedDay(false);
  };

  const handleNextMonth = () => {
    onVisibleMonthChange(addMonths(visibleMonth, 1));
    setHasTappedDay(false);
  };

  const handleDayPress = (date: Date) => {
    onSelectDate(date);
    setHasTappedDay(true);
  };

  const showSelectedDaySection = hasTappedDay;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={handlePreviousMonth} hitSlop={8}>
          <Text style={styles.navButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerLabel}>{formatMonthLabel(visibleMonth)}</Text>
        <Pressable style={styles.navButton} onPress={handleNextMonth} hitSlop={8}>
          <Text style={styles.navButtonText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {getWeekdayLabels().map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {monthCells.map((cell) => {
          const selected = isSameLocalDay(cell.date, selectedDate);
          const today = isToday(cell.date);
          const dayEvents = getEventsForDate(eventsByDate, cell.date);
          const { visible, remainingCount } = getMonthCellEventPreview(dayEvents);

          return (
            <Pressable
              key={cell.date.toISOString()}
              style={({ pressed }) => [
                styles.dayCell,
                !cell.inCurrentMonth && styles.dayCellOutsideMonth,
                selected && styles.dayCellSelected,
                pressed && styles.dayCellPressed,
              ]}
              onPress={() => handleDayPress(cell.date)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !cell.inCurrentMonth && styles.dayNumberOutsideMonth,
                  selected && styles.dayNumberSelected,
                  today && !selected && styles.dayNumberToday,
                ]}
              >
                {cell.date.getDate()}
              </Text>

              <View style={styles.dayEvents}>
                {visible.map((event) => (
                  <CalendarMonthDayEventChip key={event.id} title={event.title} />
                ))}
                {remainingCount > 0 ? (
                  <Text style={styles.moreEventsLabel} numberOfLines={1}>
                    +{remainingCount} more
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {showSelectedDaySection ? (
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
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
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: palette.text.muted,
    fontWeight: typography.label.fontWeight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    borderRadius: radius.md,
    paddingHorizontal: 2,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    overflow: 'hidden',
  },
  dayCellOutsideMonth: {
    opacity: 0.45,
  },
  dayCellSelected: {
    backgroundColor: palette.background.secondary,
    borderWidth: 1,
    borderColor: palette.accent.default,
  },
  dayCellPressed: {
    opacity: 0.88,
  },
  dayNumber: {
    fontSize: fontSize.small,
    color: palette.text.primary,
    fontWeight: typography.subheading.fontWeight,
    alignSelf: 'flex-start',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  dayNumberOutsideMonth: {
    color: palette.text.muted,
  },
  dayNumberSelected: {
    color: palette.text.primary,
  },
  dayNumberToday: {
    color: palette.accent.default,
  },
  dayEvents: {
    gap: 2,
    flex: 1,
  },
  moreEventsLabel: {
    fontSize: fontSize.caption,
    color: palette.text.muted,
    lineHeight: 14,
    paddingHorizontal: spacing.xs,
  },
  selectedDaySection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  selectedDayTitle: {
    ...typography.label,
    marginLeft: spacing.xs,
  },
  eventList: {
    gap: spacing.md,
  },
});
