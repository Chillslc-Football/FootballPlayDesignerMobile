export type PushPlatform = 'android' | 'ios';

export type PushDeviceToken = {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: PushPlatform;
  device_label: string | null;
  last_registered_at: string;
  created_at: string;
  updated_at: string;
};
