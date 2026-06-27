export const PROFILE_PHONE_MAX_LENGTH = 32;

const PROFILE_PHONE_PATTERN = /^[\d\s+\-().]*$/;

export function validateProfilePhone(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > PROFILE_PHONE_MAX_LENGTH) {
    return `Phone number must be ${PROFILE_PHONE_MAX_LENGTH} characters or fewer.`;
  }

  if (!PROFILE_PHONE_PATTERN.test(trimmed)) {
    return 'Use digits and common phone separators (+, -, spaces, parentheses).';
  }

  return null;
}

export function normalizeProfilePhoneForSave(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
