import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/ScreenContainer';
import { CalendarStackParamList } from '../../navigation/CalendarStack';
import { fetchTeamEventsByTeam } from '../../lib/teamEventRepository';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import { createEmptyTeamEventDraft, type TeamEvent } from '../../types/teamEvent';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import {
  formatTeamEventDateTimeRange,
  isPastTeamEvent,
  partitionTeamEventsByUpcomingPast,
  previewTeamEventDescription,
} from '../../utils/teamEventDisplay';

type NavigationProp = NativeStackNavigationProp<CalendarStackParamList, 'EventList'>;

function EventCard({
  event,
  isPast,
  onPress,
}: {
  event: TeamEvent;
  isPast: boolean;
  onPress: () => void;
}) {
  const location = event.location?.trim();
  const descriptionPreview = previewTeamEventDescription(event.description);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.eventCard,
        isPast && styles.eventCardPast,
        pressed && styles.eventCardPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.eventTitle, isPast && styles.eventTitlePast]}>{event.title}</Text>
      <Text style={styles.eventMeta}>{formatTeamEventDateTimeRange(event.starts_at, event.ends_at)}</Text>
      {location ? <Text style={styles.eventLocation}>{location}</Text> : null}
      {descriptionPreview ? (
        <Text style={styles.eventDescription}>{descriptionPreview}</Text>
      ) : null}
    </Pressable>
  );
}

export function CalendarEventListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  const canManageEvents = canEditPlayMetadata(selectedTeamMemberRole);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const loadEvents = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);

    try {
      const loadedEvents = await fetchTeamEventsByTeam(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setEvents(loadedEvents);
      loadedTeamIdRef.current = teamId;
    } catch (loadError) {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team events.';
      setError(message);
      setEvents([]);
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setEvents([]);
        setError(null);
        setLoading(false);
        loadedTeamIdRef.current = null;
        return;
      }

      void loadEvents(teamId);
    }, [selectedTeam?.id, loadEvents]),
  );

  const handleCreateEvent = () => {
    navigation.navigate('EventForm', {
      draft: createEmptyTeamEventDraft(),
      editingExisting: false,
    });
  };

  const handleOpenEvent = (event: TeamEvent) => {
    navigation.navigate('EventDetail', { event });
  };

  const { upcoming, past } = partitionTeamEventsByUpcomingPast(events);

  if (loading) {
    return (
      <ScreenContainer title="Calendar" subtitle={selectedTeam?.name} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Calendar" subtitle={selectedTeam?.name}>
      {canManageEvents ? (
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          onPress={handleCreateEvent}
        >
          <Text style={styles.createButtonText}>Create Event</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No team events scheduled yet.</Text>
        </View>
      ) : null}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcoming.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isPast={false}
              onPress={() => handleOpenEvent(event)}
            />
          ))}
        </View>
      ) : null}

      {!error && events.length > 0 && upcoming.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming events.</Text>
        </View>
      ) : null}

      {past.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past</Text>
          {past.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isPast={isPastTeamEvent(event)}
              onPress={() => handleOpenEvent(event)}
            />
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  error: {
    fontSize: 15,
    color: colors.gold,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  eventCardPast: {
    opacity: 0.75,
  },
  eventCardPressed: {
    opacity: 0.9,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  eventTitlePast: {
    color: colors.textSecondary,
  },
  eventMeta: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
