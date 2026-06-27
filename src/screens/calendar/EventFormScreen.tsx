import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EventFormFieldError, EventFormFieldLabel } from '../../components/calendar/EventFormFieldLabel';
import { EventFormPickerField } from '../../components/calendar/EventFormPickerField';
import { EventReminderPickerModal } from '../../components/calendar/EventReminderPickerModal';
import { inputPresets, palette, radius, spacing, typography } from '../../design-system';
import { CalendarStackParamList } from '../../navigation/CalendarStack';
import { createTeamEvent, updateTeamEvent } from '../../lib/teamEventRepository';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import {
  areRequiredEventFormFieldsComplete,
  dateFromLocalDateAndTime,
  dateFromLocalDateString,
  draftToFormValues,
  formatFormDateDisplay,
  formatFormTimeDisplay,
  formatLocalDate,
  formatLocalTime,
  formValuesToDraft,
  getEventFormFieldErrors,
  resolveFormEndTime,
  validateTeamEventForm,
} from '../../utils/teamEventDisplay';
import {
  getTeamEventReminderOptionLabel,
  type TeamEventReminderOptionValue,
} from '../../utils/teamEventReminderDisplay';

type Props = NativeStackScreenProps<CalendarStackParamList, 'EventForm'>;

type ActivePicker = 'date' | 'start' | 'end' | null;

