import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  radius,
  spacing,
  typography,
  useAppTheme,
} from '../design-system';
import {
  fetchLatestTeamUpdate,
  subscribeTeamUpdatesByTeam,
} from '../lib/teamUpdateRepository';
import { fetchLatestTeamMessageSummary } from '../lib/teamMessageRepository';
import { fetchNextUpcomingTeamEvent } from '../lib/teamEventRepository';
import type { RootTabParamList } from '../navigation/TabNavigator';
import {
  useTeamMessageUnread,
} from '../team/TeamMessageUnreadProvider';
import { useTeam } from '../team/TeamProvider';
import type { TeamUpdate } from '../types/teamUpdate';
import type { TeamMessageHomeSummary } from '../types/teamMessage';
import type { TeamEvent } from '../types/teamEvent';
import {
  formatTeamEventListDate,
  formatTeamEventListTimeRange,
} from '../utils/teamEventDisplay';
import { formatTeamRole } from '../utils/roleLabels';
import {
  formatTeamUpdateDate,
  previewTeamUpdateBody,
} from '../utils/teamUpdateDisplay';
import { canEditPlayMetadata } from '../utils/canEditPlayMetadata';

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { selectedTeam, selectedTeamMemberRole, memberships, selectTeam } = useTeam();
  const { unreadCount } = useTeamMessageUnread();
  const { palette, cardPresets } = useAppTheme();
  const [featuredUpdate, setFeaturedUpdate] = useState<TeamUpdate | null>(null);
  const [chatSummary, setChatSummary] = useState<TeamMessageHomeSummary | null>(null);
  const [nextEvent, setNextEvent] = useState<TeamEvent | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingChat, setLoadingChat] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [teamPickerVisible, setTeamPickerVisible] = useState(false);
  const [selectingTeamId, setSelectingTeamId] = useState<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const canSwitchTeam = memberships.length > 1;
  const canCreateUpdate = canEditPlayMetadata(selectedTeamMemberRole);

  const handleSelectTeam = async (teamId: string) => {
    setSelectingTeamId(teamId);
    await selectTeam(teamId);
    setSelectingTeamId(null);
    setTeamPickerVisible(false);
  };

  const loadFeaturedUpdate = useCallback(async (teamId: string) => {
    try {
      const update = await fetchLatestTeamUpdate(teamId);

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

  const loadChatSummary = useCallback(async (teamId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoadingChat(true);
    }

    try {
      const summary = await fetchLatestTeamMessageSummary(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setChatSummary(summary);
    } catch {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setChatSummary(null);
    } finally {
      if (!silent && selectedTeamIdRef.current === teamId) {
        setLoadingChat(false);
      }
    }
  }, []);

  const loadNextEvent = useCallback(async (teamId: string) => {
    try {
      const event = await fetchNextUpcomingTeamEvent(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setNextEvent(event);
    } catch {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setNextEvent(null);
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setLoadingCalendar(false);
      }
    }
  }, []);

  const loadHomeDashboard = useCallback(
    (teamId: string) => {
      setLoadingFeatured(true);
      setLoadingChat(true);
      setLoadingCalendar(true);
      void loadFeaturedUpdate(teamId);
      void loadChatSummary(teamId);
      void loadNextEvent(teamId);
    },
    [loadChatSummary, loadFeaturedUpdate, loadNextEvent],
  );

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setFeaturedUpdate(null);
        setChatSummary(null);
        setNextEvent(null);
        setLoadingFeatured(false);
        setLoadingChat(false);
        setLoadingCalendar(false);
        return;
      }

      loadHomeDashboard(teamId);

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
    }, [loadFeaturedUpdate, loadHomeDashboard, selectedTeam?.id]),
  );

  useEffect(() => {
    const teamId = selectedTeam?.id;

    if (!teamId) {
      return;
    }

    void loadChatSummary(teamId, { silent: true });
  }, [loadChatSummary, selectedTeam?.id, unreadCount]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        dashboard: {
          gap: spacing.xxl,
        },
        section: {
          gap: spacing.sm,
        },
        sectionLabel: {
          ...typography.label,
          color: palette.text.label,
          marginLeft: spacing.xs,
        },
        sectionHeaderRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xs,
        },
        sectionHeaderLabel: {
          ...typography.label,
          color: palette.text.label,
        },
        addUpdateAction: {
          ...typography.label,
          color: palette.accent.default,
          fontWeight: typography.subheading.fontWeight,
        },
        addUpdateActionPressed: {
          opacity: 0.75,
        },
        sectionCard: {
          ...cardPresets.default.container,
          marginBottom: 0,
        },
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
        teamName: {
          ...typography.heading,
          color: palette.text.primary,
        },
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
        cardText: {
          ...typography.subheading,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
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
          color: palette.text.primary,
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
      }),
    [cardPresets, palette],
  );

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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>Recent Update</Text>
            {canCreateUpdate ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add team update"
                onPress={() => navigation.navigate('Updates', { openCreate: true })}
                style={({ pressed }) => [pressed && styles.addUpdateActionPressed]}
              >
                <Text style={styles.addUpdateAction}>+ Add</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => navigation.navigate('Updates', {})}
            style={({ pressed }) => [pressed && styles.cardPressed]}
          >
            <Card title="Team Update">
              {loadingFeatured ? (
                <View style={styles.featuredLoading}>
                  <ActivityIndicator size="small" color={palette.accent.default} />
                </View>
              ) : featuredUpdate ? (
                <>
                  <Text style={styles.cardText}>
                    {previewTeamUpdateBody(featuredUpdate.body, 200)}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatTeamUpdateDate(featuredUpdate.created_at)}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardSubtext}>No team updates yet.</Text>
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
              {loadingChat ? (
                <View style={styles.featuredLoading}>
                  <ActivityIndicator size="small" color={palette.accent.default} />
                </View>
              ) : chatSummary ? (
                <>
                  <Text style={styles.cardText}>{chatSummary.channelLabel}</Text>
                  <Text style={styles.cardSubtext}>{chatSummary.previewLine}</Text>
                  <Text style={styles.cardMeta}>
                    {formatTeamUpdateDate(chatSummary.created_at)}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardSubtext}>All caught up — open Chat</Text>
              )}
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
              {loadingCalendar ? (
                <View style={styles.featuredLoading}>
                  <ActivityIndicator size="small" color={palette.accent.default} />
                </View>
              ) : nextEvent ? (
                <>
                  <Text style={styles.cardText}>{nextEvent.title}</Text>
                  <Text style={styles.cardSubtext}>
                    {formatTeamEventListDate(nextEvent.starts_at, nextEvent.ends_at)} ·{' '}
                    {formatTeamEventListTimeRange(nextEvent.starts_at, nextEvent.ends_at)}
                  </Text>
                  {nextEvent.location?.trim() ? (
                    <Text style={styles.cardMeta}>{nextEvent.location.trim()}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.cardSubtext}>No upcoming events</Text>
              )}
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

