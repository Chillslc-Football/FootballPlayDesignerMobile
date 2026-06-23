import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';
import type { AudienceMentionOption } from '../../utils/teamMessageMentionAutocomplete';

type AudienceMentionMenuProps = {
  options: AudienceMentionOption[];
  onSelect: (option: AudienceMentionOption) => void;
};

export function AudienceMentionMenu({ options, onSelect }: AudienceMentionMenuProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Pressable
          key={option.audience}
          style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
          onPress={() => onSelect(option)}
        >
          <Text style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 8,
    overflow: 'hidden',
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  optionRowPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  optionDescription: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
});
