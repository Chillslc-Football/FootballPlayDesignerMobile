import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '../../design-system';
import type { TeamEvent } from '../../types/teamEvent';
import { isPastTeamEvent, partitionTeamEventsByUpcomingPast } from '../../utils/teamEventDisplay';
import { CalendarEmptyState } from './CalendarEmptyState';
import { CalendarEventCard } from './CalendarEventCard';

type CalendarListViewProps = {
  events: TeamEvent[];
  canManageEvents: boolean;
  hasError: boolean;
  onOpenEvent: (event: TeamEvent) => void;
};

export function CalendarListView({
  events,
  canManageEvents,
  hasError,
  onOpenEvent,
}: CalendarListViewProps) {
  const { upcoming, past } = partitionTeamEventsByUpcomingPast(events);
  const hasEvents = events.length > 0;

  if (!hasError && !hasEvents) {
    return (
      <CalendarEmptyState
        title="No events yet"
        message={
          canManageEvents
            ? 'Team practices and meetings will appear here. Tap Add Event to schedule one.'
            : 'Team practices and meetings will appear here.'
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      {!hasError && hasEvents && upcoming.length === 0 ? (
        <CalendarEmptyState
          title="No upcoming events"
          message="Past events are listed below."
        />
      ) : null}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          <View style={styles.eventList}>
            {upcoming.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                isPast={false}
                onPress={() => onOpenEvent(event)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {past.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past</Text>
          <View style={styles.eventList}>
            {past.map((event) => (
              <CalendarEventCard
                key={event.id}
                event={event}
                isPast={isPastTeamEvent(event)}
                onPress={() => onOpenEvent(event)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    marginLeft: spacing.xs,
  },
  eventList: {
    gap: spacing.md,
  },
});
