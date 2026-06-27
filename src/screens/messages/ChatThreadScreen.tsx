import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatMessageRow } from '../../components/messages/ChatMessageRow';
import { useAuth } from '../../auth/AuthProvider';
import { useAvatarSignedUrlMap } from '../../hooks/useAvatarSignedUrlMap';
import {
  fetchTeamMessagesByThread,
  listDmEligibleMembers,
  markThreadRead,
  sendTeamMessage,
  subscribeTeamMessagesByThread,
} from '../../lib/teamMessageRepository';
import { MessagesStackParamList } from '../../navigation/MessagesStack';
import { useTeam } from '../../team/TeamProvider';
import { useTeamMessageUnread } from '../../team/TeamMessageUnreadProvider';
import { colors } from '../../theme';
import type { DirectMessageEligibleMember, PickedUserMention, TeamMessage } from '../../types/teamMessage';
import { encodeMessageBodyForStorage } from '../../utils/teamMessageMentionUtils';
import {
  buildPickedUserMention,
  filterMentionSuggestions,
  getActiveMentionQuery,
  insertMentionToken,
  type MentionSuggestion,
} from '../../utils/teamMessageMentionAutocomplete';
import { MentionMenu } from './MentionMenu';

type Props = NativeStackScreenProps<MessagesStackParamList, 'ChatThread'>;

function senderLabel(message: TeamMessage, currentUserId: string | undefined): string {
  if (currentUserId && message.sender_id === currentUserId) {
    return 'You';
  }

  return message.sender_name ?? 'Team member';
}

