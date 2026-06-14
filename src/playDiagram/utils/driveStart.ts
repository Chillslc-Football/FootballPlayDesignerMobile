import type { DriveStartYardLine } from '../types';

export const DEFAULT_DRIVE_START: DriveStartYardLine = '50';

const LOS_YARD_BY_ID: Record<DriveStartYardLine, number> = {
  'own-1': 1,
  'own-5': 5,
  'own-10': 10,
  'own-20': 20,
  'own-25': 25,
  'own-30': 30,
  'own-35': 35,
  'own-40': 40,
  'own-45': 45,
  '50': 50,
  'opp-45': 55,
  'opp-40': 60,
  'opp-35': 65,
  'opp-30': 70,
  'opp-25': 75,
  'opp-20': 80,
  'opp-15': 85,
  'opp-10': 90,
  'opp-5': 95,
  'goal-line': 99,
};

const LEGACY_FIELD_POSITION_MAP: Record<string, DriveStartYardLine> = {
  'middle-of-field': '50',
  'own-goal-line': 'own-1',
  'backed-up': 'own-5',
  'red-zone': 'opp-20',
  'goal-line': 'goal-line',
};

export function getLosYardForDriveStart(driveStart: DriveStartYardLine): number {
  return LOS_YARD_BY_ID[driveStart] ?? 50;
}

export function resolveDriveStartYardLine(value: {
  driveStartYardLine?: DriveStartYardLine;
  fieldPosition?: string;
}): DriveStartYardLine {
  if (value.driveStartYardLine) {
    return value.driveStartYardLine;
  }

  if (value.fieldPosition && LEGACY_FIELD_POSITION_MAP[value.fieldPosition]) {
    return LEGACY_FIELD_POSITION_MAP[value.fieldPosition];
  }

  return DEFAULT_DRIVE_START;
}
