import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenContainer } from '../../components/ScreenContainer';
import { iconSizes } from '../../design-system';
import { ProfileAvatar } from '../../components/roster/ProfileAvatar';
import {
  createCustomGroupThread,
  fetchLatestMessagesByThreadIds,
  getOrCreateDirectMessageThread,
  getOrCreateTeamChatThread,
  listAccessibleTeamMessageThreads,
  listDirectMessageThreads,
} from '../../lib/teamMessageRepository';
import { useAvatarSignedUrlMap } from '../../hooks/useAvatarSignedUrlMap';
import { MessagesStackParamList } from '../../navigation/MessagesStack';
import { useTeam } from '../../team/TeamProvider';
import {
  formatUnreadTabBadge,
  useTeamMessageUnread,
} from '../../team/TeamMessageUnreadProvider';
import { colors } from '../../theme';
import type {
  DirectMessageThreadWithUnread,
  TeamMessage,
  TeamMessageThreadKind,
  TeamMessageThreadWithUnread,
} from '../../types/teamMessage';
import {
  clearPendingTeamMessageNavigation,
  peekPendingTeamMessageNavigation,
} from '../../notifications/teamMessageNotificationNavigation';
import {
  EMPTY_CONVERSATION_PREVIEW,
  formatConversationListTitle,
  formatConversationPreviewLine,
  formatConversationTimestamp,
  buildAutoGroupNameFromLabels,
  isComposePickerGroupThread,
  isDirectMessageThread,
  isVisibleConversationListThread,
  isVisibleGroupsListThread,
  sortComposePickerGroupTargets,
  sortGroupConversationsWithTeamChatFirst,
  validateComposeSelection,
} from '../../utils/teamMessageDisplay';
import { CreateGroupSheet } from './CreateGroupSheet';
import {
  ComposeGroupTarget,
  ComposePersonTarget,
  ComposeTarget,
  NewMessagePicker,
} from './NewMessagePicker';

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList, 'ConversationList'>;

type ChatListFilter = 'all' | 'unread' | 'dms' | 'groups';

type FilterPillOption = 'unread' | 'dms' | 'groups';

type ComposePickerMode = 'dm' | 'create-group';

type ConversationListItem = {
  id: string;
  title: string;
  threadKind: TeamMessageThreadKind;
  unreadCount: number;
  lastMessageAt: string | null;
  avatarDisplayName: string;
  avatarSignedUrl?: string | null;
};

function toConversationListItem(
  thread: TeamMessageThreadWithUnread | DirectMessageThreadWithUnread,
): ConversationListItem {
  const title = formatConversationListTitle(thread);
  const isDirect = thread.thread_kind === 'direct';
  const directThread = isDirect ? (thread as DirectMessageThreadWithUnread) : null;

  return {
    id: thread.id,
    title,
    threadKind: thread.thread_kind,
    unreadCount: thread.unread_count,
    lastMessageAt: thread.last_message_at,
    avatarDisplayName: isDirect
      ? (directThread?.other_display_name?.trim() || title)
      : title,
    avatarSignedUrl: null,
  };
}

function resolveNextFilter(current: ChatListFilter, pressed: FilterPillOption): ChatListFilter {
  if (pressed === 'unread') {
    return current === 'unread' ? 'all' : 'unread';
  }

  if (pressed === 'dms') {
    return current === 'dms' ? 'all' : 'dms';
  }

  return current === 'groups' ? 'all' : 'groups';
}

function filterConversations(
  items: ConversationListItem[],
  activeFilter: ChatListFilter,
): ConversationListItem[] {
  switch (activeFilter) {
    case 'unread':
      return items.filter(
        (item) => item.unreadCount > 0 && isVisibleConversationListThread(item.threadKind),
      );
    case 'dms':
      return items.filter((item) => isDirectMessageThread(item.threadKind));
    case 'groups':
      return items.filter((item) => isVisibleGroupsListThread(item.threadKind));
    default:
      return items.filter((item) => isVisibleConversationListThread(item.threadKind));
  }
}

