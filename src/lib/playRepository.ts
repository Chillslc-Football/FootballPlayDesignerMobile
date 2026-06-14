import { supabase } from './supabase';
import {
  PlayAssignment,
  PlayCategoryGroup,
  PlayDetail,
  PlaySummary,
  PlayType,
  UNCategorized_CATEGORY,
} from '../types/play';
import { normalizeCategories } from '../utils/categoryUtils';

type PlayListRow = {
  id: string;
  name: string;
  play_type: 'offense' | 'defense';
  formation_name: string | null;
  categories: string[] | null;
};

type PlayDetailRow = PlayListRow & {
  data: {
    notes?: string;
    playerNotes?: Record<string, string>;
    formationName?: string;
  } | null;
};

const ASSIGNMENT_ORDER = ['QB', 'RB', 'FB', 'X', 'Y', 'Z', 'LT', 'LG', 'C', 'RG', 'RT'];

function fromDbPlayType(value: string): PlayType {
  return value === 'defense' ? 'defensive' : 'offensive';
}

function rowToSummary(row: PlayListRow): PlaySummary {
  return {
    id: row.id,
    name: row.name,
    playType: fromDbPlayType(row.play_type),
    formationName: row.formation_name?.trim() || 'Unknown formation',
    categories: normalizeCategories(row.categories),
  };
}

function extractAssignments(playerNotes: Record<string, string> | undefined): PlayAssignment[] {
  if (!playerNotes) {
    return [];
  }

  const assignments = Object.entries(playerNotes)
    .filter(([, assignment]) => assignment.trim().length > 0)
    .map(([position, assignment]) => ({
      position,
      assignment: assignment.trim(),
    }));

  return assignments.sort((left, right) => {
    const leftIndex = ASSIGNMENT_ORDER.indexOf(left.position);
    const rightIndex = ASSIGNMENT_ORDER.indexOf(right.position);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.position.localeCompare(right.position);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

export async function fetchPlaysByTeam(teamId: string): Promise<PlaySummary[]> {
  const { data, error } = await supabase
    .from('plays')
    .select('id, name, play_type, formation_name, categories')
    .eq('team_id', teamId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlayListRow[]).map(rowToSummary);
}

export async function fetchPlayById(teamId: string, playId: string): Promise<PlayDetail | null> {
  const { data, error } = await supabase
    .from('plays')
    .select('id, name, play_type, formation_name, categories, data')
    .eq('team_id', teamId)
    .eq('id', playId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as PlayDetailRow;
  const summary = rowToSummary(row);
  const stored = row.data ?? {};

  return {
    ...summary,
    formationName: summary.formationName || stored.formationName?.trim() || 'Unknown formation',
    notes: stored.notes?.trim() ?? '',
    assignments: extractAssignments(stored.playerNotes),
  };
}

export function getCategoriesFromPlays(plays: PlaySummary[]): PlayCategoryGroup[] {
  const categoryCounts = new Map<string, number>();

  for (const play of plays) {
    if (play.categories.length === 0) {
      categoryCounts.set(
        UNCategorized_CATEGORY,
        (categoryCounts.get(UNCategorized_CATEGORY) ?? 0) + 1,
      );
      continue;
    }

    for (const category of play.categories) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  return [...categoryCounts.entries()]
    .map(([name, playCount]) => ({ name, playCount }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function filterPlaysByCategory(plays: PlaySummary[], categoryName: string): PlaySummary[] {
  if (categoryName === UNCategorized_CATEGORY) {
    return plays.filter((play) => play.categories.length === 0);
  }

  return plays.filter((play) => play.categories.includes(categoryName));
}
