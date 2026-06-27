import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CalendarListView } from '../../components/calendar/CalendarListView';
import { CalendarMonthView } from '../../components/calendar/CalendarMonthView';
import { CalendarScheduleView } from '../../components/calendar/CalendarScheduleView';
import { CalendarViewModeSelector } from '../../components/calendar/CalendarViewModeSelector';
import { ScreenContainer } from '../../components/ScreenContainer';
import { palette, spacing, typography } from '../../design-system';
import { CalendarStackParamList } from '../../navigation/CalendarStack';
import { fetchTeamEventsByTeam } from '../../lib/teamEventRepository';
import { useTeam } from '../../team/TeamProvider';
import { DEFAULT_CALENDAR_VIEW_MODE, type CalendarViewMode } from '../../types/calendarView';
import { createEmptyTeamEventDraft, type TeamEvent } from '../../types/teamEvent';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { loadCalendarViewMode, saveCalendarViewMode } from '../../utils/calendarViewPreference';
import { startOfDay } from '../../utils/calendarViewDisplay';

type NavigationProp = NativeStackNavigationProp<CalendarStackParamList, 'EventList'>;

export function CalendarEventListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(DEFAULT_CALENDAR_VIEW_MODE);
  const [viewModeLoaded, setViewModeLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(new Date()));
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  const canManageEvents = canEditPlayMetadata(selectedTeamMemberRole);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  useEffect(() => {
    let active = true;

    void loadCalendarViewMode().then((mode) => {
      if (active) {
        setViewMode(mode);
        setViewModeLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

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

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    void saveCalendarViewMode(mode);
  };

  const handleSelectDate = (date: Date) => {
    const normalized = startOfDay(date);
    setSelectedDate(normalized);
    setVisibleMonth(normalized);
  };

  const handleCreateEvent = () => {
    navigation.navigate('EventForm', {
      draft: createEmptyTeamEventDraft(),
      editingExisting: false,
    });
  };

  const handleOpenEvent = (event: TeamEvent) => {
    navigation.navigate('EventDetail', { event });
  };

  if (loading || !viewModeLoaded) {
    return (
      <ScreenContainer title="Calendar" subtitle={selectedTeam?.name} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.accent.default} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Calendar" subtitle={selectedTeam?.name ?? 'Team schedule'}>
      <CalendarViewModeSelector
        value={viewMode}
        onChange={handleViewModeChange}
        showAddButton={canManageEvents}
        onAddEvent={handleCreateEvent}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {viewMode === 'month' ? (
        <CalendarMonthView
          events={events}
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          onVisibleMonthChange={setVisibleMonth}
          onSelectDate={handleSelectDate}
          onOpenEvent={handleOpenEvent}
        />
      ) : null}

      {viewMode === 'schedule' ? (
        <CalendarScheduleView
          events={events}
          selectedDate={selectedDate}
          onSelectedDateChange={handleSelectDate}
          onOpenEvent={handleOpenEvent}
        />
      ) : null}

      {viewMode === 'list' ? (
        <CalendarListView
          events={events}
          canManageEvents={canManageEvents}
          hasError={Boolean(error)}
          onOpenEvent={handleOpenEvent}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl + spacing.lg,
  },
  error: {
    ...typography.bodySmall,
    color: palette.status.error,
    marginBottom: spacing.md,
  },
});
