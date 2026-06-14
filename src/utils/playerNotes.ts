export const ASSIGNMENT_SLOTS = [
  'QB',
  'RB',
  'FB',
  'X',
  'Y',
  'Z',
  'LT',
  'LG',
  'C',
  'RG',
  'RT',
] as const;

export type AssignmentSlot = (typeof ASSIGNMENT_SLOTS)[number];

export function createEmptyPlayerNotes(): Record<string, string> {
  return Object.fromEntries(ASSIGNMENT_SLOTS.map((slot) => [slot, '']));
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function buildEditablePlayerNotes(
  stored: Record<string, unknown> | undefined,
): Record<string, string> {
  const notes = createEmptyPlayerNotes();

  for (const slot of ASSIGNMENT_SLOTS) {
    notes[slot] = readString(stored?.[slot]);
  }

  if (stored) {
    for (const [key, value] of Object.entries(stored)) {
      if (!(key in notes)) {
        notes[key] = readString(value);
      }
    }
  }

  return notes;
}

export function mergePlayerNotesPatch(
  existing: Record<string, unknown> | undefined,
  edited: Record<string, string>,
): Record<string, string> {
  const merged = buildEditablePlayerNotes(existing);

  for (const [key, value] of Object.entries(edited)) {
    merged[key] = value;
  }

  return merged;
}
