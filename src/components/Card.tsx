import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../design-system/AppThemeProvider';

type CardProps = {
  title: string;
  children: ReactNode;
};

export function Card({ title, children }: CardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: 16,
          marginBottom: 16,
        },
        title: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.gold,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 10,
        },
        body: {
          gap: 4,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}