export function ChatThreadScreen({ route }: Props) {
  const { threadId, threadTitle } = route.params;
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { selectedTeam } = useTeam();
  const { refreshUnreadCount } = useTeamMessageUnread();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pickedUserMentions, setPickedUserMentions] = useState<PickedUserMention[]>([]);
  const [mentionMembers, setMentionMembers] = useState<DirectMessageEligibleMember[]>([]);
  const [composeCursorPosition, setComposeCursorPosition] = useState(0);
  const [composeSelection, setComposeSelection] = useState({ start: 0, end: 0 });
  const [mentionMenuForceHidden, setMentionMenuForceHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedThreadKeyRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);
  const threadIdRef = useRef(threadId);
  const lastMarkedReadMessageIdRef = useRef<string | null>(null);
  const listRef = useRef<FlatList<TeamMessage> | null>(null);
  const composeInputRef = useRef<TextInput | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;
  threadIdRef.current = threadId;

  const activeMentionQuery = useMemo(
    () => getActiveMentionQuery(draft, composeCursorPosition),
    [composeCursorPosition, draft],
  );

  const mentionSuggestions = useMemo(() => {
    if (!activeMentionQuery || mentionMenuForceHidden) {
      return [];
    }

    return filterMentionSuggestions(activeMentionQuery.query, mentionMembers);
  }, [activeMentionQuery, mentionMembers, mentionMenuForceHidden]);

  const showMentionMenu = mentionSuggestions.length > 0 && activeMentionQuery !== null;

  const senderAvatarPaths = useMemo(
    () => messages.map((message) => message.sender_avatar_url),
    [messages],
  );
  const { signedUrlsByPath } = useAvatarSignedUrlMap(senderAvatarPaths);

  const scrollToLatestMessage = useCallback(() => {
    if (messages.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const loadChat = useCallback(
    async (teamId: string, activeThreadId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const loadedMessages = await fetchTeamMessagesByThread(teamId, activeThreadId);

        if (selectedTeamIdRef.current !== teamId || threadIdRef.current !== activeThreadId) {
          return;
        }

        setMessages(loadedMessages);
        setError(null);
        loadedThreadKeyRef.current = `${teamId}:${activeThreadId}`;
      } catch (loadError) {
        if (selectedTeamIdRef.current !== teamId || threadIdRef.current !== activeThreadId) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load team messages.';
        setError(message);

        if (!silent) {
          setMessages([]);
        }
      } finally {
        if (
          !silent &&
          selectedTeamIdRef.current === teamId &&
          threadIdRef.current === activeThreadId
        ) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const markMessagesReadThroughLatest = useCallback(async () => {
    const activeThreadId = threadIdRef.current;

    if (!activeThreadId || messages.length === 0) {
      return;
    }

    const latestMessage = messages[messages.length - 1];

    if (lastMarkedReadMessageIdRef.current === latestMessage.id) {
      return;
    }

    lastMarkedReadMessageIdRef.current = latestMessage.id;

    try {
      await markThreadRead(activeThreadId, latestMessage.id);
      await refreshUnreadCount();
    } catch {
      lastMarkedReadMessageIdRef.current = null;
    }
  }, [messages, refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setMessages([]);
        setError(null);
        setLoading(false);
        loadedThreadKeyRef.current = null;
        lastMarkedReadMessageIdRef.current = null;
        return;
      }

      lastMarkedReadMessageIdRef.current = null;

      let cancelled = false;
      let unsubscribe: (() => void) | undefined;

      const initialize = async () => {
        const threadKey = `${teamId}:${threadId}`;
        const isFirstLoadForThread = loadedThreadKeyRef.current !== threadKey;
        await loadChat(teamId, threadId, { silent: !isFirstLoadForThread });

        if (cancelled || selectedTeamIdRef.current !== teamId || threadIdRef.current !== threadId) {
          return;
        }

        unsubscribe = subscribeTeamMessagesByThread(
          teamId,
          threadId,
          () => {
            if (selectedTeamIdRef.current !== teamId || threadIdRef.current !== threadId) {
              return;
            }

            void loadChat(teamId, threadId, { silent: true });
          },
          { channelName: `team-messages-screen:${teamId}:${threadId}` },
        );
      };

      void initialize();

      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    }, [loadChat, selectedTeam?.id, threadId]),
  );

  useEffect(() => {
    if (loading || messages.length === 0) {
      return;
    }

    void markMessagesReadThroughLatest();
  }, [loading, messages, markMessagesReadThroughLatest]);

  useEffect(() => {
    const teamId = selectedTeam?.id;

    if (!teamId) {
      setMentionMembers([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const members = await listDmEligibleMembers(teamId);

        if (!cancelled && selectedTeamIdRef.current === teamId) {
          setMentionMembers(members);
        }
      } catch {
        if (!cancelled && selectedTeamIdRef.current === teamId) {
          setMentionMembers([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTeam?.id]);

  const handleDraftChange = useCallback((nextDraft: string) => {
    setDraft(nextDraft);
    setMentionMenuForceHidden(false);
  }, []);

  const handleComposeSelectionChange = useCallback(
    (start: number, end: number) => {
      setComposeCursorPosition(end);
      setComposeSelection({ start, end });
    },
    [],
  );

  const applyMentionSelection = useCallback(
    (option: MentionSuggestion) => {
      if (!activeMentionQuery) {
        return;
      }

      const { nextBody, nextCursor } = insertMentionToken(
        draft,
        activeMentionQuery.startIndex,
        activeMentionQuery.endIndex,
        option.token,
      );

      setDraft(nextBody);
      if (option.kind === 'member') {
        setPickedUserMentions((current) => [...current, buildPickedUserMention(option)]);
      }
      setComposeCursorPosition(nextCursor);
      setComposeSelection({ start: nextCursor, end: nextCursor });
      setMentionMenuForceHidden(false);

      requestAnimationFrame(() => {
        composeInputRef.current?.focus();
      });
    },
    [activeMentionQuery, draft],
  );

  const handleSend = async () => {
    const teamId = selectedTeam?.id;
    const activeThreadId = threadIdRef.current;

    if (!teamId || !activeThreadId || !user) {
      return;
    }

    if (draft.trim().length === 0) {
      setError('Message cannot be empty.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const bodyForStorage = encodeMessageBodyForStorage(draft, pickedUserMentions);
      await sendTeamMessage(teamId, activeThreadId, user.id, bodyForStorage);
      setDraft('');
      setPickedUserMentions([]);
      setComposeCursorPosition(0);
      setComposeSelection({ start: 0, end: 0 });
      setMentionMenuForceHidden(false);
      await loadChat(teamId, activeThreadId, { silent: true });
      scrollToLatestMessage();
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Failed to send message.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const canSend = draft.trim().length > 0 && !sending && !loading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={
          Platform.OS === 'ios' ? headerHeight + tabBarHeight : 0
        }
      >
        {selectedTeam?.name ? (
          <Text style={styles.subtitle}>
            {threadTitle} · {selectedTeam.name}
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(message) => message.id}
            style={styles.messageList}
            contentContainerStyle={[
              styles.messageListContent,
              messages.length === 0 && styles.messageListContentEmpty,
            ]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToLatestMessage}
            ListEmptyComponent={
              !error ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No messages yet. Send the first message to your team.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item: message }) => (
              <ChatMessageRow
                message={message}
                senderLabel={senderLabel(message, user?.id)}
                signedUrl={
                  message.sender_avatar_url
                    ? (signedUrlsByPath.get(message.sender_avatar_url) ?? null)
                    : null
                }
              />
            )}
          />
        )}

        <SafeAreaView edges={['bottom']} style={styles.composerSafeArea}>
          <View style={styles.composer}>
            <View style={styles.composeField}>
              {showMentionMenu ? (
                <MentionMenu options={mentionSuggestions} onSelect={applyMentionSelection} />
              ) : null}
              <TextInput
                ref={composeInputRef}
                style={styles.input}
                value={draft}
                onChangeText={handleDraftChange}
                onSelectionChange={(event) => {
                  const { start, end } = event.nativeEvent.selection;
                  handleComposeSelectionChange(start, end);
                }}
                selection={composeSelection}
                placeholder="Write a message..."
                placeholderTextColor={colors.textMuted}
                multiline
                editable={!sending && !loading && Boolean(selectedTeam)}
                textAlignVertical="top"
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                (!canSend || pressed) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {sending ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    paddingTop: 4,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.textSecondary,
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
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingBottom: 16,
  },
  messageListContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
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
  composerSafeArea: {
    backgroundColor: colors.background,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  composeField: {
    flex: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
});
