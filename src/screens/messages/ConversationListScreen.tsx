import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getConversationTitle } from '../../constants/teamChatConstants';
import { ScreenContainer } from '../../components/ScreenContainer';
import {
  getOrCreateDirectMessageThread,
  listAccessibleTeamMessageThreads,
  listDirectMessageThreads,
} from '../../lib/teamMessageRepository';
import { MessagesStackParamList } from '../../navigation/MessagesStack';
import { useTeam } from '../../team/TeamProvider';
import {
  formatUnreadTabBadge,
  useTeamMessageUnread,
} from '../../team/TeamMessageUnreadProvider';
import { colors } from '../../theme';
import type {
  DirectMessageEligibleMember,
  DirectMessageThreadWithUnread,
  TeamMessageThreadWithUnread,
} from '../../types/teamMessage';
import { NewMessagePicker } from './NewMessagePicker';

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;

function ConversationRow({
  title,
  unreadCount,
  onPress,
}: {
  title: string;
  unreadCount: number;
  onPress: () => void;
}) {
  const unreadBadge = formatUnreadTabBadge(unreadCount);

  return (
    <Pressable
      style={({ pressed }) => [styles.conversationRow, pressed && styles.conversationRowPressed]}
      onPress={onPress}
    >
      <View style={styles.conversationMain}>
        <Text style={styles.conversationTitle}>{title}</Text>
        {unreadBadge ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadBadge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.conversationChevron}>›</Text>
    </Pressable>
  );
}

function memberLabel(member: DirectMessageEligibleMember): string {
  const name = member.display_name?.trim();

  if (name) {
    return name;
  }

  return 'Team member';
}

export function ConversationListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { selectedTeam } = useTeam();
  const { refreshUnreadCount } = useTeamMessageUnread();
  const [channels, setChannels] = useState<TeamMessageThreadWithUnread[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessageThreadWithUnread[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingDirectMessage, setStartingDirectMessage] = useState(false);
  const [showNewMessagePicker, setShowNewMessagePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const openChatThread = useCallback(
    (threadId: string, threadTitle: string) => {
      navigation.navigate('ChatThread', {
        threadId,
        threadTitle,
      });
    },
    [navigation],
  );

  const loadConversations = useCallback(async (teamId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const [loadedChannels, loadedDirectMessages] = await Promise.all([
        listAccessibleTeamMessageThreads(teamId),
        listDirectMessageThreads(teamId),
      ]);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setChannels(loadedChannels);
      setDirectMessages(loadedDirectMessages);
      setError(null);
      loadedTeamIdRef.current = teamId;
    } catch (loadError) {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load conversations.';
      setError(message);

      if (!silent) {
        setChannels([]);
        setDirectMessages([]);
      }
    } finally {
      if (!silent && selectedTeamIdRef.current === teamId) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setChannels([]);
        setDirectMessages([]);
        setError(null);
        setLoading(false);
        setShowNewMessagePicker(false);
        loadedTeamIdRef.current = null;
        return;
      }

      const isFirstLoadForTeam = loadedTeamIdRef.current !== teamId;

      void loadConversations(teamId, { silent: !isFirstLoadForTeam });
      void refreshUnreadCount();
    }, [loadConversations, refreshUnreadCount, selectedTeam?.id]),
  );

  const handleSelectChannel = (channel: TeamMessageThreadWithUnread) => {
    openChatThread(channel.id, getConversationTitle(channel));
  };

  const handleSelectDirectMessage = (thread: DirectMessageThreadWithUnread) => {
    openChatThread(thread.id, getConversationTitle(thread));
  };

  const handleStartDirectMessage = async (member: DirectMessageEligibleMember) => {
    const teamId = selectedTeam?.id;

    if (!teamId || startingDirectMessage) {
      return;
    }

    setShowNewMessagePicker(false);
    setStartingDirectMessage(true);
    setError(null);

    try {
      const thread = await getOrCreateDirectMessageThread(teamId, member.user_id);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      await loadConversations(teamId, { silent: true });
      openChatThread(thread.id, memberLabel(member));
    } catch (startError) {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const message =
        startError instanceof Error ? startError.message : 'Failed to start direct message.';
      setError(message);
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setStartingDirectMessage(false);
      }
    }
  };

  const subtitle = selectedTeam?.name ? selectedTeam.name : undefined;

  return (
    <ScreenContainer title="Messages" subtitle={subtitle} scrollable={false}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeading}>Channels</Text>
          {channels.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No message channels available.</Text>
            </View>
          ) : (
            channels.map((channel) => (
              <ConversationRow
                key={channel.id}
                title={getConversationTitle(channel)}
                unreadCount={channel.unread_count}
                onPress={() => handleSelectChannel(channel)}
              />
            ))
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Direct Messages</Text>
            <Pressable
              style={({ pressed }) => [
                styles.newMessageButton,
                (pressed || startingDirectMessage) && styles.newMessageButtonPressed,
              ]}
              onPress={() => setShowNewMessagePicker((current) => !current)}
              disabled={startingDirectMessage}
            >
              {startingDirectMessage ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.newMessageButtonText}>+ New Message</Text>
              )}
            </Pressable>
          </View>

          {showNewMessagePicker && selectedTeam?.id ? (
            <NewMessagePicker
              teamId={selectedTeam.id}
              onSelectMember={handleStartDirectMessage}
              onClose={() => setShowNewMessagePicker(false)}
            />
          ) : null}

          {directMessages.length === 0 ? (
            <Text style={styles.directEmptyText}>No direct messages yet.</Text>
          ) : (
            directMessages.map((thread) => (
              <ConversationRow
                key={thread.id}
                title={getConversationTitle(thread)}
                unreadCount={thread.unread_count}
                onPress={() => handleSelectDirectMessage(thread)}
              />
            ))
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  error: {
    fontSize: 15,
    color: colors.gold,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  newMessageButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMessageButtonPressed: {
    opacity: 0.85,
  },
  newMessageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.background,
  },
  directEmptyText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingBottom: 8,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  conversationRowPressed: {
    opacity: 0.85,
  },
  conversationMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  conversationTitle: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
  },
  conversationChevron: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.textMuted,
    marginLeft: 8,
  },
});
