import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';

type TeamManagementComingSoonItemProps = {
  label: string;
  icon: string;
  description?: string;
  isLast?: boolean;
};

export function TeamManagementComingSoonItem({
  label,
  icon,
  description,
  isLast = false,
}: TeamManagementComingSoonItemProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
          opacity: 0.72,
        },
        itemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        iconContainer: {
          width: 32,
          alignItems: 'center',
          marginRight: 12,
        },
        icon: {
          fontSize: 20,
        },
        content: {
          flex: 1,
          gap: 2,
        },
        label: {
          fontSize: 17,
          fontWeight: '500',
          color: colors.text,
        },
        description: {
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        badge: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
      }),
    [colors],
  );

  return (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Text style={styles.badge}>Soon</Text>
    </View>
  );
}
