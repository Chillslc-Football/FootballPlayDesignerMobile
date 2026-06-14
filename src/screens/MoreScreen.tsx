import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { MenuItem } from '../components/MenuItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTeam } from '../team/TeamProvider';
import { colors } from '../theme';
import { formatTeamRole } from '../utils/roleLabels';

export function MoreScreen() {
  const { signOut } = useAuth();
  const { selectedTeam, selectedTeamMemberRole, switchTeam } = useTeam();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScreenContainer title="More">
      {selectedTeam ? (
        <View style={styles.teamCard}>
          <Text style={styles.teamLabel}>Selected Team</Text>
          <Text style={styles.teamName}>{selectedTeam.name}</Text>
          {selectedTeamMemberRole ? (
            <Text style={styles.teamRole}>{formatTeamRole(selectedTeamMemberRole)}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.menu}>
        <MenuItem label="Settings" icon="⚙️" />
        <MenuItem label="Help" icon="❓" />
        <MenuItem label="Switch Team" icon="🔁" onPress={switchTeam} />
        <MenuItem
          label={signingOut ? 'Signing Out...' : 'Sign Out'}
          icon="🚪"
          onPress={handleSignOut}
          isLast
        />
      </View>

      {signingOut ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  teamCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
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
  menu: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  loadingOverlay: {
    marginTop: 16,
    alignItems: 'center',
  },
});
