import { pushDebugError, pushDebugLog } from '../notifications/pushDebugLog';
import { supabase } from './supabase';
import type { PushPlatform } from '../types/pushToken';

export async function upsertPushDeviceToken(
  userId: string,
  expoPushToken: string,
  platform: PushPlatform,
  deviceLabel: string | null,
  traceId = 'unknown-trace',
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  pushDebugLog('STEP 9 upsertPushDeviceToken auth session check', {
    traceId,
    requestedUserId: userId,
    sessionUserId: session?.user?.id ?? null,
    hasSession: Boolean(session),
    sessionError: sessionError?.message ?? null,
  });

  const now = new Date().toISOString();

  pushDebugLog('STEP 9 upsertPushDeviceToken Supabase request', {
    traceId,
    userId,
    platform,
    deviceLabel,
    token: expoPushToken,
  });

  const { data, error } = await supabase
    .from('push_device_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: expoPushToken,
        platform,
        device_label: deviceLabel,
        last_registered_at: now,
        updated_at: now,
      },
      { onConflict: 'expo_push_token' },
    )
    .select('id, user_id, expo_push_token, platform');

  if (error) {
    pushDebugError('STEP 10 upsertPushDeviceToken Supabase error', error, {
      traceId,
      userId,
      platform,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }

  pushDebugLog('STEP 10 upsertPushDeviceToken Supabase success', {
    traceId,
    userId,
    platform,
    rowCount: data?.length ?? 0,
    rows: data,
  });
}

export async function deletePushDeviceToken(expoPushToken: string): Promise<void> {
  const { error } = await supabase
    .from('push_device_tokens')
    .delete()
    .eq('expo_push_token', expoPushToken);

  if (error) {
    throw new Error(error.message);
  }
}
