import type { PlayerLabel, Position } from '../types';

type RouteLike = {
  playerId: PlayerLabel;
  points: Position[];
};

export function getRouteVertices(playerPosition: Position, route: RouteLike): Position[] {
  return [playerPosition, ...route.points];
}
