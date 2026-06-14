import type {
  Block,
  Defender,
  DefenderLabel,
  DriveStartYardLine,
  Motion,
  Player,
  PlayerActionChains,
  PlayerLabel,
  PositionFormat,
  RenderPlay,
  Route,
} from '../types';
import type { RawPlayRowInput } from '../types';
import { COORDINATE_SPACE_RENDER, dbPlayToRenderPlay } from './positionCoordinates';
import { resolveDriveStartYardLine } from './driveStart';
import { migratePlayToFieldView } from './fieldView';
import { ensurePlayPlayerActions } from './playerActionChains';

type StoredPlayData = {
  notes?: unknown;
  playerNotes?: Record<string, unknown>;
  formationName?: unknown;
  frontName?: unknown;
  formationId?: unknown;
  frontId?: unknown;
  driveStartYardLine?: DriveStartYardLine;
  fieldPosition?: string;
  players?: Player[];
  defenders?: Defender[];
  routes?: Route[];
  blocks?: Block[];
  motions?: Motion[];
  playerActions?: PlayerActionChains;
  defenderRoutes?: RenderPlay['defenderRoutes'];
  positionFormat?: PositionFormat;
  losAnchorVersion?: number;
  playType?: 'offensive' | 'defensive' | 'defense';
};

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePlayer(player: Player): Player {
  return {
    ...player,
    label: readString(player.label) || player.id,
    position: player.position ?? { x: 0, y: 0 },
  };
}

function normalizeDefender(defender: Defender): Defender {
  return {
    ...defender,
    label: readString(defender.label) || defender.id,
    position: defender.position ?? { x: 0, y: 0 },
  };
}

function fromDbPlayType(value: string): RenderPlay['playType'] {
  return value === 'defense' ? 'defensive' : 'offensive';
}

function parseStoredData(data: unknown): StoredPlayData {
  if (!data || typeof data !== 'object') {
    return {};
  }

  return data as StoredPlayData;
}

function buildPlayFromRow(input: RawPlayRowInput, stored: StoredPlayData): RenderPlay {
  const playType =
    stored.playType === 'defensive' || stored.playType === 'defense'
      ? 'defensive'
      : stored.playType === 'offensive'
        ? 'offensive'
        : fromDbPlayType(input.play_type);

  return {
    id: input.id,
    name: input.name,
    playType,
    driveStartYardLine: resolveDriveStartYardLine(stored),
    players: Array.isArray(stored.players) ? stored.players.map(normalizePlayer) : [],
    defenders: Array.isArray(stored.defenders) ? stored.defenders.map(normalizeDefender) : [],
    routes: Array.isArray(stored.routes) ? stored.routes : [],
    blocks: Array.isArray(stored.blocks) ? stored.blocks : [],
    motions: Array.isArray(stored.motions) ? stored.motions : [],
    playerActions: stored.playerActions ?? {},
    defenderRoutes: Array.isArray(stored.defenderRoutes) ? stored.defenderRoutes : [],
    positionFormat: stored.positionFormat ?? COORDINATE_SPACE_RENDER,
    losAnchorVersion: stored.losAnchorVersion,
  };
}

function hasOffensivePaths(play: RenderPlay): boolean {
  for (const playerId of Object.keys(play.playerActions ?? {}) as PlayerLabel[]) {
    for (const action of play.playerActions[playerId] ?? []) {
      if (action.points.length > 0) {
        return true;
      }
    }
  }

  return (
    play.routes.some((route) => route.points.length > 0) ||
    play.blocks.some((block) => block.points.length > 0) ||
    play.motions.some((motion) => motion.points.length > 0)
  );
}

function hasDefensivePaths(play: RenderPlay): boolean {
  return play.defenderRoutes.some((route) => route.points.length > 0);
}

export function canRenderDiagram(play: RenderPlay): boolean {
  return (
    play.players.length > 0 ||
    play.defenders.length > 0 ||
    hasOffensivePaths(play) ||
    hasDefensivePaths(play)
  );
}

export function preparePlayForRender(input: RawPlayRowInput): RenderPlay | null {
  try {
    const stored = parseStoredData(input.data);
    let play = buildPlayFromRow(input, stored);
    play = dbPlayToRenderPlay(play);
    play = migratePlayToFieldView(play);
    play = ensurePlayPlayerActions(play);

    if (!canRenderDiagram(play)) {
      return null;
    }

    return play;
  } catch {
    return null;
  }
}

export function getDefenderById(play: RenderPlay, defenderId: DefenderLabel): Defender | undefined {
  return play.defenders.find((defender) => defender.id === defenderId);
}
