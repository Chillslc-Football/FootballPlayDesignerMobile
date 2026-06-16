import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CalendarStackParamList } from '../../navigation/CalendarStack';
import { deleteTeamEvent } from '../../lib/teamEventRepository';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import { eventToDraft } from '../../types/teamEvent';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatTeamEventDateTimeRange } from '../../utils/teamEventDisplay';

type Props = NativeStackScreenProps<CalendarStackParamList, 'EventDetail'>;

export function EventDetailScreen({ navigation, route }: Props) {
  const { event } = route.params;
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageEvents = canEditPlayMetadata(selectedTeamMemberRole);
  const location = event.location?.trim();
  const description = event.description?.trim();

  const handleEdit = () => {
    navigation.navigate('EventForm', {
      draft: eventToDraft(event),
      editingExisting: true,
    });
  };

  const handleDelete = () => {
    const teamId = selectedTeam?.id;

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 32,
    marginBottom: 12,
  },
  meta: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 24,
  },
  fieldBlock: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  error: {
    fontSize: 15,
    color: colors.gold,
    marginBottom: 16,
  },
  actions: {
    marginTop: 8,
    gap: 12,
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
