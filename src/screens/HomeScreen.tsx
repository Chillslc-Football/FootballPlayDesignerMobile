import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  fetchFeaturedTeamUpdate,
  subscribeTeamUpdatesByTeam,
} from '../lib/teamUpdateRepository';
import type { RootTabParamList } from '../navigation/TabNavigator';
import { useTeam } from '../team/TeamProvider';
import { colors } from '../theme';
import type { TeamUpdate } from '../types/teamUpdate';
import {
  formatTeamUpdateDate,
  formatTeamUpdateType,
  previewTeamUpdateBody,
} from '../utils/teamUpdateDisplay';

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { selectedTeam } = useTeam();
  const [featuredUpdate, setFeaturedUpdate] = useState<TeamUpdate | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const loadFeaturedUpdate = useCallback(async (teamId: string) => {
    try {
      const update = await fetchFeaturedTeamUpdate(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setFeaturedUpdate(update);
    } catch {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setFeaturedUpdate(null);
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setLoadingFeatured(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeamIdRef.current;

      if (!teamId) {
        setFeaturedUpdate(null);
        setLoadingFeatured(false);
        return;
      }

      setLoadingFeatured(true);
      void loadFeaturedUpdate(teamId);

      const unsubscribe = subscribeTeamUpdatesByTeam(teamId, () => {
        if (selectedTeamIdRef.current !== teamId) {
          return;
        }

        void loadFeaturedUpdate(teamId);
      });

      return unsubscribe;
    }, [selectedTeam?.id, loadFeaturedUpdate]),
  );

  return (
    <ScreenContainer
      title="Football Play Designer"
      subtitle="Team Companion App"
    >
      <Pressable
        onPress={() => navigation.navigate('Updates')}
        style={({ pressed }) => [pressed && styles.featuredCardPressed]}
      >
        <Card title="Team Update">
          {loadingFeatured ? (
            <View style={styles.featuredLoading}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : featuredUpdate ? (
            <>
              <View style={styles.badgeRow}>
                {featuredUpdate.show_on_home ? (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </View>
                ) : null}
                {featuredUpdate.is_pinned ? (
                  <View style={styles.pinnedBadge}>
                    <Text style={styles.pinnedBadgeText}>Pinned</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.cardText}>{featuredUpdate.title}</Text>
              <Text style={styles.cardSubtext}>
                {previewTeamUpdateBody(featuredUpdate.body)}
              </Text>
              <Text style={styles.cardMeta}>
                {formatTeamUpdateType(featuredUpdate.update_type)} ·{' '}
                {formatTeamUpdateDate(featuredUpdate.created_at)}
              </Text>
            </>
          ) : (
            <Text style={styles.cardSubtext}>No update is currently featured on Home.</Text>
          )}
        </Card>
      </Pressable>

      <Card title="Upcoming Event">
        <Text style={styles.cardText}>Team Practice</Text>
        <Text style={styles.cardSubtext}>Tomorrow at 4:00 PM</Text>
      </Card>

      <Card title="Recent Message">
        <Text style={styles.cardText}>Coach Johnson</Text>
        <Text style={styles.cardSubtext}>
          Review the new red zone package before Friday.
        </Text>
      </Card>

      <Card title="Playbook Updates">
        <Text style={styles.cardText}>3 new plays added</Text>
        <Text style={styles.cardSubtext}>Updated this week in your playbook</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  featuredCardPressed: {
    opacity: 0.92,
  },
  featuredLoading: {
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  featuredBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  cardText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardMeta: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
  },
});
