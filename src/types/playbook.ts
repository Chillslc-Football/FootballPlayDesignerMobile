export type PlayAssignment = {
  position: string;
  assignment: string;
};

export type Play = {
  id: string;
  name: string;
  formation: string;
  notes: string;
  assignments: PlayAssignment[];
};

export type PlaySubcategory = {
  id: string;
  name: string;
  plays: Play[];
};

export type PlayCategory = {
  id: string;
  name: string;
  icon: string;
  subcategories: PlaySubcategory[];
};
