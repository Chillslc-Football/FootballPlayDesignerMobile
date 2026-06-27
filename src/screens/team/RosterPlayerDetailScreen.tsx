import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ProfileInitialsAvatar } from '../../components/roster/ProfileInitialsAvatar';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAppTheme } from '../../design-system';
import { radius, spacing, typography } from '../../design-system';
import { fetchTeamRoster } from '../../lib/teamRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';
import type { TeamRosterMember } from '../../types/team';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { formatTeamRole } from '../../utils/roleLabels';
import {
  formatRosterJerseyNumber,
  formatRosterPositionLine,
  getRosterPlayerInitials,
  getRosterPlayerLabel,
} from '../../utils/rosterDisplay';

type Props = NativeStackScreenProps<MoreStackParamList, 'RosterPlayerDetail'>;

export function RosterPlayerDetailScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [player, setPlayer] = useState<TeamRosterMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = canEditPlayMetadata(selectedTeamMemberRole);

  const loadPlayer = useCallback(async (teamId: string) => {
    setLoading(true);
    setError(null);

    try {
      const roster = await fetchTeamRoster(teamId);
      const match = roster.find((member) => member.user_id === userId && member.role === 'player');

      if (!match) {
        setPlayer(null);
        setError('Player not found on this roster.');
        return;
      }

      setPlayer(match);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load player information.';
      setError(message);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setPlayer(null);
        setError('Select a team to view player information.');
        setLoading(false);
        return;
      }

      void loadPlayer(teamId);
    }, [loadPlayer, selectedTeam?.id]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: spacing.lg,
        },
        card: {
          ...cardPresets.default.container,
          alignItems: 'center',
          gap: spacing.md,
          marginBottom: 0,
        },
        centered: {
          ...cardPresets.default.container,
          marginBottom: 0,
          alignItems: 'center',
          paddingVertical: spacing.xxl,
        },
        name: {
          ...typography.heading,
          color: palette.text.primary,
          textAlign: 'center',
        },
        jersey: {
          ...typography.subheading,
          color: palette.text.label,
        },
        positions: {
          ...typography.bodySmall,
          color: palette.text.secondary,
        },
        badge: {
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: palette.border.default,
          backgroundColor: palette.background.secondary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs + 2,
        },
        badgeText: {
          fontSize: typography.caption.fontSize,
          fontWeight: typography.label.fontWeight,
          color: palette.text.label,
          textTransform: 'uppercase',
          letterSpacing: typography.label.letterSpacing,
        },
        infoCard: {
          ...cardPresets.default.container,
          gap: spacing.md,
          marginBottom: 0,
        },
        infoRow: {
          gap: spacing.xs,
        },
        infoLabel: {
          ...typography.caption,
          color: palette.text.muted,
          textTransform: 'uppercase',
          letterSpacing: typography.label.letterSpacing,
        },
        infoValue: {
          ...typography.bodySmall,
          color: palette.text.primary,
        },
        editButton: {
          backgroundColor: palette.interactive.primary,
          borderRadius: radius.md,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
        editButtonPressed: {
          opacity: 0.9,
        },
        editButtonText: {
          ...typography.bodySmall,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
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

  const renderBody = () => {
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

    if (!player) {
      return (
        <View style={styles.centered}>
          <Text style={styles.message}>Player information is unavailable.</Text>
        </View>
      );
    }

    const label = getRosterPlayerLabel(player);
    const jerseyLabel = formatRosterJerseyNumber(player.jersey_number);
    const positionLine = formatRosterPositionLine(
      player.primary_position,
      player.secondary_position,
    );

    return (
      <>
        <View style={styles.card}>
          <ProfileInitialsAvatar initials={getRosterPlayerInitials(label)} size="lg" />
          {jerseyLabel ? <Text style={styles.jersey}>{jerseyLabel}</Text> : null}
          <Text style={styles.name}>{label}</Text>
          {positionLine ? <Text style={styles.positions}>{positionLine}</Text> : null}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatTeamRole(player.role)}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jersey Number</Text>
            <Text style={styles.infoValue}>{jerseyLabel ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Position</Text>
            <Text style={styles.infoValue}>{player.primary_position ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Secondary Position</Text>
            <Text style={styles.infoValue}>{player.secondary_position ?? '—'}</Text>
          </View>
        </View>

        {canEdit ? (
          <Pressable
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
            onPress={() => {
              navigation.navigate('RosterPlayerEdit', {
                userId: player.user_id,
                displayName: label,
                jerseyNumber: player.jersey_number,
                primaryPosition: player.primary_position,
                secondaryPosition: player.secondary_position,
              });
            }}
          >
            <Text style={styles.editButtonText}>Edit Player Information</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  return (
    <ScreenContainer title="Player">
      <View style={styles.content}>{renderBody()}</View>
    </ScreenContainer>
  );
}
