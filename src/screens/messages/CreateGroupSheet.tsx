import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { listDmEligibleMembers } from '../../lib/teamMessageRepository';
import { colors } from '../../theme';
import type { DirectMessageEligibleMember } from '../../types/teamMessage';
import type { TeamRole } from '../../types/team';
import { resolveProfileDisplayName } from '../../utils/profileDisplay';
import { formatTeamRole } from '../../utils/roleLabels';

type CreateGroupSheetProps = {
  teamId: string;
  creating?: boolean;
  onCreateGroup: (name: string, memberIds: string[]) => Promise<void>;
  onClose: () => void;
};

function memberLabel(member: DirectMessageEligibleMember): string {
  return resolveProfileDisplayName(member) ?? 'Team member';
}

function memberMatchesQuery(member: DirectMessageEligibleMember, normalizedQuery: string): boolean {
  const label = memberLabel(member).toLowerCase();
  const displayName = member.display_name?.trim().toLowerCase() ?? '';
  const role = formatTeamRole(member.role as TeamRole).toLowerCase();

  return label.includes(normalizedQuery) || displayName.includes(normalizedQuery) || role.includes(normalizedQuery);
}

export function CreateGroupSheet({
  teamId,
  creating = false,
  onCreateGroup,
  onClose,
}: CreateGroupSheetProps) {
  const [members, setMembers] = useState<DirectMessageEligibleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(() => new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedTeamIdRef = useRef(teamId);

  selectedTeamIdRef.current = teamId;

  const loadMembers = useCallback(async (activeTeamId: string) => {
    setLoading(true);
    setError(null);

    try {
      const loadedMembers = await listDmEligibleMembers(activeTeamId);

      if (selectedTeamIdRef.current !== activeTeamId) {
        return;
      }

      setMembers(loadedMembers);
    } catch (loadError) {
      if (selectedTeamIdRef.current !== activeTeamId) {
        return;
      }

      setMembers([]);
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team members.';
      setError(message);
    } finally {
      if (selectedTeamIdRef.current === activeTeamId) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMembers(teamId);
  }, [loadMembers, teamId]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return members;
    }

    return members.filter((member) => memberMatchesQuery(member, normalizedQuery));
  }, [members, query]);

  const trimmedGroupName = groupName.trim();
  const selectedMemberIdList = useMemo(
    () => [...selectedMemberIds],
    [selectedMemberIds],
  );
  const canCreate =
    trimmedGroupName.length > 0 && selectedMemberIds.size > 0 && !creating && !loading;

  const toggleMember = (userId: string) => {
    setSubmitError(null);
    setSelectedMemberIds((current) => {
      const next = new Set(current);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const handleCreate = async () => {
    if (__DEV__) {
      console.log('[CreateGroupSheet] submit pressed', {
        groupName: trimmedGroupName,
        selectedMemberIds: selectedMemberIdList,
        canCreate,
        creating,
        loading,
      });
    }

    if (!canCreate) {
      if (__DEV__) {
        console.log('[CreateGroupSheet] submit blocked by validation', { canCreate });
      }
      return;
    }

    setSubmitError(null);

    try {
      await onCreateGroup(trimmedGroupName, selectedMemberIdList);
    } catch (submitFailure) {
      const message =
        submitFailure instanceof Error ? submitFailure.message : 'Failed to create group.';
      setSubmitError(message);

      if (__DEV__) {
        console.log('[CreateGroupSheet] submit failed', message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Group</Text>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
          disabled={creating}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.nameInput}
        value={groupName}
        onChangeText={setGroupName}
        placeholder="Group name"
        placeholderTextColor={colors.textMuted}
        editable={!creating}
        maxLength={80}
      />

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search team members..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!creating}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      {loading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.statusText}>Loading team members...</Text>
        </View>
      ) : filteredMembers.length === 0 ? (
        <Text style={styles.statusText}>No team members found.</Text>
      ) : (
        <ScrollView
          style={styles.memberList}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {filteredMembers.map((member) => {
            const selected = selectedMemberIds.has(member.user_id);

            return (
              <Pressable
                key={member.user_id}
                style={({ pressed }) => [
                  styles.memberRow,
                  selected && styles.memberRowSelected,
                  pressed && styles.memberRowPressed,
                ]}
                onPress={() => toggleMember(member.user_id)}
                disabled={creating}
              >
                <View style={styles.memberMain}>
                  <Text style={styles.memberName}>{memberLabel(member)}</Text>
                  <Text style={styles.memberRole}>{formatTeamRole(member.role as TeamRole)}</Text>
                </View>
                <Text style={[styles.memberCheck, selected && styles.memberCheckSelected]}>
                  {selected ? '✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          !canCreate && styles.primaryButtonDisabled,
          canCreate && pressed && styles.primaryButtonPressed,
        ]}
        onPress={() => {
          void handleCreate();
        }}
        disabled={!canCreate}
      >
        {creating ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={styles.primaryButtonText}>Create Group</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  nameInput: {
    minHeight: 44,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
  },
  searchInput: {
    minHeight: 44,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.gold,
    paddingVertical: 4,
  },
  memberList: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  memberRowSelected: {
    backgroundColor: colors.card,
  },
  memberRowPressed: {
    opacity: 0.85,
  },
  memberMain: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  memberRole: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  memberCheck: {
    width: 24,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  memberCheckSelected: {
    color: colors.accent,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
});
