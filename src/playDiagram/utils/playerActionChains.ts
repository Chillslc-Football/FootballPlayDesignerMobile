import type {
  Block,
  Motion,
  PlayerAction,
  PlayerActionChains,
  PlayerActionType,
  PlayerLabel,
  Position,
  RenderPlay,
  Route,
} from '../types';

function defaultEndpointMarker(type: PlayerActionType) {
  switch (type) {
    case 'route':
      return 'arrow' as const;
    case 'motion':
      return 'filled-circle' as const;
    case 'block':
      return 'blocking-line' as const;
  }
}

function createEmptyPlayerActionChains(): PlayerActionChains {
  return {};
}

export function getSortedChain(
  chains: PlayerActionChains,
  playerId: PlayerLabel,
): PlayerAction[] {
  return [...(chains[playerId] ?? [])].sort((left, right) => left.order - right.order);
}

export function getActionStartPosition(
  playerPosition: Position,
  chain: PlayerAction[],
  actionIndex: number,
): Position {
  if (actionIndex <= 0) {
    return playerPosition;
  }

  return getActionEndpoint(playerPosition, chain, actionIndex - 1);
}

export function getActionEndpoint(
  playerPosition: Position,
  chain: PlayerAction[],
  actionIndex: number,
): Position {
  const action = chain[actionIndex];
  if (!action) {
    return playerPosition;
  }

  if (action.points.length === 0) {
    return getActionStartPosition(playerPosition, chain, actionIndex);
  }

  return action.points[action.points.length - 1];
}

function migrateLegacyToPlayerActions(
  routes: Route[],
  blocks: Block[],
  motions: Motion[],
): PlayerActionChains {
  const chains = createEmptyPlayerActionChains();
  const playerIds = new Set<PlayerLabel>();

  for (const route of routes) {
    playerIds.add(route.playerId);
  }
  for (const block of blocks) {
    playerIds.add(block.playerId);
  }
  for (const motion of motions) {
    playerIds.add(motion.playerId);
  }

  for (const playerId of playerIds) {
    const actions: PlayerAction[] = [];
    let order = 0;

    const motion = motions.find((entry) => entry.playerId === playerId && entry.points.length > 0);
    const block = blocks.find((entry) => entry.playerId === playerId && entry.points.length > 0);
    const route = routes.find((entry) => entry.playerId === playerId && entry.points.length > 0);

    if (motion) {
      actions.push({
        id: `legacy-${playerId}-motion`,
        type: 'motion',
        points: [...motion.points],
        order: order++,
        motionType: motion.motionType,
      });
    }

    if (block) {
      actions.push({
        id: `legacy-${playerId}-block`,
        type: 'block',
        points: [...block.points],
        order,
      });
      order += 1;
    }

    if (route) {
      actions.push({
        id: `legacy-${playerId}-route`,
        type: 'route',
        points: [...route.points],
        order,
      });
    }

    if (actions.length > 0) {
      chains[playerId] = actions;
    }
  }

  return chains;
}

function flattenPlayerActionsToLegacy(chains: PlayerActionChains): {
  routes: Route[];
  blocks: Block[];
  motions: Motion[];
} {
  const routes: Route[] = [];
  const blocks: Block[] = [];
  const motions: Motion[] = [];

  for (const playerId of Object.keys(chains) as PlayerLabel[]) {
    for (const action of getSortedChain(chains, playerId)) {
      if (action.points.length === 0) {
        continue;
      }

      if (action.type === 'route') {
        routes.push({ playerId, points: [...action.points] });
      } else if (action.type === 'block') {
        blocks.push({ playerId, points: [...action.points] });
      } else if (action.type === 'motion') {
        motions.push({
          playerId,
          points: [...action.points],
          motionType: action.motionType ?? 'jog',
        });
      }
    }
  }

  return { routes, blocks, motions };
}

function hasPlayerActionChainData(chains: PlayerActionChains): boolean {
  for (const playerId of Object.keys(chains) as PlayerLabel[]) {
    for (const action of chains[playerId] ?? []) {
      if (action.points.length > 0) {
        return true;
      }
    }
  }

  return false;
}

function hasLegacyActionData(play: Pick<RenderPlay, 'routes' | 'blocks' | 'motions'>): boolean {
  return (
    play.routes.some((route) => route.points.length > 0) ||
    play.blocks.some((block) => block.points.length > 0) ||
    play.motions.some((motion) => motion.points.length > 0)
  );
}

function mergeConsecutiveSameTypeActions(chains: PlayerActionChains): PlayerActionChains {
  const merged = createEmptyPlayerActionChains();

  for (const playerId of Object.keys(chains) as PlayerLabel[]) {
    const chain = getSortedChain(chains, playerId);
    const next: PlayerAction[] = [];

    for (const action of chain) {
      const previous = next[next.length - 1];

      if (
        previous &&
        previous.type === action.type &&
        previous.points.length > 0 &&
        action.points.length > 0
      ) {
        next[next.length - 1] = {
          ...previous,
          points: [...previous.points, ...action.points],
          ...(action.type === 'motion'
            ? { motionType: action.motionType ?? previous.motionType }
            : {}),
        };
        continue;
      }

      next.push({ ...action });
    }

    if (next.length > 0) {
      merged[playerId] = next.map((entry, index) => ({ ...entry, order: index }));
    }
  }

  return merged;
}

export function ensurePlayPlayerActions(play: RenderPlay): RenderPlay {
  const storedChains = play.playerActions ?? {};
  const rawChains = hasPlayerActionChainData(storedChains)
    ? storedChains
    : hasLegacyActionData(play)
      ? migrateLegacyToPlayerActions(play.routes, play.blocks, play.motions)
      : storedChains;
  const chains = mergeConsecutiveSameTypeActions(rawChains);
  const legacy = flattenPlayerActionsToLegacy(chains);

  return {
    ...play,
    playerActions: chains,
    routes: legacy.routes,
    blocks: legacy.blocks,
    motions: legacy.motions,
  };
}

export function migratePlayerActionChainPoints(
  chains: PlayerActionChains,
  migratePoint: (position: Position) => Position,
): PlayerActionChains {
  const migrated = createEmptyPlayerActionChains();

  for (const playerId of Object.keys(chains) as PlayerLabel[]) {
    migrated[playerId] = (chains[playerId] ?? []).map((action) => ({
      ...action,
      points: action.points.map(migratePoint),
    }));
  }

  return migrated;
}

export function shiftPlayerActions(chains: PlayerActionChains, deltaY: number): PlayerActionChains {
  const shifted = createEmptyPlayerActionChains();

  for (const playerId of Object.keys(chains) as PlayerLabel[]) {
    shifted[playerId] = (chains[playerId] ?? []).map((action) => ({
      ...action,
      points: action.points.map((point) => ({ ...point, y: point.y + deltaY })),
    }));
  }

  return shifted;
}
