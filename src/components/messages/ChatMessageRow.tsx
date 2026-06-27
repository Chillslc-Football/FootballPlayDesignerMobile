import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';
import type { TeamMessage } from '../../types/teamMessage';
import { formatTeamUpdateDate } from '../../utils/teamUpdateDisplay';
import { TeamMessageBody } from '../TeamMessageBody';
import { ProfileAvatar } from '../roster/ProfileAvatar';

type ChatMessageRowProps = {
  message: TeamMessage;
  senderLabel: string;
  signedUrl?: string | null;
};

export function ChatMessageRow({ message, senderLabel, signedUrl = null }: ChatMessageRowProps) {
  return (
    <View style={styles.messageCard}>
      <ProfileAvatar
        signedUrl={signedUrl}
        displayName={message.sender_name}
        size="sm"
      />
      <View style={styles.messageContent}>
        <Text style={styles.messageMeta}>
          {senderLabel} · {formatTeamUpdateDate(message.created_at)}
        </Text>
        <TeamMessageBody body={message.body} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 12,
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
  },
  messageMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 6,
  },
});
