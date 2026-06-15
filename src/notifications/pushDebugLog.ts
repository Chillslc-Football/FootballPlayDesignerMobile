import { useEffect, useState } from 'react';

let traceCounter = 0;

export type PushDebugEntry = {
  id: string;
  timestamp: string;
  level: 'log' | 'error';
  step: string;
  details?: Record<string, unknown>;
  error?: unknown;
};

export type PushDebugSnapshot = {
  providerMounted: boolean;
  authenticatedUserId: string | null;
  isDevice: boolean | null;
  permissionStatus: string | null;
  permissionGranted: boolean | null;
  easProjectId: string | null;
  expoPushToken: string | null;
  upsertResult: string | null;
  flowStopMessage: string | null;
  lastUpdatedAt: string | null;
};

const MAX_ENTRIES = 200;

const entries: PushDebugEntry[] = [];
const listeners = new Set<() => void>();

const snapshot: PushDebugSnapshot = {
  providerMounted: false,
  authenticatedUserId: null,
  isDevice: null,
  permissionStatus: null,
  permissionGranted: null,
  easProjectId: null,
  expoPushToken: null,
  upsertResult: null,
  flowStopMessage: null,
  lastUpdatedAt: null,
};

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function appendEntry(entry: PushDebugEntry): void {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
  snapshot.lastUpdatedAt = entry.timestamp;
  notifyListeners();
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function updateSnapshotFromLog(step: string, details?: Record<string, unknown>): void {
  if (step === 'STEP 1 PushNotificationProvider mounted') {
    snapshot.providerMounted = true;
  }

  if (step === 'STEP 2 authenticated user detected') {
    snapshot.authenticatedUserId = readString(details?.userId);
  }

  if (step === 'STEP 3 acquireExpoPushToken started' && typeof details?.isDevice === 'boolean') {
    snapshot.isDevice = details.isDevice;
  }

  if (
    step === 'STEP 4 notification permission before request' ||
    step === 'STEP 5 permission request result'
  ) {
    snapshot.permissionStatus = readString(details?.status) ?? snapshot.permissionStatus;
    if (typeof details?.granted === 'boolean') {
      snapshot.permissionGranted = details.granted;
    }
  }

  if (step === 'STEP 6 EAS projectId lookup') {
    snapshot.easProjectId = readString(details?.projectId);
  }

  if (step === 'STEP 8 Expo push token returned') {
    snapshot.expoPushToken = readString(details?.token);
  }

  if (step === 'acquireExpoPushToken completed successfully') {
    snapshot.expoPushToken = readString(details?.token) ?? snapshot.expoPushToken;
  }

  if (step === 'STEP 10 upsertPushDeviceToken completed in provider') {
    snapshot.upsertResult = 'Success (provider confirmed)';
  }

  if (step.startsWith('FLOW STOP:')) {
    snapshot.flowStopMessage = step.replace('FLOW STOP: ', '');
  }
}

function updateSnapshotFromError(step: string, error: unknown, details?: Record<string, unknown>): void {
  if (step.startsWith('FLOW STOP:') || step.includes('FLOW STOP')) {
    snapshot.flowStopMessage = step.replace('FLOW STOP: ', '');
  }

  if (step === 'STEP 10 upsertPushDeviceToken Supabase error') {
    const message =
      error instanceof Error
        ? error.message
        : readString((details as { message?: string } | undefined)?.message) ?? 'Unknown error';
    snapshot.upsertResult = `Error: ${message}`;
  }

  if (step === 'STEP 10 upsertPushDeviceToken failed in provider') {
    snapshot.upsertResult =
      error instanceof Error ? `Error: ${error.message}` : 'Error: provider persist failed';
  }
}

export function createPushTraceId(): string {
  traceCounter += 1;
  return `push-trace-${traceCounter}`;
}

export function subscribePushDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPushDebugEntries(): PushDebugEntry[] {
  return [...entries];
}

export function getPushDebugSnapshot(): PushDebugSnapshot {
  return { ...snapshot };
}

export function pushDebugLog(step: string, details?: Record<string, unknown>): void {
  if (details) {
    console.log(`[PushDebug] ${step}`, details);
  } else {
    console.log(`[PushDebug] ${step}`);
  }

  appendEntry({
    id: `${Date.now()}-${entries.length}`,
    timestamp: new Date().toISOString(),
    level: 'log',
    step,
    details,
  });

  updateSnapshotFromLog(step, details);

  if (step === 'STEP 10 upsertPushDeviceToken Supabase success') {
    snapshot.upsertResult = `Success (${String(details?.rowCount ?? 0)} row(s))`;
  }
}

export function pushDebugError(
  step: string,
  error: unknown,
  details?: Record<string, unknown>,
): void {
  const normalizedError =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

  if (details) {
    console.error(`[PushDebug] ${step}`, details, normalizedError);
  } else {
    console.error(`[PushDebug] ${step}`, normalizedError);
  }

  appendEntry({
    id: `${Date.now()}-${entries.length}`,
    timestamp: new Date().toISOString(),
    level: 'error',
    step,
    details,
    error: normalizedError,
  });

  updateSnapshotFromError(step, error, details);
}

export function usePushDebugState(): {
  snapshot: PushDebugSnapshot;
  entries: PushDebugEntry[];
} {
  const [state, setState] = useState(() => ({
    snapshot: getPushDebugSnapshot(),
    entries: getPushDebugEntries(),
  }));

  useEffect(() => {
    return subscribePushDebug(() => {
      setState({
        snapshot: getPushDebugSnapshot(),
        entries: getPushDebugEntries(),
      });
    });
  }, []);

  return state;
}
