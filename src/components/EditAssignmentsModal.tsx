import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../theme';
import { ASSIGNMENT_SLOTS, buildEditablePlayerNotes } from '../utils/playerNotes';
import { resolvePlayerDisplayLabel } from '../utils/playDisplay';
import type { PlayAssignment } from '../types/play';

type EditAssignmentsModalProps = {
  visible: boolean;
  assignments: PlayAssignment[];
  storedPlayerNotes: Record<string, string> | undefined;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (playerNotes: Record<string, string>) => void;
};

export function EditAssignmentsModal({
  visible,
  assignments,
  storedPlayerNotes,
  saving,
  error,
  onCancel,
  onSave,
}: EditAssignmentsModalProps) {
  const initialValues = useMemo(() => {
    const base = buildEditablePlayerNotes(storedPlayerNotes);
    for (const assignment of assignments) {
      base[assignment.position] = assignment.assignment;
    }
    return base;
  }, [assignments, storedPlayerNotes]);

  const editableSlots = useMemo(() => {
    const slots = new Set<string>(ASSIGNMENT_SLOTS);

    for (const assignment of assignments) {
      slots.add(assignment.position);
    }

    if (storedPlayerNotes) {
      for (const key of Object.keys(storedPlayerNotes)) {
        slots.add(key);
      }
    }

    return [...slots].sort((left, right) => {
      const leftIndex = ASSIGNMENT_SLOTS.indexOf(left as (typeof ASSIGNMENT_SLOTS)[number]);
      const rightIndex = ASSIGNMENT_SLOTS.indexOf(right as (typeof ASSIGNMENT_SLOTS)[number]);

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });
  }, [assignments, storedPlayerNotes]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  useEffect(() => {
    if (visible) {
      setValues(initialValues);
    }
  }, [visible, initialValues]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Edit Assignments</Text>
          <Text style={styles.subtitle}>Update assignment text for each position slot.</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {editableSlots.map((slot) => (
              <View key={slot} style={styles.row}>
                <Text style={styles.slotLabel}>
                  {resolvePlayerDisplayLabel(slot, slot)} ({slot})
                </Text>
                <TextInput
                  style={styles.input}
                  value={values[slot] ?? ''}
                  onChangeText={(text) =>
                    setValues((current) => ({
                      ...current,
                      [slot]: text,
                    }))
                  }
                  placeholder="Assignment notes..."
                  placeholderTextColor={colors.textMuted}
                  editable={!saving}
                  multiline
                />
              </View>
            ))}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
              onPress={onCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.saveButton,
                (pressed || saving) && styles.pressed,
              ]}
              onPress={() => onSave(values)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  scroll: {
    maxHeight: 360,
    marginBottom: 12,
  },
  row: {
    marginBottom: 14,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 6,
  },
  input: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: {
    color: '#F87171',
    fontSize: 14,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  saveButton: {
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
