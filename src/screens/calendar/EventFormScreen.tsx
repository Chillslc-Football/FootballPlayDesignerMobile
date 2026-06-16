import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { CalendarStackParamList } from '../../navigation/CalendarStack';
import { createTeamEvent, updateTeamEvent } from '../../lib/teamEventRepository';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import {
  draftToFormValues,
  formValuesToDraft,
  validateTeamEventForm,
} from '../../utils/teamEventDisplay';

type Props = NativeStackScreenProps<CalendarStackParamList, 'EventForm'>;

export function EventFormScreen({ navigation, route }: Props) {
  const { draft, editingExisting } = route.params;
  const { selectedTeam } = useTeam();
  const initialValues = draftToFormValues(draft);

  const [title, setTitle] = useState(initialValues.title);
  const [date, setDate] = useState(initialValues.date);
  const [startTime, setStartTime] = useState(initialValues.startTime);
  const [endTime, setEndTime] = useState(initialValues.endTime);
  const [location, setLocation] = useState(initialValues.location);
  const [description, setDescription] = useState(initialValues.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = validateTeamEventForm({ title, date, startTime, endTime });
  const canSave = validationError === null && !saving;

  const handleSave = async () => {
    const teamId = selectedTeam?.id;

    if (!teamId) {
      return;
    }

    const formError = validateTeamEventForm({ title, date, startTime, endTime });

    if (formError) {
      setError(formError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const nextDraft = formValuesToDraft(draft.id, {
        title,
        date,
        startTime,
        endTime,
        location,
        description,
      });

      if (editingExisting) {
        await updateTeamEvent(teamId, nextDraft);
      } else {
        await createTeamEvent(teamId, nextDraft);
      }

      navigation.popToTop();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Failed to save team event.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.fieldLabel}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Event title"
        placeholderTextColor={colors.textMuted}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Start time</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={setStartTime}
        placeholder="HH:MM"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>End time</Text>
      <TextInput
        style={styles.input}
        value={endTime}
        onChangeText={setEndTime}
        placeholder="HH:MM"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Location</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="Optional location"
        placeholderTextColor={colors.textMuted}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.descriptionInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        editable={!saving}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          (!canSave || pressed) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!canSave}
      >
        {saving ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>
            {editingExisting ? 'Save Changes' : 'Create Event'}
          </Text>
        )}
      </Pressable>
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  descriptionInput: {
    minHeight: 120,
  },
  error: {
    fontSize: 15,
    color: colors.gold,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
});
