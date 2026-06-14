import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type PlaybookListItemProps = {
  label: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  isLast?: boolean;
};

export function PlaybookListItem({
  label,
  subtitle,
  icon,
  onPress,
  isLast = false,
}: PlaybookListItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        !isLast && styles.itemBorder,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
    >
      {icon ? (
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      ) : null}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
