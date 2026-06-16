import type { ProfileNameFields } from '../types/profile';

function readTrimmed(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveProfileDisplayName(
  profile: ProfileNameFields | null | undefined,
): string | null {
  if (!profile) {
    return null;
  }

  const displayName = readTrimmed(profile.display_name);
  if (displayName) {
    return displayName;
  }

  const email = readTrimmed(profile.email);
  if (email) {
    return email;
  }

  return null;
}
