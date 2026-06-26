import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlayDiagramThumbnail } from '../../components/PlayDiagramThumbnail';
import { PlaybookFilterModal } from '../../components/PlaybookFilterModal';
import { PlaybookList } from '../../components/PlaybookList';
import { ScreenContainer } from '../../components/ScreenContainer';
import { inputPresets, palette, radius, spacing, typography } from '../../design-system';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { usePlaybook } from '../../playbook/PlaybookProvider';
import { colors } from '../../theme';
import { buildPlaySubtitle } from '../../utils/playDisplay';
import {
  countActivePlaybookFilters,
  EMPTY_PLAYBOOK_FILTERS,
  filterPlaybookPlays,
  getCategoryFilterOptions,
  getFormationOptions,
  getFrontOptions,
  hasActivePlaybookSearchOrFilters,
  resolvePlayCategoryName,
} from '../../utils/playbookSearch';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'Categories'>;

export function PlaybookCategoriesScreen({ navigation }: Props) {
  const { categories, plays, loading, error } = usePlaybook();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_PLAYBOOK_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const activeFilterCount = countActivePlaybookFilters(filters);
  const isSearchOrFilterActive = hasActivePlaybookSearchOrFilters(searchQuery, filters);

  const formationOptions = useMemo(() => getFormationOptions(plays), [plays]);
  const frontOptions = useMemo(() => getFrontOptions(plays), [plays]);
  const categoryOptions = useMemo(() => getCategoryFilterOptions(plays), [plays]);

  const filteredPlays = useMemo(
    () => filterPlaybookPlays(plays, searchQuery, filters),
    [plays, searchQuery, filters],
  );

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
    <ScreenContainer
      title="Playbook"
      subtitle={isSearchOrFilterActive ? 'Search results' : 'Browse by category'}
    >
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search plays"
          placeholderTextColor={inputPresets.default.placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        <Pressable
          style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>Filter</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isSearchOrFilterActive ? (
        filteredPlays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No plays match your search or filters.</Text>
          </View>
        ) : (
          <PlaybookList
            items={filteredPlays.map((play) => ({
              key: play.id,
              label: play.name,
              subtitle: buildPlaySubtitle(play.playType, play.formationName, play.categories),
              leading: <PlayDiagramThumbnail play={play.diagramPlay} />,
              onPress: () =>
                navigation.navigate('PlayDetail', {
                  playId: play.id,
                  playName: play.name,
                  categoryName: resolvePlayCategoryName(play),
                }),
            }))}
          />
        )
      ) : categories.length === 0 ? (
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

      <PlaybookFilterModal
        visible={filterModalVisible}
        formationOptions={formationOptions}
        frontOptions={frontOptions}
        categoryOptions={categoryOptions}
        filters={filters}
        onChangeFilters={setFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchInput: {
    ...inputPresets.default.field,
    flex: 1,
    marginBottom: 0,
    minHeight: 44,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.background.card,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    minWidth: 72,
    gap: spacing.xs,
  },
  filterButtonPressed: {
    backgroundColor: palette.background.secondary,
  },
  filterButtonText: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.primary,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.accent.default,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  filterBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.label.fontWeight,
    color: palette.background.primary,
  },
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
