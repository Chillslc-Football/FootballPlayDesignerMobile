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
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EventFormFieldError, EventFormFieldLabel } from '../../components/calendar/EventFormFieldLabel';
import { inputPresets, palette, spacing, typography } from '../../design-system';
import { useAuth } from '../../auth/AuthProvider';
import { createTeamFilm, updateTeamFilm } from '../../lib/filmRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import {
  areRequiredTeamFilmFormFieldsComplete,
  validateTeamFilmForm,
} from '../../utils/teamFilmDisplay';

type Props = NativeStackScreenProps<FilmStackParamList, 'FilmForm'>;

export function FilmFormScreen({ navigation, route }: Props) {
  const { draft, editingExisting, isUpload = false } = route.params;
  const { user } = useAuth();
  const { selectedTeam } = useTeam();

  const [title, setTitle] = useState(draft.title);
  const [videoSource, setVideoSource] = useState(draft.video_source);
  const [notes, setNotes] = useState(draft.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validationError = useMemo(() => {
    if (isUpload) {
      return title.trim().length === 0 ? 'Title is required.' : null;
    }

    return validateTeamFilmForm({ title, videoSource });
  }, [isUpload, title, videoSource]);

  const requiredComplete = isUpload
    ? title.trim().length > 0
    : areRequiredTeamFilmFormFieldsComplete({ title, videoSource });
  const canSave = requiredComplete && validationError === null && !saving;
  const showRequiredErrors = submitAttempted;

  const handleSave = useCallback(async () => {
    setSubmitAttempted(true);

    const teamId = selectedTeam?.id;

    if (!teamId || !user) {
      return;
    }

    const formError = isUpload
      ? title.trim().length === 0
        ? 'Title is required.'
        : null
      : validateTeamFilmForm({ title, videoSource });

    if (formError) {
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);

    const nextDraft = {
      id: draft.id,
      title,
      video_source: videoSource.trim(),
      notes: notes.trim().length > 0 ? notes.trim() : null,
    };

    try {
      if (editingExisting) {
        await updateTeamFilm(teamId, nextDraft);
      } else {
        await createTeamFilm(teamId, user.id, nextDraft);
      }

      navigation.popToTop();
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : 'Failed to save team film.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [
    draft.id,
    editingExisting,
    isUpload,
    navigation,
    notes,
    selectedTeam?.id,
    title,
    user,
    videoSource,
  ]);

  useLayoutEffect(() => {
    const actionLabel = editingExisting ? 'Save' : 'Add';

    navigation.setOptions({
      title: editingExisting ? 'Edit Film' : 'Paste Video Link',
      headerRight: () => (
        <Pressable
          style={({ pressed }) => [styles.headerAction, pressed && styles.headerActionPressed]}
          onPress={handleSave}
          disabled={!canSave}
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
      <EventFormFieldLabel label="Title" required />
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Friday vs Lincoln — Offense"
        placeholderTextColor={palette.text.muted}
        editable={!saving}
        autoCapitalize="sentences"
      />
      {showRequiredErrors && title.trim().length === 0 ? (
        <EventFormFieldError message="Title is required." />
      ) : null}

      {!isUpload ? (
        <>
          <EventFormFieldLabel label="Video link" required />
          <TextInput
            style={styles.input}
            value={videoSource}
            onChangeText={setVideoSource}
            placeholder="https://..."
            placeholderTextColor={palette.text.muted}
            editable={!saving}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
          />
          <Text style={styles.helperText}>
            Paste a link from YouTube, Hudl, Google Drive, Vimeo, or Dropbox.
          </Text>
          {showRequiredErrors && validationError ? (
            <EventFormFieldError message={validationError} />
          ) : null}
        </>
      ) : (
        <Text style={styles.helperText}>
          The uploaded video file stays the same. You can edit the title and notes here.
        </Text>
      )}

      <EventFormFieldLabel label="Notes" />
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional coach notes..."
        placeholderTextColor={palette.text.muted}
        editable={!saving}
        multiline
        textAlignVertical="top"
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
            {editingExisting ? 'Save Changes' : 'Add Film'}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  input: {
    ...inputPresets.default.field,
    marginBottom: spacing.sm,
  },
  notesInput: {
    ...inputPresets.multiline.field,
    marginBottom: spacing.lg,
  },
  helperText: {
    ...typography.bodySmall,
    color: palette.text.muted,
    marginBottom: spacing.lg,
    lineHeight: typography.body.lineHeight,
  },
  error: {
    ...typography.bodySmall,
    color: palette.status.error,
    marginBottom: spacing.lg,
  },
  saveButton: {
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
  headerAction: {
    minWidth: 56,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    marginRight: Platform.OS === 'android' ? spacing.xs : 0,
  },
  headerActionPressed: {
    opacity: 0.85,
  },
  headerActionText: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: colors.accent,
  },
  headerActionTextDisabled: {
    opacity: 0.45,
  },
});
