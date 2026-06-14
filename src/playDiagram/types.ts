export type Position = {
  x: number;
  y: number;
};

export type PositionFormat = 'yard' | 'normalized';

export type PlayType = 'offensive' | 'defensive';

export type PlayerLabel =
  | 'QB'
  | 'RB'
  | 'FB'
  | 'X'
  | 'Y'
  | 'Z'
  | 'LT'
  | 'LG'
  | 'C'
  | 'RG'
  | 'RT';

export type DefenderLabel =
  | 'LE'
  | 'DT1'
  | 'DT2'
  | 'RE'
  | 'LOLB'
  | 'MLB'
  | 'ROLB'
  | 'CB1'
  | 'CB2'
  | 'FS'
  | 'SS';

export type DriveStartYardLine =
  | 'own-1'
  | 'own-5'
  | 'own-10'
  | 'own-20'
  | 'own-25'
  | 'own-30'
  | 'own-35'
  | 'own-40'
  | 'own-45'
  | '50'
  | 'opp-45'
  | 'opp-40'
  | 'opp-35'
  | 'opp-30'
  | 'opp-25'
  | 'opp-20'
  | 'opp-15'
  | 'opp-10'
  | 'opp-5'
  | 'goal-line';

export type Player = {
  id: PlayerLabel;
  label: string;
  position: Position;
};

export type Defender = {
  id: DefenderLabel;
  label: string;
  position: Position;
};

export type Route = {
  playerId: PlayerLabel;
  points: Position[];
};

export type Block = {
  playerId: PlayerLabel;
  points: Position[];
};

export type MotionType = 'jog' | 'sprint';

export type Motion = {
  playerId: PlayerLabel;
  motionType: MotionType;
  points: Position[];
};

export type PlayerActionType = 'route' | 'motion' | 'block';

export type PlayerAction = {
  id: string;
  type: PlayerActionType;
  points: Position[];
  order: number;
  motionType?: MotionType;
};

export type PlayerActionChains = Partial<Record<PlayerLabel, PlayerAction[]>>;

export type DefenderRoute = {
  defenderId: DefenderLabel;
  points: Position[];
};

export type RenderPlay = {
  id: string;
  name: string;
  playType: PlayType;
  driveStartYardLine: DriveStartYardLine;
  players: Player[];
  defenders: Defender[];
  routes: Route[];
  blocks: Block[];
  motions: Motion[];
  playerActions: PlayerActionChains;
  defenderRoutes: DefenderRoute[];
  positionFormat: PositionFormat;
  losAnchorVersion?: number;
};

export type RawPlayRowInput = {
  id: string;
  name: string;
  play_type: 'offense' | 'defense';
  formation_name: string | null;
  front_name: string | null;
  data: unknown;
};
