import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RosterPlayerCard } from '../../components/roster/RosterPlayerCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAppTheme } from '../../design-system';
import { radius, spacing, typography } from '../../design-system';
import { useAvatarSignedUrlMap } from '../../hooks/useAvatarSignedUrlMap';
import { fetchTeamRoster } from '../../lib/teamRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';
import type { TeamRosterMember } from '../../types/team';
import {
  filterPlayersBySearch,
  filterTeamPlayers,
  getRosterPlayerLabel,
} from '../../utils/rosterDisplay';

type Props = NativeStackScreenProps<MoreStackParamList, 'Roster'>;

export function RosterScreen({ navigation }: Props) {
  const { selectedTeam } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [players, setPlayers] = useState<TeamRosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedRef = useRef(false);

  const loadRoster = useCallback(async (teamId: string, background = false) => {
    if (!background) {
      setLoading(true);
    }
    setError(null);

    try {
      const roster = await fetchTeamRoster(teamId);
      setPlayers(filterTeamPlayers(roster));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load roster.';
      setError(message);
      if (!background) {
        setPlayers([]);
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setPlayers([]);
        setError(null);
        setLoading(false);
        hasLoadedRef.current = false;
        return;
      }

      void loadRoster(teamId, hasLoadedRef.current);
      hasLoadedRef.current = true;
    }, [loadRoster, selectedTeam?.id]),
  );

  const filteredPlayers = useMemo(
    () => filterPlayersBySearch(players, searchQuery),
    [players, searchQuery],
  );

  const playerAvatarPaths = useMemo(
    () => players.map((player) => player.avatar_url),
    [players],
  );
  const { signedUrlsByPath } = useAvatarSignedUrlMap(playerAvatarPaths);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: spacing.lg,
        },
        searchField: {
          backgroundColor: palette.background.secondary,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: palette.border.default,
          paddingHorizontal: 14,
          paddingVertical: spacing.md,
          fontSize: typography.subheading.fontSize,
          color: palette.text.primary,
          minHeight: 44,
          marginBottom: 0,
        },
        listCard: {
          ...cardPresets.default.container,
          padding: 0,
          marginBottom: 0,
          overflow: 'hidden',
        },
        centered: {
          ...cardPresets.default.container,
          marginBottom: 0,
          alignItems: 'center',
          paddingVertical: spacing.xxl,
        },
        message: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          textAlign: 'center',
          lineHeight: 22,
        },
        error: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
        },
      }),
    [cardPresets, palette],
  );

  const subtitle = selectedTeam?.name ?? 'No team selected';

  const renderBody = () => {
    if (!selectedTeam) {
      return (
        <View style={styles.centered}>
          <Text style={styles.message}>Select a team to view its roster.</Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.text.muted} size="small" />
        </View>
      );
    }

    if (error) {
      return <Text style={styles.error}>{error}</Text>;
    }

    if (players.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.message}>No players on this roster yet.</Text>
        </View>
      );
    }

    return (
      <>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search players"
          placeholderTextColor={palette.text.muted}
          style={styles.searchField}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {filteredPlayers.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.message}>No players match your search.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filteredPlayers.map((player, index) => (
              <RosterPlayerCard
                key={player.user_id}
                player={player}
                signedUrl={
                  player.avatar_url
                    ? (signedUrlsByPath.get(player.avatar_url) ?? null)
                    : null
                }
                isLast={index === filteredPlayers.length - 1}
                onPress={() => {
                  navigation.navigate('RosterPlayerDetail', {
                    userId: player.user_id,
                  });
                }}
              />
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <ScreenContainer title="Roster" subtitle={subtitle}>
      <View style={styles.content}>{renderBody()}</View>
    </ScreenContainer>
  );
}
