import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { PlaybookList } from '../components/PlaybookList';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTeam } from '../team/TeamProvider';
import { colors } from '../theme';
import { formatTeamRole } from '../utils/roleLabels';

export function TeamSelectorScreen() {
  const { signOut } = useAuth();
  const { memberships, loading, error, selectTeam } = useTeam();
  const [selectingTeamId, setSelectingTeamId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleSelectTeam = async (teamId: string) => {
    setSelectingTeamId(teamId);
    await selectTeam(teamId);
    setSelectingTeamId(null);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer title="Select Team" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Select Team" subtitle="Choose the team you want to work with">
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {memberships.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You are not assigned to any teams yet.</Text>
        </View>
      ) : (
        <PlaybookList
          items={memberships.map((membership) => ({
            key: membership.team.id,
            label: membership.team.name,
            subtitle: formatTeamRole(membership.role),
            icon: '🏈',
            onPress: () => {
              void handleSelectTeam(membership.team.id);
            },
          }))}
        />
      )}

      {selectingTeamId ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}

      <View style={styles.signOutContainer}>
        <PlaybookList
          items={[
            {
              key: 'sign-out',
              label: signingOut ? 'Signing Out...' : 'Sign Out',
              icon: '🚪',
              onPress: () => {
                void handleSignOut();
              },
            },
          ]}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    color: '#F87171',
    fontSize: 14,
    marginBottom: 16,
  },
  loadingOverlay: {
    marginTop: 16,
    alignItems: 'center',
  },
  signOutContainer: {
    marginTop: 24,
  },
});
