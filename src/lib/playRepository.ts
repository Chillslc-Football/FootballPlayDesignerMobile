import { supabase } from './supabase';
import { preparePlayForRender } from '../playDiagram/utils/preparePlayForRender';
import {
  PlayAssignment,
  PlayCategoryGroup,
  PlayDetail,
  PlaySummary,
  PlayType,
  UNCategorized_CATEGORY,
} from '../types/play';
import { normalizeCategories } from '../utils/categoryUtils';
import { resolvePlayerDisplayLabel } from '../utils/playDisplay';
import { buildEditablePlayerNotes } from '../utils/playerNotes';

type StoredPlayer = {
  id: string;
  label?: string | null;
};

type PlayData = {
  notes?: unknown;
  playerNotes?: Record<string, unknown>;
  formationName?: unknown;
  frontName?: unknown;
  players?: StoredPlayer[];
};

type PlayListRow = {
  id: string;
  name: string;
  play_type: 'offense' | 'defense';
  formation_name: string | null;
  front_name: string | null;
  categories: string[] | null;
  data: unknown;
};

type PlayDetailRow = PlayListRow & {
  data: PlayData | null;
};

const ASSIGNMENT_ORDER = ['QB', 'RB', 'FB', 'X', 'Y', 'Z', 'LT', 'LG', 'C', 'RG', 'RT'];

function fromDbPlayType(value: string): PlayType {
  return value === 'defense' ? 'defensive' : 'offensive';
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function rowToSummary(row: PlayListRow): PlaySummary {
  const playType = fromDbPlayType(row.play_type);
  const stored =
    row.data && typeof row.data === 'object' ? (row.data as PlayData) : {};
  const schemeLabel =
    playType === 'defensive'
      ? readString(row.front_name) || readString(stored.frontName) || 'Unknown front'
      : readString(row.formation_name) || readString(stored.formationName) || 'Unknown formation';
  const diagramPlay = preparePlayForRender({
    id: row.id,
    name: row.name,
    play_type: row.play_type,
    formation_name: row.formation_name,
    front_name: row.front_name,
    data: row.data,
  });

  return {
    id: row.id,
    name: row.name,
    playType,
    formationName: schemeLabel,
    categories: normalizeCategories(row.categories),
    diagramPlay,
  };
}

function sortAssignments(assignments: PlayAssignment[]): PlayAssignment[] {
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

function extractAssignments(
  playerNotes: Record<string, unknown> | undefined,
  players: StoredPlayer[] | undefined,
): PlayAssignment[] {
  if (!playerNotes) {
    return [];
  }

  const playerLabelBySlot = new Map<string, string | null | undefined>(
    (players ?? []).map((player) => [player.id, player.label]),
  );

  const assignments = Object.entries(playerNotes)
    .filter(([, assignment]) => readString(assignment).length > 0)
    .map(([position, assignment]) => ({
      position,
      displayLabel: resolvePlayerDisplayLabel(position, playerLabelBySlot.get(position)),
      assignment: readString(assignment),
    }));

  return sortAssignments(assignments);
}

function resolveScheme(row: PlayDetailRow, stored: PlayData, playType: PlayType) {
  if (playType === 'defensive') {
    return {
      schemeLabel: readString(row.front_name) || readString(stored.frontName) || 'Unknown front',
      schemeKind: 'front' as const,
    };
  }

  return {
    schemeLabel:
      readString(row.formation_name) || readString(stored.formationName) || 'Unknown formation',
    schemeKind: 'formation' as const,
  };
}

export async function fetchPlaysByTeam(teamId: string): Promise<PlaySummary[]> {
  const { data, error } = await supabase
    .from('plays')
    .select('id, name, play_type, formation_name, front_name, categories, data')
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
    .select('id, name, play_type, formation_name, front_name, categories, data')
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
  const scheme = resolveScheme(row, stored, summary.playType);
  const diagramPlay = preparePlayForRender({
    id: row.id,
    name: row.name,
    play_type: row.play_type,
    formation_name: row.formation_name,
    front_name: row.front_name,
    data: row.data,
  });

  return {
    id: summary.id,
    name: summary.name,
    playType: summary.playType,
    schemeLabel: scheme.schemeLabel,
    schemeKind: scheme.schemeKind,
    categories: summary.categories,
    notes: readString(stored.notes),
    assignments: extractAssignments(stored.playerNotes, stored.players),
    playerNotes: buildEditablePlayerNotes(
      stored.playerNotes as Record<string, unknown> | undefined,
    ),
    diagramPlay,
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

type PlayDataRow = {
  data: unknown;
};

export async function fetchTeamPlayDataByTeam(teamId: string): Promise<unknown[]> {
  const { data, error } = await supabase.from('plays').select('data').eq('team_id', teamId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlayDataRow[]).map((row) => row.data);
}

async function fetchPlayDataJson(
  teamId: string,
  playId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('plays')
    .select('data')
    .eq('team_id', teamId)
    .eq('id', playId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.data || typeof data.data !== 'object') {
    return {};
  }

  return data.data as Record<string, unknown>;
}

async function updatePlayDataJson(
  teamId: string,
  playId: string,
  nextData: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('plays')
    .update({ data: nextData })
    .eq('team_id', teamId)
    .eq('id', playId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePlayNotes(
  teamId: string,
  playId: string,
  notes: string,
): Promise<void> {
  const currentData = await fetchPlayDataJson(teamId, playId);

  await updatePlayDataJson(teamId, playId, {
    ...currentData,
    notes,
  });
}

export async function updatePlayPlayerNotes(
  teamId: string,
  playId: string,
  playerNotes: Record<string, string>,
): Promise<void> {
  const currentData = await fetchPlayDataJson(teamId, playId);
  const existingPlayerNotes =
    currentData.playerNotes && typeof currentData.playerNotes === 'object'
      ? (currentData.playerNotes as Record<string, unknown>)
      : undefined;

  await updatePlayDataJson(teamId, playId, {
    ...currentData,
    playerNotes: {
      ...existingPlayerNotes,
      ...playerNotes,
    },
  });
}
