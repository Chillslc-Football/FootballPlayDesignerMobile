import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { fetchTeamUpdatesByTeam } from '../lib/teamUpdateRepository';
import { useTeam } from '../team/TeamProvider';
import { colors } from '../theme';
import type { TeamUpdate } from '../types/teamUpdate';
import { formatTeamUpdateDate } from '../utils/teamUpdateDisplay';

export function TeamUpdatesScreen() {
  const { selectedTeam } = useTeam();
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUpdates = useCallback(async () => {
    if (!selectedTeam) {
      setUpdates([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedUpdates = await fetchTeamUpdatesByTeam(selectedTeam.id);
      setUpdates(loadedUpdates);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team updates.';
      setError(message);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates]);

  if (loading) {
    return (
      <ScreenContainer title="Team Updates" subtitle={selectedTeam?.name} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Team Updates" subtitle={selectedTeam?.name}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && updates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No team updates have been posted yet.</Text>
        </View>
      ) : null}

      {updates.map((update) => (
        <View
          key={update.id}
          style={[styles.updateCard, update.is_pinned && styles.updateCardPinned]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.updateTitle}>{update.title}</Text>
            {update.is_pinned ? (
              <View style={styles.pinnedBadge}>
                <Text style={styles.pinnedBadgeText}>Pinned</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.updateMeta}>{formatTeamUpdateDate(update.created_at)}</Text>
          <Text style={styles.updateBody}>{update.body}</Text>
        </View>
      ))}
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
  error: {
    fontSize: 15,
    color: colors.gold,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  updateCardPinned: {
    borderColor: colors.gold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  updateTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  pinnedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinnedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  updateMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  updateBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
