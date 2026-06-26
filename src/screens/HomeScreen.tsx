import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Card } from '../components/Card';
import { PlaybookList } from '../components/PlaybookList';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  cardPresets,
  palette,
  radius,
  spacing,
  typography,
} from '../design-system';
import {
  fetchFeaturedTeamUpdate,
  subscribeTeamUpdatesByTeam,
} from '../lib/teamUpdateRepository';
import type { RootTabParamList } from '../navigation/TabNavigator';
import {
  formatUnreadTabBadge,
  useTeamMessageUnread,
} from '../team/TeamMessageUnreadProvider';
import { useTeam } from '../team/TeamProvider';
import type { TeamUpdate } from '../types/teamUpdate';
import { formatTeamRole } from '../utils/roleLabels';
import {
  formatTeamUpdateDate,
  formatTeamUpdateType,
  previewTeamUpdateBody,
} from '../utils/teamUpdateDisplay';

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { selectedTeam, selectedTeamMemberRole, memberships, selectTeam } = useTeam();
  const { unreadCount } = useTeamMessageUnread();
  const [featuredUpdate, setFeaturedUpdate] = useState<TeamUpdate | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [teamPickerVisible, setTeamPickerVisible] = useState(false);
  const [selectingTeamId, setSelectingTeamId] = useState<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const canSwitchTeam = memberships.length > 1;

  const handleSelectTeam = async (teamId: string) => {
    setSelectingTeamId(teamId);
    await selectTeam(teamId);
    setSelectingTeamId(null);
    setTeamPickerVisible(false);
  };

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
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setFeaturedUpdate(null);
        setLoadingFeatured(false);
        return;
      }

      setLoadingFeatured(true);
      void loadFeaturedUpdate(teamId);

      const unsubscribe = subscribeTeamUpdatesByTeam(
        teamId,
        () => {
          if (selectedTeamIdRef.current !== teamId) {
            return;
          }

          void loadFeaturedUpdate(teamId);
        },
        { channelName: `team-updates-home:${teamId}` },
      );

      return unsubscribe;
    }, [selectedTeam?.id, loadFeaturedUpdate]),
  );

  const unreadBadge = formatUnreadTabBadge(unreadCount);
  const chatStatusText =
    unreadCount > 0
      ? `${unreadBadge} unread message${unreadCount === 1 ? '' : 's'}`
      : 'All caught up — open Chat';

  return (
    <ScreenContainer title="Winner's Choice" subtitle="What do I need to know today?">
      <View style={styles.dashboard}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current Team</Text>
          <Pressable
            style={({ pressed }) => [
              styles.sectionCard,
              styles.teamSelectorCard,
              canSwitchTeam && pressed && styles.cardPressed,
            ]}
            onPress={() => setTeamPickerVisible(true)}
            disabled={!canSwitchTeam}
          >
            <View style={styles.teamSelectorContent}>
              {selectedTeam ? (
                <>
                  <Text style={styles.teamName}>{selectedTeam.name}</Text>
                  {selectedTeamMemberRole ? (
                    <Text style={styles.teamRole}>{formatTeamRole(selectedTeamMemberRole)}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.placeholderText}>No team selected</Text>
              )}
            </View>
            {canSwitchTeam ? <Text style={styles.teamChevron}>›</Text> : null}
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent Update</Text>
          <Pressable
            onPress={() => navigation.navigate('Updates')}
            style={({ pressed }) => [pressed && styles.cardPressed]}
          >
            <Card title="Team Update">
              {loadingFeatured ? (
                <View style={styles.featuredLoading}>
                  <ActivityIndicator size="small" color={palette.accent.default} />
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Chat</Text>
          <Pressable
            onPress={() => navigation.navigate('Chat')}
            style={({ pressed }) => [pressed && styles.cardPressed]}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.cardText}>Team Messages</Text>
              <Text style={styles.cardSubtext}>{chatStatusText}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Upcoming Calendar</Text>
          <Pressable
            onPress={() => navigation.navigate('Calendar')}
            style={({ pressed }) => [pressed && styles.cardPressed]}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.cardText}>View your schedule</Text>
              <Text style={styles.cardSubtext}>
                Open Calendar to see upcoming events and practices.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={teamPickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setTeamPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setTeamPickerVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Switch Team</Text>
            <Text style={styles.modalSubtitle}>Choose the team you want to work with</Text>
            <PlaybookList
              items={memberships.map((membership) => ({
                key: membership.team.id,
                label: membership.team.name,
                subtitle:
                  membership.team.id === selectedTeam?.id
                    ? `${formatTeamRole(membership.role)} · Current`
                    : formatTeamRole(membership.role),
                icon: '🏈',
                onPress: () => {
                  void handleSelectTeam(membership.team.id);
                },
              }))}
            />
            {selectingTeamId ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={palette.accent.default} />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const sectionCardStyle = {
  ...cardPresets.default.container,
  marginBottom: 0,
};

const styles = StyleSheet.create({
  dashboard: {
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    marginLeft: spacing.xs,
  },
  sectionCard: sectionCardStyle,
  teamSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSelectorContent: {
    flex: 1,
  },
  teamChevron: {
    fontSize: 22,
    color: palette.text.muted,
    fontWeight: '300',
    marginLeft: spacing.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  teamName: typography.heading,
  teamRole: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    marginTop: spacing.xs,
  },
  placeholderText: {
    ...typography.bodySmall,
    color: palette.text.muted,
  },
  featuredLoading: {
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featuredBadge: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.accent.default,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  featuredBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.label.fontWeight,
    color: palette.accent.default,
    textTransform: 'uppercase',
    letterSpacing: typography.label.letterSpacing,
  },
  pinnedBadge: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.text.label,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  pinnedBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.label.fontWeight,
    color: palette.text.label,
    textTransform: 'uppercase',
    letterSpacing: typography.label.letterSpacing,
  },
  cardText: {
    ...typography.subheading,
    fontWeight: typography.subheading.fontWeight,
  },
  cardSubtext: {
    ...typography.bodySmall,
    color: palette.text.secondary,
  },
  cardMeta: {
    marginTop: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: palette.text.muted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalSheet: {
    backgroundColor: palette.background.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.bodySmall,
    color: palette.text.secondary,
    marginBottom: spacing.lg,
  },
  modalLoading: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});
