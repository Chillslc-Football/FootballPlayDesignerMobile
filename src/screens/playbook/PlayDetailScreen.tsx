import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookContent } from '../../components/PlaybookContent';
import { getPlayById } from '../../data/playbookData';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'PlayDetail'>;

export function PlayDetailScreen({ route }: Props) {
  const play = getPlayById(route.params.playId);

  if (!play) {
    return (
      <PlaybookContent>
        <Text style={styles.emptyText}>This play could not be loaded.</Text>
      </PlaybookContent>
    );
  }

  return (
    <PlaybookContent>
      <Text style={styles.formation}>{play.formation}</Text>

      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderIcon}>🏟️</Text>
        <Text style={styles.imagePlaceholderText}>Play diagram coming soon</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.sectionBody}>{play.notes}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignments</Text>
        {play.assignments.map((assignment, index) => (
          <View
            key={`${assignment.position}-${index}`}
            style={[styles.assignmentRow, index > 0 && styles.assignmentRowBorder]}
          >
            <Text style={styles.assignmentPosition}>{assignment.position}</Text>
            <Text style={styles.assignmentText}>{assignment.assignment}</Text>
          </View>
        ))}
      </View>
    </PlaybookContent>
  );
}

const styles = StyleSheet.create({
  formation: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imagePlaceholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  assignmentRow: {
    paddingTop: 12,
  },
  assignmentRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 12,
  },
  assignmentPosition: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
