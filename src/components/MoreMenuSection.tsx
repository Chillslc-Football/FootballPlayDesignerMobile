import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../design-system/AppThemeProvider';

type MoreMenuSectionProps = {
  title: string;
  children: ReactNode;
};

export function MoreMenuSection({ title, children }: MoreMenuSectionProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: 8,
        },
        title: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.gold,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginLeft: 4,
        },
        menu: {
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          overflow: 'hidden',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.menu}>{children}</View>
    </View>
  );
}
