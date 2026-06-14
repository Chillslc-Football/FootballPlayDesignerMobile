import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type PlaceholderTextProps = {
  message: string;
};

export function PlaceholderText({ message }: PlaceholderTextProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  text: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
