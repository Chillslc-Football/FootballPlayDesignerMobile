import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';
import type { MentionSuggestion } from '../../utils/teamMessageMentionAutocomplete';

type MentionMenuProps = {
  options: MentionSuggestion[];
  onSelect: (option: MentionSuggestion) => void;
};

function getOptionKey(option: MentionSuggestion): string {
  return option.kind === 'audience' ? option.audience : option.userId;
}

export function MentionMenu({ options, onSelect }: MentionMenuProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {options.map((option) => (
          <Pressable
            key={getOptionKey(option)}
            style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
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
  list: {
    maxHeight: 220,
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
