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
import type { DirectMessageEligibleMember } from '../../types/teamMessage';
import type { ProfileNameFields } from '../../types/profile';
import type { TeamRole } from '../../types/team';
import { resolveProfileDisplayName } from '../../utils/profileDisplay';
import { formatTeamRole } from '../../utils/roleLabels';

type NewMessagePickerProps = {
  teamId: string;
  onSelectMember: (member: DirectMessageEligibleMember) => void;
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

export function NewMessagePicker({ teamId, onSelectMember, onClose }: NewMessagePickerProps) {
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New message</Text>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search team members..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.statusText}>Loading team members...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filteredMembers.length === 0 ? (
        <Text style={styles.statusText}>No team members found.</Text>
      ) : (
        <ScrollView
          style={styles.memberList}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {filteredMembers.map((member) => (
            <Pressable
              key={member.user_id}
              style={({ pressed }) => [styles.memberRow, pressed && styles.memberRowPressed]}
              onPress={() => onSelectMember(member)}
            >
              <Text style={styles.memberName}>{memberLabel(member)}</Text>
              <Text style={styles.memberRole}>{formatTeamRole(member.role as TeamRole)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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
    paddingVertical: 8,
  },
  memberList: {
    maxHeight: 280,
  },
  memberRow: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  memberRowPressed: {
    opacity: 0.85,
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
});
