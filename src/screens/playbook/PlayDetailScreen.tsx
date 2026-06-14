import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EditAssignmentsModal } from '../../components/EditAssignmentsModal';
import { EditNotesModal } from '../../components/EditNotesModal';
import { PlaybookContent } from '../../components/PlaybookContent';
import { ReadOnlyPlayDiagram } from '../../playDiagram/ReadOnlyPlayDiagram';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { usePlaybook } from '../../playbook/PlaybookProvider';
import { useTeam } from '../../team/TeamProvider';
import type { PlayDetail } from '../../types/play';
import { colors } from '../../theme';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatCategories, formatPlayType } from '../../utils/playDisplay';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'PlayDetail'>;

export function PlayDetailScreen({ route }: Props) {
  const { playId } = route.params;
  const { selectedTeamMemberRole } = useTeam();
  const { loadPlayDetail, savePlayNotes, savePlayAssignments } = usePlaybook();
  const [play, setPlay] = useState<PlayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [assignmentsModalVisible, setAssignmentsModalVisible] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canEdit = canEditPlayMetadata(selectedTeamMemberRole);

  const reloadPlay = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedPlay = await loadPlayDetail(playId);
      setPlay(loadedPlay);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load play.';
      setError(message);
      setPlay(null);
    } finally {
      setLoading(false);
    }
  }, [loadPlayDetail, playId]);

  useEffect(() => {
    void reloadPlay();
  }, [reloadPlay]);

  const handleSaveNotes = async (notes: string) => {
    setSavingNotes(true);
    setSaveError(null);

    const result = await savePlayNotes(playId, notes);

    if (result.error) {
      setSaveError(result.error);
      setSavingNotes(false);
      return;
    }

    setNotesModalVisible(false);
    setSavingNotes(false);
    await reloadPlay();
  };

  const handleSaveAssignments = async (playerNotes: Record<string, string>) => {
    setSavingAssignments(true);
    setSaveError(null);

    const result = await savePlayAssignments(playId, playerNotes);

    if (result.error) {
      setSaveError(result.error);
      setSavingAssignments(false);
      return;
    }

    setAssignmentsModalVisible(false);
    setSavingAssignments(false);
    await reloadPlay();
  };

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

  const schemeTitle = play.schemeKind === 'front' ? 'Front' : 'Formation';

  return (
    <PlaybookContent>
      <View style={styles.metaSection}>
        <Text style={styles.metaLabel}>Play Type</Text>
        <Text style={styles.metaValue}>{formatPlayType(play.playType)}</Text>

        <Text style={styles.metaLabel}>Categories</Text>
        <Text style={styles.metaValue}>{formatCategories(play.categories)}</Text>

        <Text style={styles.metaLabel}>{schemeTitle}</Text>
        <Text style={styles.metaValue}>{play.schemeLabel}</Text>
      </View>

      {play.diagramPlay ? (
        <ReadOnlyPlayDiagram play={play.diagramPlay} />
      ) : (
        <View style={styles.diagramUnavailable}>
          <Text style={styles.diagramUnavailableText}>Diagram unavailable for this play.</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {canEdit ? (
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
              onPress={() => {
                setSaveError(null);
                setNotesModalVisible(true);
              }}
            >
              <Text style={styles.editButtonText}>Edit Notes</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.sectionBody}>
          {play.notes.length > 0 ? play.notes : 'No notes yet.'}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Player Assignments</Text>
          {canEdit ? (
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
              onPress={() => {
                setSaveError(null);
                setAssignmentsModalVisible(true);
              }}
            >
              <Text style={styles.editButtonText}>Edit Assignments</Text>
            </Pressable>
          ) : null}
        </View>
        {play.assignments.length === 0 ? (
          <Text style={styles.sectionBody}>No player assignments yet.</Text>
        ) : (
          play.assignments.map((assignment, index) => (
            <View
              key={`${assignment.position}-${index}`}
              style={[styles.assignmentRow, index > 0 && styles.assignmentRowBorder]}
            >
              <Text style={styles.assignmentPosition}>{assignment.displayLabel}</Text>
              {assignment.displayLabel !== assignment.position ? (
                <Text style={styles.assignmentSlot}>Slot: {assignment.position}</Text>
              ) : null}
              <Text style={styles.assignmentText}>{assignment.assignment}</Text>
            </View>
          ))
        )}
      </View>

      <EditNotesModal
        visible={notesModalVisible}
        initialNotes={play.notes}
        saving={savingNotes}
        error={saveError}
        onCancel={() => {
          if (!savingNotes) {
            setSaveError(null);
            setNotesModalVisible(false);
          }
        }}
        onSave={handleSaveNotes}
      />

      <EditAssignmentsModal
        visible={assignmentsModalVisible}
        assignments={play.assignments}
        storedPlayerNotes={play.playerNotes}
        saving={savingAssignments}
        error={saveError}
        onCancel={() => {
          if (!savingAssignments) {
            setSaveError(null);
            setAssignmentsModalVisible(false);
          }
        }}
        onSave={handleSaveAssignments}
      />
    </PlaybookContent>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  metaSection: {
    marginBottom: 4,
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
  diagramUnavailable: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  diagramUnavailableText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
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
  assignmentSlot: {
    fontSize: 12,
    color: colors.textMuted,
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
