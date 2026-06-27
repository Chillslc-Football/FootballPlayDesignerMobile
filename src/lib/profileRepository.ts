import type {
  ProfileMemberFields,
  ProfileNameFields,
  UserProfile,
  UserProfileUpdate,
} from '../types/profile';
import { supabase } from './supabase';

export const PROFILE_MEMBER_COLUMNS = 'id, display_name, email, phone';

const USER_PROFILE_COLUMNS = `${PROFILE_MEMBER_COLUMNS}, avatar_url`;

type ProfileMemberRow = ProfileNameFields & {
  id: string;
};

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeProfileMemberFields(row: ProfileNameFields): ProfileMemberFields {
  return {
    display_name: normalizeOptionalString(row.display_name),
    email: normalizeOptionalString(row.email),
    phone: normalizeOptionalString(row.phone),
  };
}

export async function fetchProfileMembersByUserIds(
  userIds: string[],
): Promise<Map<string, ProfileMemberFields>> {
  const profileByUserId = new Map<string, ProfileMemberFields>();

  if (userIds.length === 0) {
    return profileByUserId;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_MEMBER_COLUMNS)
    .in('id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as ProfileMemberRow[]) {
    profileByUserId.set(row.id, normalizeProfileMemberFields(row));
  }

  return profileByUserId;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(USER_PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const fields = normalizeProfileMemberFields(data);

  return {
    id: data.id,
    display_name: fields.display_name,
    email: fields.email,
    phone: fields.phone,
    avatar_url: normalizeOptionalString(data.avatar_url),
  };
}

export async function updateProfileAvatarPath(
  userId: string,
  avatarPath: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarPath })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateUserProfile(
  userId: string,
  update: UserProfileUpdate,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: update.display_name.trim(),
      phone: update.phone,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