export function EventFormScreen({ navigation, route }: Props) {
  const { draft, editingExisting } = route.params;
  const { selectedTeam } = useTeam();
  const initialValues = draftToFormValues(draft);

  const [title, setTitle] = useState(initialValues.title);
  const [date, setDate] = useState(initialValues.date);
  const [startTime, setStartTime] = useState(initialValues.startTime);
  const [endTime, setEndTime] = useState(editingExisting ? initialValues.endTime : '');
  const [location, setLocation] = useState(initialValues.location);
  const [description, setDescription] = useState(initialValues.description);
  const [reminderOption, setReminderOption] = useState<TeamEventReminderOptionValue>(
    initialValues.reminderOption,
  );
  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);

  const fieldErrors = useMemo(
    () => getEventFormFieldErrors({ title, date, startTime, endTime }),
    [title, date, startTime, endTime],
  );

  const requiredComplete = areRequiredEventFormFieldsComplete({ title, date, startTime });
  const validationError = validateTeamEventForm({ title, date, startTime, endTime });
  const canSave = requiredComplete && validationError === null && !saving;

  const showRequiredErrors = submitAttempted;

  const pickerValue = useMemo(() => {
    if (activePicker === 'date') {
      return dateFromLocalDateString(date) ?? new Date();
    }

    if (activePicker === 'start') {
      return dateFromLocalDateAndTime(date, startTime) ?? new Date();
    }

    if (activePicker === 'end') {
      const resolvedEndTime = resolveFormEndTime(date, startTime, endTime);
      return dateFromLocalDateAndTime(date, resolvedEndTime) ?? new Date();
    }

    return new Date();
  }, [activePicker, date, endTime, startTime]);

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    if (activePicker === 'date') {
      setDate(formatLocalDate(selectedDate));
      return;
    }

    if (activePicker === 'start') {
      setStartTime(formatLocalTime(selectedDate));
      return;
    }

    if (activePicker === 'end') {
      setEndTime(formatLocalTime(selectedDate));
    }
  };

  const handleSave = useCallback(async () => {
    setSubmitAttempted(true);

    const teamId = selectedTeam?.id;

    if (!teamId) {
      return;
    }

    const formError = validateTeamEventForm({ title, date, startTime, endTime });

    if (formError) {
      setError(null);
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
        reminderOption,
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
  }, [
    date,
    description,
    draft.id,
    editingExisting,
    endTime,
    location,
    navigation,
    reminderOption,
    selectedTeam?.id,
    startTime,
    title,
  ]);

  useLayoutEffect(() => {
    const actionLabel = editingExisting ? 'Save' : 'Create';

    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={({ pressed }) => [
            styles.headerAction,
            (!canSave || pressed) && styles.headerActionPressed,
          ]}
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          {saving ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={[styles.headerActionText, !canSave && styles.headerActionTextDisabled]}>
              {actionLabel}
            </Text>
          )}
        </Pressable>
      ),
    });
  }, [canSave, editingExisting, handleSave, navigation, saving]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.field}>
        <EventFormFieldLabel label="Event Title" required />
        <TextInput
          style={[styles.input, fieldErrors.title && showRequiredErrors && styles.inputError]}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={inputPresets.default.placeholderColor}
          editable={!saving}
        />
        <EventFormFieldError message={showRequiredErrors ? fieldErrors.title : null} />
      </View>

      <EventFormPickerField
        label="Date"
        value={formatFormDateDisplay(date)}
        placeholder="Select date"
        onPress={() => setActivePicker('date')}
        disabled={saving}
        required
        error={showRequiredErrors ? fieldErrors.date : null}
      />

      <EventFormPickerField
        label="Start Time"
        value={formatFormTimeDisplay(startTime)}
        placeholder="Select start time"
        onPress={() => setActivePicker('start')}
        disabled={saving}
        required
        error={showRequiredErrors ? fieldErrors.startTime : null}
      />

      <EventFormPickerField
        label="End Time"
        value={formatFormTimeDisplay(endTime)}
        placeholder="No end time selected"
        onPress={() => setActivePicker('end')}
        disabled={saving}
        optional
        error={fieldErrors.endTime}
      />

      {endTime ? (
        <Pressable
          style={({ pressed }) => [styles.clearEndButton, pressed && styles.clearEndButtonPressed]}
          onPress={() => setEndTime('')}
          disabled={saving}
        >
          <Text style={styles.clearEndButtonText}>Clear end time</Text>
        </Pressable>
      ) : null}

      {activePicker ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={pickerValue}
            mode={activePicker === 'date' ? 'date' : 'time'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handlePickerChange}
            is24Hour={false}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              style={({ pressed }) => [styles.pickerDoneButton, pressed && styles.pickerDonePressed]}
              onPress={() => setActivePicker(null)}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <EventFormPickerField
        label="Reminder"
        value={getTeamEventReminderOptionLabel(reminderOption)}
        placeholder="Select reminder"
        onPress={() => setReminderPickerVisible(true)}
        disabled={saving}
      />

      <EventReminderPickerModal
        visible={reminderPickerVisible}
        selectedValue={reminderOption}
        onSelect={setReminderOption}
        onClose={() => setReminderPickerVisible(false)}
      />

      <View style={styles.field}>
        <EventFormFieldLabel label="Location" optional />
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Add a location"
          placeholderTextColor={inputPresets.default.placeholderColor}
          editable={!saving}
        />
      </View>

      <View style={styles.field}>
        <EventFormFieldLabel label="Description" optional />
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add details about this event"
          placeholderTextColor={inputPresets.default.placeholderColor}
          multiline
          textAlignVertical="top"
          editable={!saving}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  field: {
    marginBottom: spacing.lg,
  },
  input: {
    ...inputPresets.default.field,
    marginBottom: 0,
  },
  inputError: {
    borderColor: palette.status.error,
  },
  descriptionInput: {
    ...inputPresets.multiline.field,
    marginBottom: 0,
  },
  clearEndButton: {
    alignSelf: 'flex-start',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  clearEndButtonPressed: {
    opacity: 0.85,
  },
  clearEndButtonText: {
    ...typography.bodySmall,
    color: palette.accent.default,
    fontWeight: typography.subheading.fontWeight,
  },
  pickerContainer: {
    backgroundColor: palette.background.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  pickerDoneButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  pickerDonePressed: {
    opacity: 0.85,
  },
  pickerDoneText: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.accent.default,
  },
  error: {
    ...typography.bodySmall,
    color: palette.status.error,
    marginBottom: spacing.lg,
  },
  headerAction: {
    minWidth: 56,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerActionPressed: {
    opacity: 0.85,
  },
  headerActionText: {
    ...typography.bodySmall,
    fontWeight: typography.heading.fontWeight,
    color: colors.accent,
  },
  headerActionTextDisabled: {
    opacity: 0.45,
  },
});