function getEmptyStateCopy(activeFilter: ChatListFilter): {
  title: string;
  subtitle?: string;
} {
  switch (activeFilter) {
    case 'unread':
      return { title: 'No unread messages' };
    case 'dms':
      return { title: 'No direct messages yet' };
    case 'groups':
      return {
        title: 'No groups yet',
        subtitle: 'Team Chat is your default group conversation.',
      };
    default:
      return {
        title: 'No conversations yet',
        subtitle: 'Team channels and direct messages will appear here.',
      };
  }
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterPill,
        active && styles.filterPillActive,
        pressed && styles.filterPillPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[styles.filterPillText, active && styles.filterPillTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function sortConversations(items: ConversationListItem[]): ConversationListItem[] {
  return [...items].sort((left, right) => {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' });
  });
}

function ConversationRow({
  title,
  preview,
  timestamp,
  unreadCount,
  onPress,
  signedUrl = null,
  displayName,
}: {
  title: string;
  preview: string;
  timestamp: string | null;
  unreadCount: number;
  onPress: () => void;
  signedUrl?: string | null;
  displayName: string;
}) {
  const unreadBadge = formatUnreadTabBadge(unreadCount);
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.conversationRow, pressed && styles.conversationRowPressed]}
      onPress={onPress}
    >
      <ProfileAvatar signedUrl={signedUrl} displayName={displayName} size="lg" />
      <View style={styles.conversationContent}>
        <View style={styles.conversationTopRow}>
          <Text
            style={[styles.conversationTitle, hasUnread && styles.conversationTitleUnread]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {timestamp ? (
            <Text style={[styles.conversationTimestamp, hasUnread && styles.conversationTimestampUnread]}>
              {timestamp}
            </Text>
          ) : null}
        </View>
        <View style={styles.conversationBottomRow}>
          <Text
            style={[styles.conversationPreview, hasUnread && styles.conversationPreviewUnread]}
            numberOfLines={2}
          >
            {preview}
          </Text>
          {unreadBadge ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadBadge}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function buildConversationPreview(
  item: ConversationListItem,
  latestMessage: TeamMessage | undefined,
): string {
  if (!latestMessage) {
    return EMPTY_CONVERSATION_PREVIEW;
  }

  return formatConversationPreviewLine(
    item.threadKind,
    latestMessage.sender_name,
    latestMessage.body,
  );
}

function buildConversationTimestamp(
  item: ConversationListItem,
  latestMessage: TeamMessage | undefined,
): string | null {
  const iso = latestMessage?.created_at ?? item.lastMessageAt;

  if (!iso) {
    return null;
  }

  return formatConversationTimestamp(iso);
}

export function ConversationListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { selectedTeam } = useTeam();
  const { refreshUnreadCount } = useTeamMessageUnread();
  const [channels, setChannels] = useState<TeamMessageThreadWithUnread[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessageThreadWithUnread[]>([]);
  const [latestMessagesByThreadId, setLatestMessagesByThreadId] = useState<
    Map<string, TeamMessage>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [continuingCompose, setContinuingCompose] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [composePickerMode, setComposePickerMode] = useState<ComposePickerMode | null>(null);
  const [activeFilter, setActiveFilter] = useState<ChatListFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);
  const appliedPendingThreadIdRef = useRef<string | null>(null);

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
      await getOrCreateTeamChatThread(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const [loadedChannels, loadedDirectMessages] = await Promise.all([
        listAccessibleTeamMessageThreads(teamId),
        listDirectMessageThreads(teamId),
      ]);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const allThreads = [...loadedChannels, ...loadedDirectMessages];
      const threadIds = allThreads.map((thread) => thread.id);
      const loadedPreviews = await fetchLatestMessagesByThreadIds(teamId, threadIds);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setChannels(loadedChannels);
      setDirectMessages(loadedDirectMessages);
      setLatestMessagesByThreadId(loadedPreviews);
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
        setLatestMessagesByThreadId(new Map());
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
        setLatestMessagesByThreadId(new Map());
        setError(null);
        setLoading(false);
        setComposePickerMode(null);
        setActiveFilter('all');
        loadedTeamIdRef.current = null;
        return;
      }

      const isFirstLoadForTeam = loadedTeamIdRef.current !== teamId;

      void loadConversations(teamId, { silent: !isFirstLoadForTeam });
      void refreshUnreadCount();
    }, [loadConversations, refreshUnreadCount, selectedTeam?.id]),
  );

  useEffect(() => {
    appliedPendingThreadIdRef.current = null;
    setActiveFilter('all');
  }, [selectedTeam?.id]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const pending = peekPendingTeamMessageNavigation();

    if (!pending?.threadId) {
      return;
    }

    const teamId = selectedTeam?.id;

    if (!teamId || pending.teamId !== teamId) {
      return;
    }

    if (appliedPendingThreadIdRef.current === pending.threadId) {
      return;
    }

    const allThreads = [...channels, ...directMessages];
    const matchedThread = allThreads.find((thread) => thread.id === pending.threadId);

    if (!matchedThread) {
      clearPendingTeamMessageNavigation();
      return;
    }

    appliedPendingThreadIdRef.current = pending.threadId;
    openChatThread(matchedThread.id, formatConversationListTitle(matchedThread));
    clearPendingTeamMessageNavigation();
  }, [loading, channels, directMessages, openChatThread, selectedTeam?.id]);

  const handleSelectConversation = (item: ConversationListItem) => {
    openChatThread(item.id, item.title);
  };

  const openCreateGroupFlow = () => {
    const teamId = selectedTeamIdRef.current;

    if (!teamId) {
      setError('Select a team to create a group.');
      return;
    }

    setComposePickerMode('create-group');
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    const teamId = selectedTeamIdRef.current;

    if (!teamId) {
      throw new Error('Select a team to create a group.');
    }

    if (creatingGroup) {
      if (__DEV__) {
        console.log('[ConversationListScreen] create group ignored; already creating');
      }
      return;
    }

    if (__DEV__) {
      console.log('[ConversationListScreen] create group submit', {
        teamId,
        name,
        memberIds,
      });
    }

    setCreatingGroup(true);

    try {
      const thread = await createCustomGroupThread(teamId, name, memberIds);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setComposePickerMode(null);
      await loadConversations(teamId, { silent: true });
      openChatThread(thread.id, formatConversationListTitle(thread));
    } catch (createError) {
      if (selectedTeamIdRef.current !== teamId) {
        throw createError;
      }

      const message =
        createError instanceof Error ? createError.message : 'Failed to create group.';
      throw new Error(message);
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setCreatingGroup(false);
      }
    }
  };

  const subtitle = selectedTeam?.name ? selectedTeam.name : undefined;

  const directMessageAvatarPaths = useMemo(
    () => directMessages.map((thread) => thread.other_avatar_url),
    [directMessages],
  );
  const { signedUrlsByPath } = useAvatarSignedUrlMap(directMessageAvatarPaths);

  const conversations = useMemo(() => {
    const channelItems = channels.map(toConversationListItem);
    const directItems = directMessages.map((thread) => {
      const item = toConversationListItem(thread);

      return {
        ...item,
        avatarSignedUrl: thread.other_avatar_url
          ? (signedUrlsByPath.get(thread.other_avatar_url) ?? null)
          : null,
      };
    });

    return sortConversations([...channelItems, ...directItems]);
  }, [channels, directMessages, signedUrlsByPath]);

  const filteredConversations = useMemo(() => {
    const filtered = filterConversations(conversations, activeFilter);

    if (activeFilter === 'groups') {
      return sortGroupConversationsWithTeamChatFirst(filtered);
    }

    return filtered;
  }, [activeFilter, conversations]);

  const emptyStateCopy = getEmptyStateCopy(activeFilter);
  const showGroupsActions = activeFilter === 'groups';

  const handleFilterPress = (filter: FilterPillOption) => {
    setActiveFilter((current) => resolveNextFilter(current, filter));
  };

  const handleComposePress = () => {
    setComposePickerMode('dm');
  };

  const composeGroupTargets = useMemo((): ComposeGroupTarget[] => {
    return sortComposePickerGroupTargets(
      channels
        .filter((thread) => isComposePickerGroupThread(thread.thread_kind))
        .map((thread) => ({
          kind: 'group',
          id: thread.id,
          title: formatConversationListTitle(thread),
          threadKind: thread.thread_kind,
        })),
    );
  }, [channels]);

  const handleComposeContinue = async (selected: ComposeTarget[]) => {
    const teamId = selectedTeamIdRef.current;

    if (!teamId || continuingCompose) {
      return;
    }

    const validationError = validateComposeSelection(selected);

    if (validationError) {
      throw new Error(validationError);
    }

    const groups = selected.filter(
      (target): target is ComposeGroupTarget => target.kind === 'group',
    );
    const people = selected.filter(
      (target): target is ComposePersonTarget => target.kind === 'person',
    );

    setContinuingCompose(true);
    setError(null);

    try {
      if (groups.length === 1 && people.length === 0) {
        setComposePickerMode(null);
        openChatThread(groups[0].id, groups[0].title);
        return;
      }

      if (groups.length === 0 && people.length === 1) {
        setComposePickerMode(null);

        const thread = await getOrCreateDirectMessageThread(teamId, people[0].userId);

        if (selectedTeamIdRef.current !== teamId) {
          return;
        }

        await loadConversations(teamId, { silent: true });
        openChatThread(thread.id, people[0].title);
        return;
      }

      if (groups.length === 0 && people.length >= 2) {
        setComposePickerMode(null);

        const groupName = buildAutoGroupNameFromLabels(people.map((person) => person.title));
        const thread = await createCustomGroupThread(
          teamId,
          groupName,
          people.map((person) => person.userId),
        );

        if (selectedTeamIdRef.current !== teamId) {
          return;
        }

        await loadConversations(teamId, { silent: true });
        openChatThread(thread.id, formatConversationListTitle(thread));
        return;
      }

      throw new Error('Select one group, one person, or multiple people to message together.');
    } catch (continueError) {
      if (selectedTeamIdRef.current !== teamId) {
        throw continueError;
      }

      const message =
        continueError instanceof Error ? continueError.message : 'Failed to start conversation.';
      throw new Error(message);
    } finally {
      if (selectedTeamIdRef.current === teamId) {
        setContinuingCompose(false);
      }
    }
  };

  const handleCreateGroupPress = () => {
    openCreateGroupFlow();
  };

  const isCreateGroupOpen = composePickerMode === 'create-group';
  const isDirectMessageOpen = composePickerMode === 'dm';

  return (
    <>
    <ScreenContainer title="Chat" subtitle={subtitle} scrollable={false}>
      <View style={styles.filterToolbar}>
        <View style={styles.filterPills} pointerEvents="box-none">
          <FilterPill
            label="Unread"
            active={activeFilter === 'unread'}
            onPress={() => handleFilterPress('unread')}
          />
          <FilterPill
            label="DMs"
            active={activeFilter === 'dms'}
            onPress={() => handleFilterPress('dms')}
          />
          <FilterPill
            label="Groups"
            active={activeFilter === 'groups'}
            onPress={() => handleFilterPress('groups')}
          />
        </View>
        <View style={styles.headerActions} pointerEvents="box-none">
          {showGroupsActions ? (
            <Pressable
              style={({ pressed }) => [
                styles.headerIconButton,
                pressed && styles.headerIconButtonPressed,
              ]}
              onPress={handleCreateGroupPress}
              disabled={creatingGroup}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Create group"
            >
              {creatingGroup ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="people-outline" size={iconSizes.lg} color={colors.accent} />
              )}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.headerIconButton,
                (pressed || continuingCompose) && styles.headerIconButtonPressed,
              ]}
              onPress={handleComposePress}
              disabled={continuingCompose || !selectedTeam?.id}
              accessibilityRole="button"
              accessibilityLabel="New message"
            >
              {continuingCompose ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="create-outline" size={iconSizes.lg} color={colors.accent} />
              )}
            </Pressable>
          )}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{emptyStateCopy.title}</Text>
          {emptyStateCopy.subtitle ? (
            <Text style={styles.emptyText}>{emptyStateCopy.subtitle}</Text>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredConversations.map((conversation, index) => {
            const latestMessage = latestMessagesByThreadId.get(conversation.id);

            return (
              <View key={conversation.id}>
                {index > 0 ? <View style={styles.rowDivider} /> : null}
                <ConversationRow
                  title={conversation.title}
                  preview={buildConversationPreview(conversation, latestMessage)}
                  timestamp={buildConversationTimestamp(conversation, latestMessage)}
                  unreadCount={conversation.unreadCount}
                  signedUrl={conversation.avatarSignedUrl}
                  displayName={conversation.avatarDisplayName}
                  onPress={() => handleSelectConversation(conversation)}
                />
              </View>
            );
          })}
        </ScrollView>
      )}

    </ScreenContainer>

      <Modal
        visible={isCreateGroupOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComposePickerMode(null)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {selectedTeam?.id ? (
            <View style={styles.modalContainer}>
              <CreateGroupSheet
                teamId={selectedTeam.id}
                creating={creatingGroup}
                onCreateGroup={handleCreateGroup}
                onClose={() => setComposePickerMode(null)}
              />
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isDirectMessageOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComposePickerMode(null)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {selectedTeam?.id ? (
            <View style={styles.modalContainer}>
              <NewMessagePicker
                teamId={selectedTeam.id}
                groupTargets={composeGroupTargets}
                continuing={continuingCompose}
                onContinue={handleComposeContinue}
                onClose={() => setComposePickerMode(null)}
              />
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -12,
    marginBottom: 10,
  },
  filterPills: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  filterPill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterPillPressed: {
    opacity: 0.85,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  filterPillTextActive: {
    color: colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    zIndex: 2,
    elevation: 2,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonPressed: {
    opacity: 0.7,
  },
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cardBorder,
    marginLeft: 72,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    minHeight: 76,
  },
  conversationRowPressed: {
    opacity: 0.75,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  conversationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  conversationTitleUnread: {
    fontWeight: '700',
  },
  conversationTimestamp: {
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 0,
  },
  conversationTimestampUnread: {
    color: colors.accent,
    fontWeight: '600',
  },
  conversationBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationPreview: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textMuted,
  },
  conversationPreviewUnread: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
});
