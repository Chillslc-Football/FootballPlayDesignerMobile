import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from './supabase';

export function createSafeRealtimeUnsubscribe(channel: RealtimeChannel): () => void {
  let removed = false;

  return () => {
    if (removed) {
      return;
    }

    removed = true;

    void (async () => {
      try {
        await supabase.removeChannel(channel);
      } catch (error) {
        console.warn('[realtime] removeChannel failed:', error);
      }
    })();
  };
}
