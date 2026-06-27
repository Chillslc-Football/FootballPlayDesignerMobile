import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EventDetailTabSelector } from '../../components/calendar/EventDetailTabSelector';
import { EventRsvpSelector } from '../../components/calendar/EventRsvpSelector';
import { EventRsvpTabContent } from '../../components/calendar/EventRsvpTabContent';
import { palette, spacing, typography } from '../../design-system';
import { useAuth } from '../../auth/AuthProvider';
import { CalendarStackParamList } from '../../navigation/CalendarStack';
import { deleteTeamEvent } from '../../lib/teamEventRepository';
import { fetchRsvpsForEvent, upsertMyRsvp } from '../../lib/teamEventRsvpRepository';
import { fetchProfileDisplayName, fetchTeamRoster } from '../../lib/teamRepository';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import type { TeamRosterMember } from '../../types/team';
import { eventToDraft } from '../../types/teamEvent';
import type { EventDetailTab, TeamEventRsvp, TeamEventRsvpStatus } from '../../types/teamEventRsvp';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import {
  formatTeamEventDateTimeRange,
  formatTeamEventDetailDate,
  formatTeamEventDetailTimeRange,
} from '../../utils/teamEventDisplay';
import { formatTeamEventReminderLabel } from '../../utils/teamEventReminderDisplay';
import { buildTeamEventRsvpSummary } from '../../utils/teamEventRsvpDisplay';

type Props = NativeStackScreenProps<CalendarStackParamList, 'EventDetail'>;

