import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { fetchTeamManagementRoster } from '../../lib/teamManagementRepository';
import { fetchProfileDisplayName } from '../../lib/teamRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';
import type { TeamManagementRosterRow } from '../../types/teamRoster';
import type { TeamRole } from '../../types/team';
import { formatTeamFormatLabel } from '../../utils/teamFormatDisplay';

type Props = NativeStackScreenProps<MoreStackParamList, 'TeamInformation'>;

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
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

type RoleCounts = Record<TeamRole, number>;

function countActiveMembers(rows: TeamManagementRosterRow[]): {
  total: number;
  byRole: RoleCounts;
} {
  const byRole: RoleCounts = {
    team_owner: 0,
    coach: 0,
    player: 0,
    parent: 0,
  };

  for (const row of rows) {
    if (row.kind !== 'member') {
      continue;
    }

    byRole[row.role] += 1;
  }

  return {
    total: byRole.team_owner + byRole.coach + byRole.player + byRole.parent,
    byRole,
  };
}

export function TeamInformationScreen(_props: Props) {
  const { selectedTeam, loading, error } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [rosterRows, setRosterRows] = useState<TeamManagementRosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [createdByLabel, setCreatedByLabel] = useState<string | null>(null);
  const [createdByLoading, setCreatedByLoading] = useState(false);
  const hasLoadedRosterRef = useRef(false);

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
    const creatorId = selectedTeam?.created_by;

    if (!creatorId) {
      setCreatedByLabel(null);
      setCreatedByLoading(false);
      return;
    }

    let cancelled = false;
    setCreatedByLoading(true);

    void (async () => {
      try {
        const displayName = await fetchProfileDisplayName(creatorId);
        if (!cancelled) {
          setCreatedByLabel(displayName);
        }
      } catch {
        if (!cancelled) {
          setCreatedByLabel(null);
        }
      } finally {
        if (!cancelled) {
          setCreatedByLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTeam?.created_by]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: spacing.lg,
        },
        sectionBody: {
          gap: spacing.md,
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
          paddingVertical: spacing.lg,
        },
        errorText: {
          color: palette.status.error,
          fontSize: 15,
          lineHeight: 22,
        },
        countsLoading: {
          ...typography.bodySmall,
          color: palette.text.secondary,
        },
      }),
    [cardPresets, palette],
  );

  if (loading) {
    return (
      <ScreenContainer title="Team Information" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.interactive.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer title="Team Information">
        <Text style={styles.errorText}>{error}</Text>
      </ScreenContainer>
    );
  }

  if (!selectedTeam) {
    return (
      <ScreenContainer title="Team Information">
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Select a team from More → Account → Switch Team to view team information.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const formatLabel = formatTeamFormatLabel(selectedTeam.team_format);
  const { total, byRole } = countActiveMembers(rosterRows);

  const createdByValue = createdByLoading
    ? 'Loading...'
    : createdByLabel || 'Unavailable';

  return (
    <ScreenContainer title="Team Information" subtitle={selectedTeam.name}>
      <View style={styles.content}>
        <Card title="General">
          <View style={styles.sectionBody}>
            <InfoRow label="Team Name" value={selectedTeam.name} />
            <InfoRow label="Team Format" value={formatLabel} />
            <InfoRow label="Created By" value={createdByValue} />
            {rosterLoading ? (
              <Text style={styles.countsLoading}>Loading member counts…</Text>
            ) : rosterError ? (
              <InfoRow label="Members" value="Unavailable" />
            ) : (
              <>
                <InfoRow label="Members" value={String(total)} />
                <InfoRow label="Coaches" value={String(byRole.coach)} />
                <InfoRow label="Players" value={String(byRole.player)} />
                <InfoRow label="Parents" value={String(byRole.parent)} />
              </>
            )}
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}
