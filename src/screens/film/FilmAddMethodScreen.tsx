import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { cardPresets, palette, spacing, typography } from '../../design-system';
import { FilmStackParamList } from '../../navigation/FilmStack';
import { colors } from '../../theme';
import { createEmptyTeamFilmDraft } from '../../types/teamFilm';

type Props = NativeStackScreenProps<FilmStackParamList, 'FilmAddMethod'>;

export function FilmAddMethodScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.intro}>Choose how to add film to your team library.</Text>

      <Pressable
        style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
        onPress={() => navigation.navigate('FilmUpload')}
      >
        <Text style={styles.optionIcon}>📤</Text>
        <Text style={styles.optionTitle}>Upload Video</Text>
        <Text style={styles.optionText}>Upload mp4, mov, or webm from your device.</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.optionCard, pressed && styles.optionPressed]}
        onPress={() =>
          navigation.navigate('FilmForm', {
            draft: createEmptyTeamFilmDraft(),
            editingExisting: false,
            isUpload: false,
          })
        }
      >
        <Text style={styles.optionIcon}>🔗</Text>
        <Text style={styles.optionTitle}>Paste Video Link</Text>
        <Text style={styles.optionText}>YouTube, Hudl, Google Drive, Dropbox, and more.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  intro: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.sm,
  },
  optionCard: {
    ...cardPresets.default.container,
    marginBottom: 0,
    gap: spacing.sm,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionTitle: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
  },
  optionText: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    lineHeight: typography.body.lineHeight,
  },
});
