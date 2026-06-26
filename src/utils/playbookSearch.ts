import { getCategoriesFromPlays } from '../lib/playRepository';
import type { PlaySummary } from '../types/play';
import { UNCategorized_CATEGORY } from '../types/play';

export type PlaybookFilters = {
  formations: string[];
  fronts: string[];
  categories: string[];
};

export const EMPTY_PLAYBOOK_FILTERS: PlaybookFilters = {
  formations: [],
  fronts: [],
  categories: [],
};

export function countActivePlaybookFilters(filters: PlaybookFilters): number {
  return filters.formations.length + filters.fronts.length + filters.categories.length;
}

export function hasActivePlaybookSearchOrFilters(
  searchQuery: string,
  filters: PlaybookFilters,
): boolean {
  return searchQuery.trim().length > 0 || countActivePlaybookFilters(filters) > 0;
}

export function getFormationOptions(plays: PlaySummary[]): string[] {
  return [
    ...new Set(
      plays.filter((play) => play.playType === 'offensive').map((play) => play.formationName),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export function getFrontOptions(plays: PlaySummary[]): string[] {
  return [
    ...new Set(
      plays.filter((play) => play.playType === 'defensive').map((play) => play.formationName),
    ),
  ].sort((left, right) => left.localeCompare(right));
}

export function getCategoryFilterOptions(plays: PlaySummary[]): string[] {
  return getCategoriesFromPlays(plays).map((category) => category.name);
}

function playMatchesCategoryFilter(play: PlaySummary, selectedCategories: string[]): boolean {
  const playCategories =
    play.categories.length === 0 ? [UNCategorized_CATEGORY] : play.categories;

  return selectedCategories.some((category) => playCategories.includes(category));
}

export function filterPlaybookPlays(
  plays: PlaySummary[],
  searchQuery: string,
  filters: PlaybookFilters,
): PlaySummary[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return plays.filter((play) => {
    if (normalizedQuery.length > 0) {
      const matchesName = play.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory = play.categories.some((category) =>
        category.toLowerCase().includes(normalizedQuery),
      );
      const matchesUncategorized =
        play.categories.length === 0 &&
        UNCategorized_CATEGORY.toLowerCase().includes(normalizedQuery);

      if (!matchesName && !matchesCategory && !matchesUncategorized) {
        return false;
      }
    }

    if (filters.formations.length > 0) {
      if (play.playType !== 'offensive' || !filters.formations.includes(play.formationName)) {
        return false;
      }
    }

    if (filters.fronts.length > 0) {
      if (play.playType !== 'defensive' || !filters.fronts.includes(play.formationName)) {
        return false;
      }
    }

    if (filters.categories.length > 0 && !playMatchesCategoryFilter(play, filters.categories)) {
      return false;
    }

    return true;
  });
}

function toggleFilterValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function toggleFormationFilter(
  filters: PlaybookFilters,
  formation: string,
): PlaybookFilters {
  return {
    ...filters,
    formations: toggleFilterValue(filters.formations, formation),
  };
}

export function toggleFrontFilter(filters: PlaybookFilters, front: string): PlaybookFilters {
  return {
    ...filters,
    fronts: toggleFilterValue(filters.fronts, front),
  };
}

export function toggleCategoryFilter(filters: PlaybookFilters, category: string): PlaybookFilters {
  return {
    ...filters,
    categories: toggleFilterValue(filters.categories, category),
  };
}

export function resolvePlayCategoryName(play: PlaySummary): string {
  return play.categories[0] ?? UNCategorized_CATEGORY;
}
