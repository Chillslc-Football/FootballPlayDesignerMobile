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
  assignment: string;
};

export type PlayDetail = PlaySummary & {
  notes: string;
  assignments: PlayAssignment[];
};

export type PlayCategoryGroup = {
  name: string;
  playCount: number;
};

export const UNCategorized_CATEGORY = 'Uncategorized';
