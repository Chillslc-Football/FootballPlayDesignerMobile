import { PLAYER_POSITIONS } from '../types/playerPosition';
import { resolvePlayerDisplayLabel } from './playDisplay';

type StoredParticipant = {
  id?: string;
  label?: string | null;
};

type StoredPlayData = {
  players?: StoredParticipant[];
  defenders?: StoredParticipant[];
  playerNotes?: Record<string, unknown>;
};

const PREFERRED_POSITION_ORDER = [
  'QB',
  'RB',
  'FB',
  'WR',
  'TE',
  'OL',
  'X',
  'Y',
  'Z',
  'LT',
  'LG',
  'C',
  'RG',
  'RT',
  'DL',
  'LE',
  'DT1',
  'DT2',
  'RE',
  'LB',
  'LOLB',
  'MLB',
  'ROLB',
  'CB',
  'CB1',
  'CB2',
  'S',
  'FS',
  'SS',
  'K',
  'P',
  'LS',
  'ATH',
];

function readTrimmed(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeRosterPosition(value: string | null | undefined): string | null {
  const trimmed = readTrimmed(value);

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function extractPositionsFromPlayData(data: unknown): string[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const stored = data as StoredPlayData;
  const positions = new Set<string>();
  const labelBySlot = new Map<string, string | null | undefined>(
    (stored.players ?? [])
      .filter((player) => typeof player.id === 'string')
      .map((player) => [player.id as string, player.label]),
  );

  for (const player of stored.players ?? []) {
    const slotId = readTrimmed(player.id);

    if (!slotId) {
      continue;
    }

    const label = normalizeRosterPosition(resolvePlayerDisplayLabel(slotId, player.label));

    if (label) {
      positions.add(label);
    }
  }

  for (const defender of stored.defenders ?? []) {
    const slotId = readTrimmed(defender.id);

    if (!slotId) {
      continue;
    }

    const label = normalizeRosterPosition(resolvePlayerDisplayLabel(slotId, defender.label));

    if (label) {
      positions.add(label);
    }
  }

  for (const slotId of Object.keys(stored.playerNotes ?? {})) {
    const trimmedSlotId = readTrimmed(slotId);

    if (!trimmedSlotId) {
      continue;
    }

    const label = normalizeRosterPosition(
      resolvePlayerDisplayLabel(trimmedSlotId, labelBySlot.get(trimmedSlotId)),
    );

    if (label) {
      positions.add(label);
    }
  }

  return sortRosterPositions([...positions]);
}

export function extractPositionsFromTeamPlayData(playDataList: unknown[]): string[] {
  const positions = new Set<string>();

  for (const playData of playDataList) {
    for (const position of extractPositionsFromPlayData(playData)) {
      positions.add(position);
    }
  }

  return sortRosterPositions([...positions]);
}

export function sortRosterPositions(positions: string[]): string[] {
  return [...positions].sort((left, right) => {
    const leftIndex = PREFERRED_POSITION_ORDER.indexOf(left);
    const rightIndex = PREFERRED_POSITION_ORDER.indexOf(right);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right, undefined, { sensitivity: 'base' });
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

export function buildRosterPositionOptions(
  playDerivedPositions: string[],
  savedPositions: Array<string | null | undefined>,
): string[] {
  const options = new Set<string>();

  for (const position of playDerivedPositions) {
    const normalized = normalizeRosterPosition(position);

    if (normalized) {
      options.add(normalized);
    }
  }

  if (options.size === 0) {
    for (const position of PLAYER_POSITIONS) {
      options.add(position);
    }
  }

  for (const position of savedPositions) {
    const normalized = normalizeRosterPosition(position);

    if (normalized) {
      options.add(normalized);
    }
  }

  return sortRosterPositions([...options]);
}

export function isRosterPositionAllowed(
  value: string | null,
  options: string[],
): boolean {
  if (value === null) {
    return true;
  }

  return options.includes(value);
}
