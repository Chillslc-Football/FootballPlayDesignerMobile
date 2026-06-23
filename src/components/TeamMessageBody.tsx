import { StyleSheet, Text } from 'react-native';

import { colors } from '../theme';
import { splitTeamMessageBodyForDisplay } from '../utils/teamMessageMentionUtils';

type TeamMessageBodyProps = {
  body: string;
};

export function TeamMessageBody({ body }: TeamMessageBodyProps) {
  const segments = splitTeamMessageBodyForDisplay(body);

  return (
    <Text style={styles.body}>
      {segments.map((segment, index) =>
        segment.type === 'mention' ? (
          <Text key={`${index}-${segment.value}`} style={styles.mention}>
            {segment.value}
          </Text>
        ) : (
          <Text key={`${index}-text`}>{segment.value}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  mention: {
    fontWeight: '700',
    color: colors.accent,
  },
});
