import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { palette, radius, spacing, typography } from '../design-system';
import type { PlaybookFilters } from '../utils/playbookSearch';
import {
  EMPTY_PLAYBOOK_FILTERS,
  toggleCategoryFilter,
  toggleFormationFilter,
  toggleFrontFilter,
} from '../utils/playbookSearch';

type PlaybookFilterModalProps = {
  visible: boolean;
  formationOptions: string[];
  frontOptions: string[];
  categoryOptions: string[];
  filters: PlaybookFilters;
  onChangeFilters: (filters: PlaybookFilters) => void;
  onClose: () => void;
};

type FilterSectionProps = {
  title: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  emptyMessage: string;
};

function FilterSection({
  title,
  options,
  selectedValues,
  onToggle,
  emptyMessage,
}: FilterSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {options.length === 0 ? (
        <Text style={styles.emptySectionText}>{emptyMessage}</Text>
      ) : (
        options.map((option) => {
          const selected = selectedValues.includes(option);

          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.optionRow,
                selected && styles.optionRowSelected,
                pressed && styles.optionRowPressed,
              ]}
              onPress={() => onToggle(option)}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option}
              </Text>
              {selected ? <Text style={styles.optionCheck}>✓</Text> : null}
            </Pressable>
          );
        })
      )}
    </View>
  );
}

export function PlaybookFilterModal({
  visible,
  formationOptions,
  frontOptions,
  categoryOptions,
  filters,
  onChangeFilters,
  onClose,
}: PlaybookFilterModalProps) {
  const hasActiveFilters =
    filters.formations.length > 0 ||
    filters.fronts.length > 0 ||
    filters.categories.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeButton}>Done</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FilterSection
              title="Formation"
              options={formationOptions}
              selectedValues={filters.formations}
              onToggle={(formation) =>
                onChangeFilters(toggleFormationFilter(filters, formation))
              }
              emptyMessage="No formations in loaded plays."
            />
            <FilterSection
              title="Front"
              options={frontOptions}
              selectedValues={filters.fronts}
              onToggle={(front) => onChangeFilters(toggleFrontFilter(filters, front))}
              emptyMessage="No fronts in loaded plays."
            />
            <FilterSection
              title="Category"
              options={categoryOptions}
              selectedValues={filters.categories}
              onToggle={(category) => onChangeFilters(toggleCategoryFilter(filters, category))}
              emptyMessage="No categories in loaded plays."
            />
          </ScrollView>

          {hasActiveFilters ? (
            <Pressable
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
              onPress={() => onChangeFilters(EMPTY_PLAYBOOK_FILTERS)}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: palette.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border.default,
    borderBottomWidth: 0,
    maxHeight: '80%',
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.divider,
  },
  title: {
    ...typography.subheading,
    fontWeight: typography.heading.fontWeight,
    color: palette.text.primary,
  },
  closeButton: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.accent.default,
  },
  scrollView: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  emptySectionText: {
    ...typography.bodySmall,
    color: palette.text.muted,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.background.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  optionRowSelected: {
    borderColor: palette.accent.default,
    backgroundColor: palette.background.secondary,
  },
  optionRowPressed: {
    opacity: 0.9,
  },
  optionLabel: {
    ...typography.bodySmall,
    color: palette.text.primary,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: typography.subheading.fontWeight,
  },
  optionCheck: {
    fontSize: typography.subheading.fontSize,
    color: palette.accent.default,
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border.default,
    backgroundColor: palette.background.secondary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  clearButtonPressed: {
    opacity: 0.85,
  },
  clearButtonText: {
    ...typography.bodySmall,
    fontWeight: typography.subheading.fontWeight,
    color: palette.text.primary,
  },
});