export function EventDetailScreen({ navigation, route }: Props) {
  const { event } = route.params;
  const { user } = useAuth();
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [activeTab, setActiveTab] = useState<EventDetailTab>('details');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(true);
  const [rsvpSaving, setRsvpSaving] = useState(false);
  const [rsvps, setRsvps] = useState<TeamEventRsvp[]>([]);
  const [roster, setRoster] = useState<TeamRosterMember[]>([]);
  const [createdByName, setCreatedByName] = useState<string | null>(null);

  const canManageEvents = canEditPlayMetadata(selectedTeamMemberRole);
  const location = event.location?.trim();
  const description = event.description?.trim();
  const teamId = selectedTeam?.id ?? event.team_id;

  const myRsvpStatus = useMemo(() => {
    if (!user) {
      return null;
    }

    return rsvps.find((rsvp) => rsvp.user_id === user.id)?.status ?? null;
  }, [rsvps, user]);

  const rsvpSummary = useMemo(() => {
    if (roster.length === 0 && rsvps.length === 0) {
      return null;
    }

    return buildTeamEventRsvpSummary(rsvps, roster);
  }, [rsvps, roster]);

  const loadRsvpData = useCallback(async () => {
    if (!teamId) {
      setRsvpLoading(false);
      return;
    }

    setRsvpLoading(true);
    setRsvpError(null);

    try {
      const [loadedRsvps, loadedRoster] = await Promise.all([
        fetchRsvpsForEvent(teamId, event.id),
        fetchTeamRoster(teamId),
      ]);

      setRsvps(loadedRsvps);
      setRoster(loadedRoster);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load RSVP data.';
      setRsvpError(message);
    } finally {
      setRsvpLoading(false);
    }
  }, [event.id, teamId]);

  useFocusEffect(
    useCallback(() => {
      void loadRsvpData();
    }, [loadRsvpData]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!event.created_by) {
        setCreatedByName(null);
        return;
      }

      let active = true;

      void fetchProfileDisplayName(event.created_by)
        .then((name) => {
          if (active) {
            setCreatedByName(name);
          }
        })
        .catch(() => {
          if (active) {
            setCreatedByName(null);
          }
        });

      return () => {
        active = false;
      };
    }, [event.created_by]),
  );

  const handleRsvpSelect = (status: TeamEventRsvpStatus) => {
    if (!teamId || !user || rsvpSaving) {
      return;
    }

    void (async () => {
      setRsvpSaving(true);
      setRsvpError(null);

      const previousRsvps = rsvps;
      const optimisticRsvp: TeamEventRsvp = {
        id: rsvps.find((rsvp) => rsvp.user_id === user.id)?.id ?? 'optimistic',
        event_id: event.id,
        team_id: teamId,
        user_id: user.id,
        status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        display_name:
          rsvps.find((rsvp) => rsvp.user_id === user.id)?.display_name ??
          roster.find((member) => member.user_id === user.id)?.display_name ??
          null,
      };

      setRsvps((current) => {
        const withoutMine = current.filter((rsvp) => rsvp.user_id !== user.id);
        return [...withoutMine, optimisticRsvp];
      });

      try {
        const savedRsvp = await upsertMyRsvp(teamId, event.id, status);

        setRsvps((current) => {
          const withoutMine = current.filter((rsvp) => rsvp.user_id !== user.id);
          return [...withoutMine, savedRsvp];
        });
      } catch (saveError) {
        setRsvps(previousRsvps);
        const message =
          saveError instanceof Error ? saveError.message : 'Failed to save your RSVP.';
        setRsvpError(message);
      } finally {
        setRsvpSaving(false);
      }
    })();
  };

  const handleEdit = () => {
    navigation.navigate('EventForm', {
      draft: eventToDraft(event),
      editingExisting: true,
    });
  };

  const handleDelete = () => {
    if (!teamId) {
      return;
    }

    Alert.alert('Delete event?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            setError(null);

            try {
              await deleteTeamEvent(teamId, event.id);
              navigation.popToTop();
            } catch (deleteError) {
              const message =
                deleteError instanceof Error
                  ? deleteError.message
                  : 'Failed to delete team event.';
              setError(message);
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>
        {formatTeamEventDateTimeRange(event.starts_at, event.ends_at)}
      </Text>

      <EventRsvpSelector
        selectedStatus={myRsvpStatus}
        saving={rsvpSaving}
        onSelect={handleRsvpSelect}
      />

      {rsvpError ? <Text style={styles.rsvpError}>{rsvpError}</Text> : null}

      <EventDetailTabSelector value={activeTab} onChange={setActiveTab} />

      {activeTab === 'details' ? (
        <View style={styles.detailsTab}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.fieldValue}>
              {formatTeamEventDetailDate(event.starts_at, event.ends_at)}
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Time</Text>
            <Text style={styles.fieldValue}>
              {formatTeamEventDetailTimeRange(event.starts_at, event.ends_at)}
            </Text>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Reminder</Text>
            <Text style={styles.fieldValue}>
              {formatTeamEventReminderLabel(event.reminder_enabled, event.reminder_minutes_before)}
            </Text>
          </View>

          {location ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Location</Text>
              <Text style={styles.fieldValue}>{location}</Text>
            </View>
          ) : null}

          {description ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldValue}>{description}</Text>
            </View>
          ) : null}

          {createdByName ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Created by</Text>
              <Text style={styles.fieldValue}>{createdByName}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {canManageEvents ? (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
                onPress={handleEdit}
                disabled={deleting}
              >
                <Text style={styles.editButtonText}>Edit Event</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  (deleting || pressed) && styles.buttonPressed,
                ]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.gold} size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <EventRsvpTabContent summary={rsvpSummary} loading={rsvpLoading} error={rsvpError} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.heading,
    color: palette.text.primary,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.body,
    color: palette.text.muted,
    marginBottom: spacing.lg,
  },
  detailsTab: {
    gap: 0,
  },
  fieldBlock: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.caption,
    color: palette.text.muted,
    fontWeight: typography.subheading.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  fieldValue: {
    ...typography.body,
    color: palette.text.secondary,
    lineHeight: 24,
  },
  error: {
    ...typography.body,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  rsvpError: {
    ...typography.body,
    color: palette.status.error,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  actions: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  editButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gold,
  },
});
