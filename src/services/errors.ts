import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { StorageService } from '@/services/StorageService';
import { captureException } from '@/services/crashReporting';

export type ErrorScope = 'schedule' | 'completion' | 'reset' | 'storage';
export type LastError = { scope: ErrorScope; message: string; at: number };

export const LAST_ERROR_KEY = 'errors:last';

const listeners = new Set<() => void>();

// useSyncExternalStore needs a stable snapshot, so the stored value is parsed once and kept here.
let cached: LastError | null | undefined;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function getLastError(): LastError | null {
  if (cached === undefined) {
    try {
      cached = StorageService.get<LastError>(LAST_ERROR_KEY) ?? null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function sameError(a: LastError | null, b: LastError | null): boolean {
  return a === b || (!!a && !!b && a.scope === b.scope && a.message === b.message && a.at === b.at);
}

// A background (headless) JS context writes errors:last into the shared MMKV file, which this
// context's cache never sees; coming back to the foreground is the moment to pick it up.
export function refreshLastError(): void {
  const current = getLastError();
  let stored: LastError | null;
  try {
    stored = StorageService.get<LastError>(LAST_ERROR_KEY) ?? null;
  } catch {
    return;
  }
  if (sameError(stored, current)) return;
  cached = stored;
  notify();
}

export function subscribeToLastError(listener: () => void): () => void {
  listeners.add(listener);
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') refreshLastError();
  });
  return () => {
    listeners.delete(listener);
    appState.remove();
  };
}

// The error channel must never throw into the code path it reports on.
export function reportError(scope: ErrorScope, error: unknown): void {
  cached = { scope, message: error instanceof Error ? error.message : String(error), at: Date.now() };
  try {
    StorageService.set(LAST_ERROR_KEY, cached);
  } catch {
    // The in-memory copy still serves this session when storage is what failed.
  }
  if (__DEV__) console.warn(`[errors] ${scope}`, error);
  try {
    captureException(error, { scope });
  } catch {
    // A broken reporter must not hide the error from the user-facing channel.
  }
  notify();
}

export function clearLastError(): void {
  cached = null;
  try {
    StorageService.delete(LAST_ERROR_KEY);
  } catch {
    // Same as reportError: the in-memory state is already cleared.
  }
  notify();
}

export function useLastError(): LastError | null {
  return useSyncExternalStore(subscribeToLastError, getLastError, getLastError);
}
