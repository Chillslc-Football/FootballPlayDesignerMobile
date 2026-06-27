import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenContainer } from '../../components/ScreenContainer';
import { TeamManagementMemberList } from '../../components/team/TeamManagementMemberList';
import { typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';

type Props = NativeStackScreenProps<MoreStackParamList, 'TeamMembers'>;

export function TeamMembersScreen(_props: Props) {
  const { selectedTeam, loading, error } = useTeam();
  const { palette, cardPresets } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          alignItems: 'center',
          paddingVertical: 32,
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
        errorText: {
          color: palette.status.error,
          fontSize: 15,
          lineHeight: 22,
        },
        listCard: {
          ...cardPresets.default.container,
          marginBottom: 0,
          overflow: 'hidden',
        },
      }),
    [cardPresets, palette],
  );

  if (loading) {
    return (
      <ScreenContainer title="Members" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.interactive.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer title="Members">
        <Text style={styles.errorText}>{error}</Text>
      </ScreenContainer>
    );
  }

  if (!selectedTeam) {
    return (
      <ScreenContainer title="Members">
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Select a team from More → Account → Switch Team to view members.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Members" subtitle={selectedTeam.name}>
      <View style={styles.listCard}>
        <TeamManagementMemberList />
      </View>
    </ScreenContainer>
  );
}
