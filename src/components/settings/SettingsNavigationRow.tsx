import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';

type SettingsNavigationRowProps = {
  label: string;
  detail?: string;
  onPress: () => void;
  isLast?: boolean;
};

export function SettingsNavigationRow({
  label,
  detail,
  onPress,
  isLast = false,
}: SettingsNavigationRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
          gap: 12,
        },
        itemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        itemPressed: {
          backgroundColor: colors.surface,
        },
        label: {
          fontSize: 17,
          fontWeight: '500',
          color: colors.text,
        },
        detail: {
          flex: 1,
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: 'right',
        },
        chevron: {
          fontSize: 22,
          color: colors.textMuted,
          fontWeight: '300',
        },
      }),
    [colors],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        !isLast && styles.itemBorder,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
