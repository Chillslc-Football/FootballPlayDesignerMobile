import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookList } from '../../components/PlaybookList';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { usePlaybook } from '../../playbook/PlaybookProvider';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'Categories'>;

export function PlaybookCategoriesScreen({ navigation }: Props) {
  const { categories, loading, error } = usePlaybook();

  if (loading) {
    return (
      <ScreenContainer title="Playbook" scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Playbook" subtitle="Browse by category">
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No plays found for this team yet.</Text>
        </View>
      ) : (
        <PlaybookList
          items={categories.map((category) => ({
            key: category.name,
            label: category.name,
            subtitle: `${category.playCount} play${category.playCount === 1 ? '' : 's'}`,
            icon: '📁',
            onPress: () =>
              navigation.navigate('Plays', {
                categoryName: category.name,
              }),
          }))}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    color: '#F87171',
    fontSize: 14,
    marginBottom: 16,
  },
});
