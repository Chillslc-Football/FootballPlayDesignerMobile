import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../design-system/AppThemeProvider';

type MenuItemProps = {
  label: string;
  icon: string;
  onPress?: () => void;
  isLast?: boolean;
};

export function MenuItem({ label, icon, onPress, isLast = false }: MenuItemProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
        },
        itemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        itemPressed: {
          backgroundColor: colors.surface,
        },
        iconContainer: {
          width: 32,
          alignItems: 'center',
          marginRight: 12,
        },
        icon: {
          fontSize: 20,
        },
        label: {
          flex: 1,
          fontSize: 17,
          fontWeight: '500',
          color: colors.text,
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
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
