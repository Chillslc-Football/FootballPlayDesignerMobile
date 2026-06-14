import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookContent } from '../../components/PlaybookContent';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { usePlaybook } from '../../playbook/PlaybookProvider';
import type { PlayDetail } from '../../types/play';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'PlayDetail'>;

export function PlayDetailScreen({ route }: Props) {
  const { playId, categoryName } = route.params;
  const { loadPlayDetail } = usePlaybook();
  const [play, setPlay] = useState<PlayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const loadedPlay = await loadPlayDetail(playId);

        if (!cancelled) {
          setPlay(loadedPlay);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : 'Failed to load play.';
          setError(message);
          setPlay(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [loadPlayDetail, playId]);

  if (loading) {
    return (
      <PlaybookContent>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </PlaybookContent>
    );
  }

  if (error || !play) {
    return (
      <PlaybookContent>
        <Text style={styles.emptyText}>{error ?? 'This play could not be loaded.'}</Text>
      </PlaybookContent>
    );
  }

  const displayCategory = play.categories.includes(categoryName)
    ? categoryName
    : play.categories.join(', ') || categoryName;

  return (
    <PlaybookContent>
      <Text style={styles.metaLabel}>Category</Text>
      <Text style={styles.metaValue}>{displayCategory}</Text>
      <Text style={styles.metaLabel}>Formation</Text>
      <Text style={styles.metaValue}>{play.formationName}</Text>

      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderIcon}>🏟️</Text>
        <Text style={styles.imagePlaceholderText}>Play diagram coming soon</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Text style={styles.sectionBody}>
          {play.notes.trim().length > 0 ? play.notes : 'No notes yet.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assignments</Text>
        {play.assignments.length === 0 ? (
          <Text style={styles.sectionBody}>No assignments yet.</Text>
        ) : (
          play.assignments.map((assignment, index) => (
            <View
              key={`${assignment.position}-${index}`}
              style={[styles.assignmentRow, index > 0 && styles.assignmentRowBorder]}
            >
              <Text style={styles.assignmentPosition}>{assignment.position}</Text>
              <Text style={styles.assignmentText}>{assignment.assignment}</Text>
            </View>
          ))
        )}
      </View>
    </PlaybookContent>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
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
