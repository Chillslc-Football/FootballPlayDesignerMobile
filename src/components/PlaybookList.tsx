import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import { PlaybookListItem } from './PlaybookListItem';

type PlaybookListProps = {
  items: Array<{
    key: string;
    label: string;
    subtitle?: string;
    icon?: string;
    leading?: ReactNode;
    onPress: () => void;
  }>;
};

export function PlaybookList({ items }: PlaybookListProps) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <PlaybookListItem
          key={item.key}
          label={item.label}
          subtitle={item.subtitle}
          icon={item.icon}
          leading={item.leading}
          onPress={item.onPress}
          isLast={index === items.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
});
