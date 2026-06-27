export type ProfileNameFields = {
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

export type ProfileMemberFields = {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

export type UserProfileUpdate = {
  display_name: string;
  phone: string | null;
};
