import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../auth/AuthProvider';
import { MenuItem } from '../components/MenuItem';
import { MoreMenuSection } from '../components/MoreMenuSection';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme } from '../design-system';
import { MoreStackParamList } from '../navigation/MoreStack';
import { useTeam } from '../team/TeamProvider';
import { canEditPlayMetadata } from '../utils/canEditPlayMetadata';
import { formatTeamRole } from '../utils/roleLabels';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

export function MoreScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const { selectedTeam, selectedTeamMemberRole, switchTeam } = useTeam();
  const { colors } = useAppTheme();
  const [signingOut, setSigningOut] = useState(false);

  const canManageTeam = canEditPlayMetadata(selectedTeamMemberRole);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: 24,
        },
        teamCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: 16,
        },
        teamLabel: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.gold,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
        },
        teamName: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
        },
        teamRole: {
          marginTop: 6,
          fontSize: 15,
          color: colors.textSecondary,
        },
        loadingOverlay: {
          marginTop: 16,
          alignItems: 'center',
        },
      }),
    [colors],
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const teamRows = [
    <MenuItem
      key="create-team"
      label="Create New Team"
      icon="➕"
      onPress={() => navigation.navigate('CreateTeam')}
    />,
    <MenuItem
      key="roster"
      label="Roster"
      icon="👥"
      onPress={() => navigation.navigate('Roster')}
      isLast={!canManageTeam}
    />,
    ...(canManageTeam
      ? [
          <MenuItem
            key="team-management"
            label="Team Management"
            icon="🛡️"
            onPress={() => navigation.navigate('TeamManagement')}
          />,
          <MenuItem
            key="invite-members"
            label="Invite Members"
            icon="✉️"
            onPress={() => navigation.navigate('InviteMembers')}
            isLast
          />,
        ]
      : []),
  ];

  return (
    <ScreenContainer title="More">
      <View style={styles.content}>
        {selectedTeam ? (
          <View style={styles.teamCard}>
            <Text style={styles.teamLabel}>Selected Team</Text>
            <Text style={styles.teamName}>{selectedTeam.name}</Text>
            {selectedTeamMemberRole ? (
              <Text style={styles.teamRole}>{formatTeamRole(selectedTeamMemberRole)}</Text>
            ) : null}
          </View>
        ) : null}

        <MoreMenuSection title="Team">{teamRows}</MoreMenuSection>

        <MoreMenuSection title="Settings">
          <MenuItem
            label="Appearance"
            icon="🎨"
            onPress={() => navigation.navigate('Appearance')}
          />
          <MenuItem
            label="Notifications"
            icon="🔔"
            onPress={() => navigation.navigate('Settings')}
          />
          <MenuItem label="Help" icon="❓" isLast />
        </MoreMenuSection>

        <MoreMenuSection title="Account">
          <MenuItem label="Switch Team" icon="🔁" onPress={switchTeam} />
          <MenuItem
            label="Push Debug"
            icon="🛠️"
            onPress={() => navigation.navigate('PushDebug')}
          />
          <MenuItem
            label={signingOut ? 'Signing Out...' : 'Sign Out'}
            icon="🚪"
            onPress={handleSignOut}
            isLast
          />
        </MoreMenuSection>
      </View>

      {signingOut ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}
