import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatConversationListTitle } from '../../utils/teamMessageDisplay';
import { colors } from '../../theme';
import type { TeamMessageThreadWithUnread } from '../../types/teamMessage';

type GroupChannelPickerProps = {
  channels: TeamMessageThreadWithUnread[];
  onSelectChannel: (channel: TeamMessageThreadWithUnread) => void;
  onClose: () => void;
};

export function GroupChannelPicker({
  channels,
  onSelectChannel,
  onClose,
}: GroupChannelPickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a group</Text>
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>Cancel</Text>
        </Pressable>
      </View>

      {channels.length === 0 ? (
        <Text style={styles.statusText}>No group chats available.</Text>
      ) : (
        <ScrollView
          style={styles.channelList}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {channels.map((channel) => (
            <Pressable
              key={channel.id}
              style={({ pressed }) => [styles.channelRow, pressed && styles.channelRowPressed]}
              onPress={() => onSelectChannel(channel)}
            >
              <Text style={styles.channelName}>{formatConversationListTitle(channel)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  statusText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  channelList: {
    flex: 1,
  },
  channelRow: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  channelRowPressed: {
    opacity: 0.85,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
