import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../auth/AuthProvider';
import { Card } from '../../components/Card';
import { MenuItem } from '../../components/MenuItem';
import { MoreMenuSection } from '../../components/MoreMenuSection';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TeamManagementComingSoonItem } from '../../components/team/TeamManagementComingSoonItem';
import { TeamManagementRosterItem } from '../../components/team/TeamManagementRosterItem';
import { typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { fetchTeamManagementRoster } from '../../lib/teamManagementRepository';
import { fetchProfileDisplayName, removeTeamMember } from '../../lib/teamRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';
import type { TeamManagementMemberRosterRow, TeamManagementRosterRow } from '../../types/teamRoster';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatTeamRole } from '../../utils/roleLabels';
import { formatTeamFormatLabel } from '../../utils/teamFormatDisplay';
import {
  canRemoveTeamMember,
  getTeamManagementPrimaryLabel,
} from '../../utils/teamManagementRoster';

type Props = NativeStackScreenProps<MoreStackParamList, 'TeamManagement'>;

type OverviewRowProps = {
  label: string;
  value: string;
};

function OverviewRow({ label, value }: OverviewRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          gap: 4,
        },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        value: {
          fontSize: 17,
          fontWeight: '500',
          color: colors.text,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function TeamManagementScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { selectedTeam, selectedTeamMemberRole, loading, error } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [profileLabel, setProfileLabel] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [rosterRows, setRosterRows] = useState<TeamManagementRosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [memberActionMessage, setMemberActionMessage] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const hasLoadedRosterRef = useRef(false);

  const canManageTeam = canEditPlayMetadata(selectedTeamMemberRole);
  const isTeamOwner = selectedTeamMemberRole === 'team_owner';

  const loadRoster = useCallback(async (teamId: string, background = false) => {
    if (!background) {
      setRosterLoading(true);
    }
    setRosterError(null);

    try {
      const rows = await fetchTeamManagementRoster(teamId);
      setRosterRows(rows);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team members.';
      setRosterError(message);
      if (!background) {
        setRosterRows([]);
      }
    } finally {
      if (!background) {
        setRosterLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setRosterRows([]);
        setRosterError(null);
        setRosterLoading(false);
        hasLoadedRosterRef.current = false;
        return;
      }

      void loadRoster(teamId, hasLoadedRosterRef.current);
      hasLoadedRosterRef.current = true;
    }, [loadRoster, selectedTeam?.id]),
  );

  useEffect(() => {
    if (!user) {
      setProfileLabel(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    void (async () => {
      try {
        const displayName = await fetchProfileDisplayName(user.id);
        if (!cancelled) {
          setProfileLabel(displayName);
        }
      } catch {
        if (!cancelled) {
          setProfileLabel(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: 16,
        },
        overviewBody: {
          gap: 16,
        },
        noticeCard: {
          ...cardPresets.default.container,
          marginBottom: 0,
        },
        noticeText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        centered: {
          alignItems: 'center',
          paddingVertical: 32,
        },
        errorText: {
          color: palette.status.error,
          fontSize: 15,
          lineHeight: 22,
        },
        emptyText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
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
    [cardPresets, palette],
  );

  const userLabel = useMemo(() => {
    if (profileLoading) {
      return 'Loading...';
    }

    const trimmedEmail = user?.email?.trim();
    return profileLabel || trimmedEmail || 'Unavailable';
  }, [profileLabel, profileLoading, user?.email]);

  const handleRemoveMember = (row: TeamManagementMemberRosterRow) => {
    const teamId = selectedTeam?.id;

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

  if (loading) {
    return (
      <ScreenContainer title="Team Management" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.interactive.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer title="Team Management">
        <Text style={styles.errorText}>{error}</Text>
      </ScreenContainer>
    );
  }

  if (!selectedTeam) {
    return (
      <ScreenContainer title="Team Management">
        <View style={styles.noticeCard}>
          <Text style={styles.emptyText}>
            Select a team from More → Account → Switch Team to view team management.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const roleLabel = selectedTeamMemberRole ? formatTeamRole(selectedTeamMemberRole) : 'Unavailable';
  const formatLabel = formatTeamFormatLabel(selectedTeam.team_format);

  const comingSoonItems = [
    {
      key: 'team-settings',
      label: 'Team Settings',
      icon: '⚙️',
      description: 'Update team details',
    },
    ...(isTeamOwner
      ? [
          {
            key: 'danger-zone',
            label: 'Danger Zone',
            icon: '⚠️',
            description: 'Delete team and related data',
          },
        ]
      : []),
  ];

  return (
    <ScreenContainer title="Team Management">
      <View style={styles.content}>
        <Card title="Team Overview">
          <View style={styles.overviewBody}>
            <OverviewRow label="Team" value={selectedTeam.name} />
            <OverviewRow label="Format" value={formatLabel} />
            <OverviewRow label="Your Role" value={roleLabel} />
            <OverviewRow label="You" value={userLabel} />
          </View>
        </Card>

        <MoreMenuSection title="Members">
          {memberActionMessage ? (
            <Text style={styles.memberActionSuccess}>{memberActionMessage}</Text>
          ) : null}
          {memberActionError ? (
            <Text style={styles.memberActionError}>{memberActionError}</Text>
          ) : null}
          {rosterLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={palette.interactive.primary} />
            </View>
          ) : rosterError ? (
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
        </MoreMenuSection>

        {!canManageTeam ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              Team management actions are available to coaches and team owners.
            </Text>
          </View>
        ) : (
          <MoreMenuSection title="Management">
            <MenuItem
              label="Invites"
              icon="✉️"
              onPress={() => navigation.navigate('InviteMembers')}
            />
            <MenuItem
              label="Join Links"
              icon="🔗"
              onPress={() => navigation.navigate('JoinLinks')}
              isLast={comingSoonItems.length === 0}
            />
            {comingSoonItems.map((item, index) => (
              <TeamManagementComingSoonItem
                key={item.key}
                label={item.label}
                icon={item.icon}
                description={item.description}
                isLast={index === comingSoonItems.length - 1}
              />
            ))}
          </MoreMenuSection>
        )}
      </View>
    </ScreenContainer>
  );
}
