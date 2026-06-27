import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { removeTeamMember } from '../../lib/teamRepository';
import { useTeam } from '../../team/TeamProvider';
import type { TeamManagementMemberRosterRow } from '../../types/teamRoster';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import {
  canRemoveTeamMember,
  getTeamManagementPrimaryLabel,
} from '../../utils/teamManagementRoster';
import { TeamManagementRosterItem } from './TeamManagementRosterItem';
import { useTeamManagementRoster } from './useTeamManagementRoster';

export function TeamManagementMemberList() {
  const { user } = useAuth();
  const { selectedTeamMemberRole } = useTeam();
  const { palette } = useAppTheme();
  const { teamId, rosterRows, rosterLoading, rosterError, loadRoster } = useTeamManagementRoster();
  const [memberActionMessage, setMemberActionMessage] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const canManageTeam = canEditPlayMetadata(selectedTeamMemberRole);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          alignItems: 'center',
          paddingVertical: 32,
        },
        rosterEmptyText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        memberActionSuccess: {
          ...typography.bodySmall,
          color: palette.status.success,
          lineHeight: 22,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        memberActionError: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
      }),
    [palette],
  );

  const handleRemoveMember = (row: TeamManagementMemberRosterRow) => {
    if (!teamId || removingUserId) {
      return;
    }

    const memberLabel = getTeamManagementPrimaryLabel(row);

    Alert.alert(
      'Remove from team?',
      `Remove ${memberLabel} from this team? Their account will stay active, but they will lose access to this team.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setRemovingUserId(row.user_id);
              setMemberActionMessage(null);
              setMemberActionError(null);

              try {
                await removeTeamMember(teamId, row.user_id);
                setMemberActionMessage('Member removed from the team.');
                await loadRoster(teamId, true);
              } catch (removeError) {
                const message =
                  removeError instanceof Error
                    ? removeError.message
                    : 'Could not remove member.';
                setMemberActionError(message);
              } finally {
                setRemovingUserId(null);
              }
            })();
          },
        },
      ],
    );
  };

  if (rosterLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.interactive.primary} />
      </View>
    );
  }

  return (
    <>
      {memberActionMessage ? (
        <Text style={styles.memberActionSuccess}>{memberActionMessage}</Text>
      ) : null}
      {memberActionError ? (
        <Text style={styles.memberActionError}>{memberActionError}</Text>
      ) : null}
      {rosterError ? (
        <Text style={styles.rosterEmptyText}>{rosterError}</Text>
      ) : rosterRows.length === 0 ? (
        <Text style={styles.rosterEmptyText}>No team members yet.</Text>
      ) : (
        rosterRows.map((row, index) => {
          const canRemove =
            canManageTeam &&
            row.kind === 'member' &&
            canRemoveTeamMember(
              selectedTeamMemberRole,
              user?.id ?? null,
              row.user_id,
              row.role,
            );

          return (
            <TeamManagementRosterItem
              key={row.id}
              row={row}
              isLast={index === rosterRows.length - 1}
              canRemove={canRemove}
              removing={row.kind === 'member' && removingUserId === row.user_id}
              onRemove={
                row.kind === 'member' && canRemove
                  ? () => handleRemoveMember(row)
                  : undefined
              }
            />
          );
        })
      )}
    </>
  );
}
