import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../../components/Card';
import { MenuItem } from '../../components/MenuItem';
import { MoreMenuSection } from '../../components/MoreMenuSection';
import { ScreenContainer } from '../../components/ScreenContainer';
import { DeleteTeamDialog } from '../../components/team/DeleteTeamDialog';
import { useTeamManagementRoster } from '../../components/team/useTeamManagementRoster';
import { buttonPresets, spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { navigateToTab } from '../../navigation/navigationRef';
import { useTeam } from '../../team/TeamProvider';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatTeamRole } from '../../utils/roleLabels';
import { formatTeamFormatLabel } from '../../utils/teamFormatDisplay';
import { formatTeamManagementMemberSummary } from '../../utils/teamManagementRoster';

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
  const { selectedTeam, selectedTeamMemberRole, memberships, loading, error, deleteTeam } =
    useTeam();
  const { palette, cardPresets } = useAppTheme();
  const { rosterRows, rosterLoading } = useTeamManagementRoster();
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false);
  const [deleteTeamError, setDeleteTeamError] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const canManageTeam = canEditPlayMetadata(selectedTeamMemberRole);
  const isTeamOwner = selectedTeamMemberRole === 'team_owner';
  const isLastTeam = memberships.length <= 1;

  const membersSubtitle = formatTeamManagementMemberSummary(rosterRows, rosterLoading);

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
        dangerZoneCard: {
          ...cardPresets.default.container,
          marginBottom: 0,
          borderColor: palette.status.error,
          borderWidth: 1,
          gap: spacing.md,
        },
        dangerZoneTitle: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.status.error,
        },
        dangerZoneDescription: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        deleteTeamButton: buttonPresets.danger.container,
        deleteTeamButtonText: buttonPresets.danger.text,
        deleteTeamButtonPressed: buttonPresets.danger.pressed,
      }),
    [cardPresets, palette],
  );

  const handleConfirmDeleteTeam = () => {
    if (!selectedTeam || !isTeamOwner || deletingTeam) {
      return;
    }

    void (async () => {
      setDeletingTeam(true);
      setDeleteTeamError(null);

      const result = await deleteTeam(selectedTeam.id);

      setDeletingTeam(false);

      if (result.error) {
        setDeleteTeamError(result.error);
        return;
      }

      setDeleteTeamOpen(false);
      navigation.popToTop();
      navigateToTab('Home');
    })();
  };

  const managementItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      icon: string;
      onPress: () => void;
      subtitle?: string;
    }> = [
      {
        key: 'members',
        label: 'Members',
        icon: '👤',
        subtitle: membersSubtitle,
        onPress: () => navigation.navigate('TeamMembers'),
      },
      {
        key: 'roster',
        label: 'Roster',
        icon: '👥',
        onPress: () => navigation.navigate('Roster'),
      },
      ...(canManageTeam
        ? [
            {
              key: 'invite-members',
              label: 'Invite Members',
              icon: '✉️',
              onPress: () => navigation.navigate('InviteMembers'),
            },
            {
              key: 'join-links',
              label: 'Join Links',
              icon: '🔗',
              onPress: () => navigation.navigate('JoinLinks'),
            },
          ]
        : []),
      {
        key: 'team-information',
        label: 'Team Information',
        icon: 'ℹ️',
        onPress: () => navigation.navigate('TeamInformation'),
      },
    ];

    return items;
  }, [canManageTeam, membersSubtitle, navigation]);

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
        <View style={styles.content}>
          <View style={styles.noticeCard}>
            <Text style={styles.emptyText}>
              Select a team from More → Account → Switch Team to view team management.
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  const roleLabel = selectedTeamMemberRole ? formatTeamRole(selectedTeamMemberRole) : 'Unavailable';
  const formatLabel = formatTeamFormatLabel(selectedTeam.team_format);

  return (
    <ScreenContainer title="Team Management">
      {isTeamOwner ? (
        <DeleteTeamDialog
          visible={deleteTeamOpen}
          teamName={selectedTeam.name}
          isLastTeam={isLastTeam}
          deleting={deletingTeam}
          error={deleteTeamError}
          onConfirm={handleConfirmDeleteTeam}
          onCancel={() => {
            if (deletingTeam) {
              return;
            }

            setDeleteTeamOpen(false);
            setDeleteTeamError(null);
          }}
        />
      ) : null}

      <View style={styles.content}>
        <Card title="Overview">
          <View style={styles.overviewBody}>
            <OverviewRow label="Team Name" value={selectedTeam.name} />
            <OverviewRow label="Format" value={formatLabel} />
            <OverviewRow label="Your Role" value={roleLabel} />
          </View>
        </Card>

        <MoreMenuSection title="Management">
          {managementItems.map((item, index) => (
            <MenuItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              subtitle={item.subtitle}
              onPress={item.onPress}
              isLast={index === managementItems.length - 1}
            />
          ))}
        </MoreMenuSection>

        {isTeamOwner ? (
          <View style={styles.dangerZoneCard}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <Text style={styles.dangerZoneDescription}>
              Permanently delete this team and all of its plays, formations, members, and invites.
              Plays and formations will be archived for import into future teams. Team members will
              lose access.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.deleteTeamButton,
                pressed && styles.deleteTeamButtonPressed,
              ]}
              onPress={() => {
                setDeleteTeamError(null);
                setDeleteTeamOpen(true);
              }}
            >
              <Text style={styles.deleteTeamButtonText}>Delete Team</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
