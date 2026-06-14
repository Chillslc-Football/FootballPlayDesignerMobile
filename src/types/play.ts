import type { RenderPlay } from '../playDiagram/types';

export type PlayType = 'offensive' | 'defensive';

export type PlaySummary = {
  id: string;
  name: string;
  playType: PlayType;
  formationName: string;
  categories: string[];
};

export type PlayAssignment = {
  position: string;
  displayLabel: string;
  assignment: string;
};

export type PlayDetail = {
  id: string;
  name: string;
  playType: PlayType;
  schemeLabel: string;
  schemeKind: 'formation' | 'front';
  categories: string[];
  notes: string;
  assignments: PlayAssignment[];
  diagramPlay: RenderPlay | null;
};

export type PlayCategoryGroup = {
  name: string;
  playCount: number;
};

export const UNCategorized_CATEGORY = 'Uncategorized';
