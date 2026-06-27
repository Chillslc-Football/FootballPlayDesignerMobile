import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { EventFormFieldError, EventFormFieldLabel } from '../../components/calendar/EventFormFieldLabel';
import { inputPresets, palette, spacing, typography } from '../../design-system';
import { useAuth } from '../../auth/AuthProvider';
import { createTeamFilm } from '../../lib/filmRepository';
import {
  buildFilmStoragePath,
  MAX_FILM_BYTES,
  resolveFilmFileExtension,
  uploadFilmFile,
  deleteFilmFile,
  type FilmUploadPayload,
} from '../../lib/filmStorageRepository';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { useTeam } from '../../team/TeamProvider';
import { colors } from '../../theme';
import { generateFilmId } from '../../types/teamFilm';
import {
  formatFilmFileSize,
  titleFromVideoFilename,
} from '../../utils/filmUploadDisplay';

type Props = NativeStackScreenProps<FilmStackParamList, 'FilmUpload'>;

type SelectedVideo = FilmUploadPayload & {
  sizeBytes: number;
};

export function FilmUploadScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { selectedTeam } = useTeam();

  const [selectedVideo, setSelectedVideo] = useState<SelectedVideo | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const canUpload = title.trim().length > 0 && selectedVideo !== null && !uploading;

  const selectedFileLabel = useMemo(() => {
    if (!selectedVideo) {
      return null;
    }

    return selectedVideo.fileName ?? 'Selected video';
  }, [selectedVideo]);

  const handlePickVideo = async () => {
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Photo library access is required to choose a video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      if (asset.type === 'image') {
        setError('Choose a video file.');
        return;
      }

      const payload: FilmUploadPayload = {
        uri: asset.uri,
        mimeType: asset.mimeType ?? null,
        fileName: asset.fileName ?? null,
      };

      const extension = resolveFilmFileExtension(payload);

      if (!extension) {
        setError('Choose an mp4, mov, or webm video.');
        return;
      }

      let sizeBytes = asset.fileSize;

      if (sizeBytes == null) {
        const response = await fetch(asset.uri);

        if (!response.ok) {
          setError('Could not read the selected video.');
          return;
        }

        const blob = await response.blob();
        sizeBytes = blob.size;
      }

      if (sizeBytes > MAX_FILM_BYTES) {
        setError('Video is too large. Choose a file under 500 MB.');
        return;
      }

      setSelectedVideo({
        ...payload,
        sizeBytes,
      });

      if (title.trim().length === 0) {
        setTitle(titleFromVideoFilename(asset.fileName));
      }
    } catch (pickError) {
      const message =
        pickError instanceof Error ? pickError.message : 'Could not open video picker.';
      setError(message);
    }
  };

  const handleUpload = useCallback(async () => {
    setSubmitAttempted(true);

    const teamId = selectedTeam?.id;

    if (!teamId || !user || !selectedVideo) {
      return;
    }

    if (title.trim().length === 0) {
      return;
    }

    const extension = resolveFilmFileExtension(selectedVideo);

    if (!extension) {
      setError('Choose an mp4, mov, or webm video.');
      return;
    }

    const filmId = generateFilmId();
    const storagePath = buildFilmStoragePath(teamId, filmId, extension);

    setUploading(true);
    setError(null);

    try {
      await uploadFilmFile(storagePath, selectedVideo, extension);

      try {
        await createTeamFilm(teamId, user.id, {
          id: filmId,
          title: title.trim(),
          notes: notes.trim().length > 0 ? notes.trim() : null,
          video_source: storagePath,
        });
      } catch (createError) {
        await deleteFilmFile(storagePath);
        throw createError;
      }

      navigation.popToTop();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Failed to upload team film.';
      setError(message);
    } finally {
      setUploading(false);
    }
  }, [navigation, notes, selectedTeam?.id, selectedVideo, title, user]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={({ pressed }) => [styles.pickButton, pressed && styles.buttonPressed]}
        onPress={handlePickVideo}
        disabled={uploading}
      >
        <Text style={styles.pickButtonText}>
          {selectedVideo ? 'Choose a Different Video' : 'Choose Video'}
        </Text>
      </Pressable>

      {selectedVideo ? (
        <View style={styles.selectedFileCard}>
          <Text style={styles.selectedFileName}>{selectedFileLabel}</Text>
          <Text style={styles.selectedFileMeta}>{formatFilmFileSize(selectedVideo.sizeBytes)}</Text>
        </View>
      ) : (
        <Text style={styles.helperText}>Supported formats: mp4, mov, webm (up to 500 MB).</Text>
      )}

      <EventFormFieldLabel label="Title" required />
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Friday vs Lincoln — Offense"
        placeholderTextColor={palette.text.muted}
        editable={!uploading}
        autoCapitalize="sentences"
      />
      {submitAttempted && title.trim().length === 0 ? (
        <EventFormFieldError message="Title is required." />
      ) : null}

      <EventFormFieldLabel label="Notes" />
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional coach notes..."
        placeholderTextColor={palette.text.muted}
        editable={!uploading}
        multiline
        textAlignVertical="top"
      />

      {uploading ? (
        <View style={styles.uploadingBlock}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.uploadingText}>Uploading… stay on this screen until finished.</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.uploadButton,
          (!canUpload || pressed) && styles.uploadButtonDisabled,
        ]}
        onPress={handleUpload}
        disabled={!canUpload}
      >
        {uploading ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Film</Text>
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
  pickButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: spacing.md,
  },
  pickButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  selectedFileCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectedFileName: {
    ...typography.body,
    color: palette.text.primary,
    marginBottom: spacing.xs,
  },
  selectedFileMeta: {
    ...typography.bodySmall,
    color: palette.text.muted,
  },
  helperText: {
    ...typography.bodySmall,
    color: palette.text.muted,
    marginBottom: spacing.lg,
    lineHeight: typography.body.lineHeight,
  },
  input: {
    ...inputPresets.default.field,
    marginBottom: spacing.sm,
  },
  notesInput: {
    ...inputPresets.multiline.field,
    marginBottom: spacing.lg,
  },
  uploadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  uploadingText: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    flex: 1,
    lineHeight: typography.body.lineHeight,
  },
  error: {
    ...typography.bodySmall,
    color: palette.status.error,
    marginBottom: spacing.lg,
  },
  uploadButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
