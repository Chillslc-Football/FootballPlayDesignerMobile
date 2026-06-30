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
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme';
import type { DirectMessageEligibleMember, TeamMessageThreadKind } from '../../types/teamMessage';
import type { ProfileNameFields } from '../../types/profile';
import type { TeamRole } from '../../types/team';
import { resolveProfileDisplayName } from '../../utils/profileDisplay';
import { formatTeamRole } from '../../utils/roleLabels';
import {
  groupTargetMatchesQuery,
  sortComposePickerGroupTargets,
  validateComposeSelection,
} from '../../utils/teamMessageDisplay';

export type ComposeGroupTarget = {
  kind: 'group';
  id: string;
  title: string;
  threadKind: TeamMessageThreadKind;
};

export type ComposePersonTarget = {
  kind: 'person';
  userId: string;
  title: string;
  role: string;
  member: DirectMessageEligibleMember;
};

export type ComposeTarget = ComposeGroupTarget | ComposePersonTarget;

type NewMessagePickerProps = {
  teamId: string;
  groupTargets: ComposeGroupTarget[];
  continuing?: boolean;
  onContinue: (selected: ComposeTarget[]) => Promise<void>;
  onClose: () => void;
};

type EnrichedMember = DirectMessageEligibleMember & {
  email: string | null;
};

type ProfileRow = ProfileNameFields & {
  id: string;
};

function memberLabel(member: EnrichedMember): string {
  return resolveProfileDisplayName(member) ?? 'Team member';
}

function memberMatchesQuery(member: EnrichedMember, normalizedQuery: string): boolean {
  const label = memberLabel(member).toLowerCase();
  const displayName = member.display_name?.trim().toLowerCase() ?? '';
  const email = member.email?.trim().toLowerCase() ?? '';
  const role = formatTeamRole(member.role as TeamRole).toLowerCase();

  return (
    label.includes(normalizedQuery) ||
    displayName.includes(normalizedQuery) ||
    email.includes(normalizedQuery) ||
    role.includes(normalizedQuery)
  );
}

function composeTargetKey(target: ComposeTarget): string {
  return target.kind === 'group' ? `group:${target.id}` : `person:${target.userId}`;
}

function toPersonTarget(member: EnrichedMember): ComposePersonTarget {
  return {
    kind: 'person',
    userId: member.user_id,
    title: memberLabel(member),
    role: formatTeamRole(member.role as TeamRole),
    member: {
      user_id: member.user_id,
      role: member.role,
      display_name: member.display_name,
    },
  };
}

async function enrichMembersWithProfiles(
  members: DirectMessageEligibleMember[],
): Promise<EnrichedMember[]> {
  if (members.length === 0) {
    return [];
  }

  const userIds = members.map((member) => member.user_id);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', userIds);

  if (error) {
    return members.map((member) => ({
      ...member,
      email: null,
    }));
  }

  const profileByUserId = new Map<string, ProfileRow>();
  for (const row of (data ?? []) as ProfileRow[]) {
    profileByUserId.set(row.id, row);
  }

  return members.map((member) => {
    const profile = profileByUserId.get(member.user_id);

    return {
      user_id: member.user_id,
      role: member.role,
      display_name: profile?.display_name ?? member.display_name,
      email: profile?.email ?? null,
    };
  });
}

export function NewMessagePicker({
  teamId,
  groupTargets,
  continuing = false,
  onContinue,
  onClose,
}: NewMessagePickerProps) {
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedTargetKeys, setSelectedTargetKeys] = useState<Set<string>>(() => new Set());
  const selectedTeamIdRef = useRef(teamId);

  selectedTeamIdRef.current = teamId;

  const loadMembers = useCallback(async (activeTeamId: string) => {
    setLoadingMembers(true);
    setError(null);

    try {
      const loadedMembers = await listDmEligibleMembers(activeTeamId);

      if (selectedTeamIdRef.current !== activeTeamId) {
        return;
      }

      const enrichedMembers = await enrichMembersWithProfiles(loadedMembers);

      if (selectedTeamIdRef.current !== activeTeamId) {
        return;
      }

      setMembers(enrichedMembers);
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
        setLoadingMembers(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMembers(teamId);
  }, [loadMembers, teamId]);

  const allTargets = useMemo((): ComposeTarget[] => {
    const sortedGroups = sortComposePickerGroupTargets(groupTargets);
    const people = [...members]
      .sort((left, right) =>
        memberLabel(left).localeCompare(memberLabel(right), undefined, { sensitivity: 'base' }),
      )
      .map(toPersonTarget);

    return [...sortedGroups, ...people];
  }, [groupTargets, members]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredTargets = useMemo(() => {
    if (!normalizedQuery) {
      return allTargets;
    }

    return allTargets.filter((target) => {
      if (target.kind === 'group') {
        return groupTargetMatchesQuery(target, normalizedQuery);
      }

      const member = members.find((item) => item.user_id === target.userId);

      return member ? memberMatchesQuery(member, normalizedQuery) : false;
    });
  }, [allTargets, members, normalizedQuery]);

  const selectedTargets = useMemo(
    () => allTargets.filter((target) => selectedTargetKeys.has(composeTargetKey(target))),
    [allTargets, selectedTargetKeys],
  );

  const selectionValidationError = validateComposeSelection(selectedTargets);
  const canContinue =
    selectedTargets.length > 0 && selectionValidationError == null && !continuing && !loadingMembers;

  const toggleTarget = (target: ComposeTarget) => {
    if (continuing) {
      return;
    }

    setSubmitError(null);
    const key = composeTargetKey(target);

    setSelectedTargetKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const handleContinue = async () => {
    if (!canContinue) {
      if (selectionValidationError) {
        setSubmitError(selectionValidationError);
      }

      return;
    }

    setSubmitError(null);

    try {
      await onContinue(selectedTargets);
    } catch (continueError) {
      const message =
        continueError instanceof Error ? continueError.message : 'Failed to start conversation.';
      setSubmitError(message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New message</Text>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
          disabled={continuing}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search groups and people..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!continuing}
      />

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
      {selectionValidationError && selectedTargets.length > 0 && !submitError ? (
        <Text style={styles.errorText}>{selectionValidationError}</Text>
      ) : null}

      {loadingMembers ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.statusText}>Loading recipients...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredTargets.length === 0 ? (
        <Text style={styles.statusText}>No recipients found.</Text>
      ) : (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {filteredTargets.map((target) => {
            const selected = selectedTargetKeys.has(composeTargetKey(target));

            return (
              <Pressable
                key={composeTargetKey(target)}
                style={({ pressed }) => [
                  styles.row,
                  selected && styles.rowSelected,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => toggleTarget(target)}
                disabled={continuing}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{target.title}</Text>
                  {target.kind === 'person' ? (
                    <Text style={styles.rowSubtitle}>{target.role}</Text>
                  ) : null}
                </View>
                <Text style={[styles.rowCheck, selected && styles.rowCheckSelected]}>
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
          !canContinue && styles.primaryButtonDisabled,
          canContinue && pressed && styles.primaryButtonPressed,
        ]}
        onPress={() => {
          void handleContinue();
        }}
        disabled={!canContinue}
      >
        {continuing ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={styles.primaryButtonText}>Next</Text>
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
  list: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: colors.gold,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  rowSelected: {
    backgroundColor: colors.card,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  rowCheck: {
    width: 24,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  rowCheckSelected: {
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
    opacity: 0.9,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
