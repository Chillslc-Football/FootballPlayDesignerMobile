import { FIELD_VIEW_LENGTH, FIELD_WIDTH } from '../constants/field';
import type {
  Block,
  Motion,
  PlayerActionChains,
  Position,
  PositionFormat,
  RenderPlay,
  Route,
} from '../types';

export const COORDINATE_SPACE_RENDER: PositionFormat = 'yard';
export const COORDINATE_SPACE_DB: PositionFormat = 'normalized';

function dbPointToRender(position: Position): Position {
  return {
    x: (position.x / 100) * FIELD_WIDTH,
    y: (position.y / 100) * FIELD_VIEW_LENGTH,
  };
}

function dbPathToRender(points: Position[]): Position[] {
  return points.map(dbPointToRender);
}

function dbPlayerActionsToRender(chains: PlayerActionChains): PlayerActionChains {
  const converted: PlayerActionChains = {};

  for (const playerId of Object.keys(chains) as Array<keyof PlayerActionChains>) {
    converted[playerId] = (chains[playerId] ?? []).map((action) => ({
      ...action,
      points: dbPathToRender(action.points),
    }));
  }

  return converted;
}

export function dbPlayToRenderPlay(play: RenderPlay): RenderPlay {
  if (play.positionFormat !== COORDINATE_SPACE_DB) {
    return {
      ...play,
      positionFormat: COORDINATE_SPACE_RENDER,
    };
  }

  return {
    ...play,
    positionFormat: COORDINATE_SPACE_RENDER,
    players: play.players.map((player) => ({
      ...player,
      position: dbPointToRender(player.position),
    })),
    defenders: play.defenders.map((defender) => ({
      ...defender,
      position: dbPointToRender(defender.position),
    })),
    routes: play.routes.map((route: Route) => ({
      ...route,
      points: dbPathToRender(route.points),
    })),
    blocks: play.blocks.map((block: Block) => ({
      ...block,
      points: dbPathToRender(block.points),
    })),
    motions: play.motions.map((motion: Motion) => ({
      ...motion,
      points: dbPathToRender(motion.points),
    })),
    playerActions: dbPlayerActionsToRender(play.playerActions ?? {}),
    defenderRoutes: play.defenderRoutes.map((route) => ({
      ...route,
      points: dbPathToRender(route.points),
    })),
  };
}
