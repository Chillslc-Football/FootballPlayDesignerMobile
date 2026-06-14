import {
  FIELD_VIEW_LENGTH,
  FIELD_WIDTH,
  HASH_MARK_LANES,
  LEGACY_LOS_VIEW_Y,
  LEGACY_LOS_X,
  LOS_ANCHOR_VERSION,
  LOS_VIEW_X,
  LOS_VIEW_Y,
} from '../constants/field';
import type { DriveStartYardLine } from '../types';
import type { Player, PlayerActionChains, Position, RenderPlay } from '../types';
import { getLosYardForDriveStart } from './driveStart';
import {
  migratePlayerActionChainPoints,
  shiftPlayerActions,
} from './playerActionChains';

export type FieldViewBounds = {
  losYard: number;
  viewStartYard: number;
  viewEndYard: number;
  losViewY: number;
};

export type YardLine = {
  viewY: number;
  isMajor: boolean;
};

export type HashMark = {
  viewY: number;
  x: number;
};

export function absoluteYardToViewY(absoluteYard: number, viewStartYard: number): number {
  return absoluteYard - viewStartYard;
}

export function getFieldViewBounds(driveStart: DriveStartYardLine): FieldViewBounds {
  const losYard = getLosYardForDriveStart(driveStart);
  const viewStartYard = losYard - LOS_VIEW_Y;

  return {
    losYard,
    viewStartYard,
    viewEndYard: viewStartYard + FIELD_VIEW_LENGTH,
    losViewY: absoluteYardToViewY(losYard, viewStartYard),
  };
}

function isInsideViewBox(viewY: number): boolean {
  return viewY > 0 && viewY < FIELD_VIEW_LENGTH;
}

export function getYardLines(bounds: FieldViewBounds): YardLine[] {
  const lines: YardLine[] = [];
  const { viewStartYard } = bounds;
  const viewEndYard = viewStartYard + FIELD_VIEW_LENGTH;

  for (let absoluteYard = 5; absoluteYard <= viewEndYard; absoluteYard += 5) {
    if (absoluteYard <= viewStartYard) {
      continue;
    }

    const viewY = absoluteYardToViewY(absoluteYard, viewStartYard);
    if (!isInsideViewBox(viewY)) {
      continue;
    }

    lines.push({
      viewY,
      isMajor: absoluteYard % 10 === 0,
    });
  }

  return lines;
}

export function getHashMarks(): HashMark[] {
  const marks: HashMark[] = [];

  for (let viewY = 1; viewY < FIELD_VIEW_LENGTH; viewY += 1) {
    if (viewY % 5 === 0) {
      continue;
    }

    for (const x of HASH_MARK_LANES) {
      marks.push({ viewY, x });
    }
  }

  return marks;
}

export function clampViewPosition(position: Position): Position {
  return {
    x: Math.min(FIELD_WIDTH - 0.5, Math.max(0.5, position.x)),
    y: Math.min(FIELD_VIEW_LENGTH - 0.5, Math.max(0.5, position.y)),
  };
}

function usesLegacyCoordinates(play: RenderPlay): boolean {
  const playerActionXs = Object.values(play.playerActions ?? {}).flatMap((chain) =>
    (chain ?? []).flatMap((action) => action.points.map((point) => point.x)),
  );
  const xs = [
    ...play.players.map((player) => player.position.x),
    ...play.routes.flatMap((route) => route.points.map((point) => point.x)),
    ...play.blocks.flatMap((block) => block.points.map((point) => point.x)),
    ...play.motions.flatMap((motion) => motion.points.map((point) => point.x)),
    ...playerActionXs,
  ];

  if (xs.length === 0) {
    return false;
  }

  return Math.max(...xs) > FIELD_VIEW_LENGTH + 2;
}

function shiftLegacyPosition(position: Position): Position {
  const shiftX = LEGACY_LOS_X - LOS_VIEW_X;
  return clampViewPosition({
    x: position.x - shiftX,
    y: position.y,
  });
}

function usesHorizontalOrientation(players: Player[]): boolean {
  const center = players.find((player) => player.id === 'C');
  if (!center) {
    return false;
  }

  const yNearWidthCenter = Math.abs(center.position.y - FIELD_WIDTH / 2) < 18;
  const xNearWidthCenter = Math.abs(center.position.x - FIELD_WIDTH / 2) < 12;
  const yNearLos = Math.abs(center.position.y - LOS_VIEW_Y) < 4;

  if (xNearWidthCenter && yNearLos) {
    return false;
  }

  return yNearWidthCenter && center.position.x < LOS_VIEW_Y && !xNearWidthCenter;
}

