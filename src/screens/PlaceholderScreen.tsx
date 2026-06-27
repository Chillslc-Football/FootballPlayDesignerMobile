import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { typography } from '../design-system';
import { useAppTheme } from '../design-system/AppThemeProvider';

type PlaceholderScreenProps = {
  title: string;
  message: string;
};

export function PlaceholderScreen({ title, message }: PlaceholderScreenProps) {
  const { palette, cardPresets } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        messageCard: {
          ...cardPresets.default.container,
          marginBottom: 0,
        },
        message: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
      }),
    [cardPresets, palette],
  );

  return (
    <ScreenContainer title={title}>
      <View style={styles.messageCard}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </ScreenContainer>
  );
}