export function convertHorizontalToPortrait(position: Position): Position {
  return clampViewPosition({
    x: position.y,
    y: FIELD_VIEW_LENGTH - position.x,
  });
}

function migratePaths<T extends { points: Position[] }>(paths: T[]): T[] {
  return paths.map((path) => ({
    ...path,
    points: path.points.map(shiftLegacyPosition),
  }));
}

function migratePathsToPortrait<T extends { points: Position[] }>(paths: T[]): T[] {
  return paths.map((path) => ({
    ...path,
    points: path.points.map(convertHorizontalToPortrait),
  }));
}

function migratePlayerActionsToPortrait(chains: PlayerActionChains): PlayerActionChains {
  const migrated: PlayerActionChains = {};

  for (const playerId of Object.keys(chains) as Array<keyof PlayerActionChains>) {
    migrated[playerId] = (chains[playerId] ?? []).map((action) => ({
      ...action,
      points: action.points.map(convertHorizontalToPortrait),
    }));
  }

  return migrated;
}

function migratePlayToPortrait(play: RenderPlay): RenderPlay {
  return {
    ...play,
    players: play.players.map((player) => ({
      ...player,
      position: convertHorizontalToPortrait(player.position),
    })),
    defenders: play.defenders.map((defender) => ({
      ...defender,
      position: convertHorizontalToPortrait(defender.position),
    })),
    routes: migratePathsToPortrait(play.routes),
    blocks: migratePathsToPortrait(play.blocks),
    motions: migratePathsToPortrait(play.motions),
    playerActions: migratePlayerActionsToPortrait(play.playerActions ?? {}),
    defenderRoutes: migratePathsToPortrait(play.defenderRoutes),
  };
}

function shiftPositionY(position: Position, deltaY: number): Position {
  return { ...position, y: position.y + deltaY };
}

function shiftPaths<T extends { points: Position[] }>(paths: T[], deltaY: number): T[] {
  return paths.map((path) => ({
    ...path,
    points: path.points.map((point) => shiftPositionY(point, deltaY)),
  }));
}

export function getLosAnchorShiftY(): number {
  return LOS_VIEW_Y - LEGACY_LOS_VIEW_Y;
}

export function shiftPlayLosAnchor(play: RenderPlay, deltaY: number): RenderPlay {
  return {
    ...play,
    players: play.players.map((player) => ({
      ...player,
      position: shiftPositionY(player.position, deltaY),
    })),
    defenders: play.defenders.map((defender) => ({
      ...defender,
      position: shiftPositionY(defender.position, deltaY),
    })),
    routes: shiftPaths(play.routes, deltaY),
    blocks: shiftPaths(play.blocks, deltaY),
    motions: shiftPaths(play.motions, deltaY),
    defenderRoutes: shiftPaths(play.defenderRoutes, deltaY),
    playerActions: shiftPlayerActions(play.playerActions ?? {}, deltaY),
  };
}

export function migrateLosAnchorPlay(play: RenderPlay): RenderPlay {
  if ((play.losAnchorVersion ?? 1) >= LOS_ANCHOR_VERSION) {
    return play;
  }

  const deltaY = getLosAnchorShiftY();
  if (deltaY === 0) {
    return play;
  }

  return {
    ...shiftPlayLosAnchor(play, deltaY),
    losAnchorVersion: LOS_ANCHOR_VERSION,
  };
}

export function migratePlayToFieldView(play: RenderPlay): RenderPlay {
  let migrated = play;

  if (usesLegacyCoordinates(migrated)) {
    migrated = {
      ...migrated,
      players: migrated.players.map((player) => ({
        ...player,
        position: shiftLegacyPosition(player.position),
      })),
      defenders: migrated.defenders.map((defender) => ({
        ...defender,
        position: shiftLegacyPosition(defender.position),
      })),
      routes: migratePaths(migrated.routes),
      blocks: migratePaths(migrated.blocks),
      motions: migratePaths(migrated.motions),
      playerActions: migratePlayerActionChainPoints(
        migrated.playerActions ?? {},
        shiftLegacyPosition,
      ),
      defenderRoutes: migratePaths(migrated.defenderRoutes),
    };
  }

  if (usesHorizontalOrientation(migrated.players)) {
    migrated = migratePlayToPortrait(migrated);
  }

  return migrateLosAnchorPlay(migrated);
}
