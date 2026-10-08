import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  authenticate,
  biometricsAvailable,
  isAuthenticating,
  isSessionUnlocked,
  lockStatusFor,
  LockStatus,
  markUnlocked,
  relock,
} from '../biometricLock';

const mock = LocalAuthentication as unknown as {
  __set: (next: Record<string, unknown>) => void;
  __reset: () => void;
};

beforeEach(() => {
  mock.__reset();
  relock();
  jest.clearAllMocks();
});

describe('lockStatusFor', () => {
  const table: [boolean, boolean, boolean, LockStatus][] = [
    [false, false, false, 'unlocked'],
    [false, false, true, 'unlocked'],
    [false, true, false, 'unlocked'],
    [false, true, true, 'unlocked'],
    [true, false, false, 'unavailable'],
    [true, false, true, 'unavailable'],
    [true, true, false, 'locked'],
    [true, true, true, 'unlocked'],
  ];

  it.each(table)('lockEnabled=%s available=%s unlocked=%s -> %s', (lockEnabled, available, unlocked, expected) => {
    expect(lockStatusFor(lockEnabled, available, unlocked)).toBe(expected);
  });
});

describe('biometricsAvailable', () => {
  it('is true with hardware and an enrolled biometric', async () => {
    await expect(biometricsAvailable()).resolves.toBe(true);
  });

  it('is false without hardware', async () => {
    mock.__set({ hardware: false });
    await expect(biometricsAvailable()).resolves.toBe(false);
  });

  it('is false when nothing is enrolled', async () => {
    mock.__set({ enrolled: false });
    await expect(biometricsAvailable()).resolves.toBe(false);
  });

  it('is false when the hardware check throws', async () => {
    mock.__set({ hardware: new Error('boom') });
    await expect(biometricsAvailable()).resolves.toBe(false);
  });

  it('is false when the enrollment check throws', async () => {
    mock.__set({ enrolled: new Error('boom') });
    await expect(biometricsAvailable()).resolves.toBe(false);
  });

  it('is false on web without calling the native module', async () => {
    const restore = jest.replaceProperty(Platform, 'OS', 'web');
    try {
      await expect(biometricsAvailable()).resolves.toBe(false);
      expect(LocalAuthentication.hasHardwareAsync).not.toHaveBeenCalled();
    } finally {
      restore.restore();
    }
  });
});

describe('authenticate', () => {
  it('is true when the prompt succeeds, and passes the prompt text with the device fallback allowed', async () => {
    await expect(authenticate('open it')).resolves.toBe(true);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: 'open it',
      disableDeviceFallback: false,
    });
  });

  it('is false when the prompt fails or is cancelled', async () => {
    mock.__set({ success: false });
    await expect(authenticate('open it')).resolves.toBe(false);
  });

  it('is false when the prompt throws', async () => {
    mock.__set({ success: new Error('boom') });
    await expect(authenticate('open it')).resolves.toBe(false);
  });

  it('is false on web without calling the native module', async () => {
    const restore = jest.replaceProperty(Platform, 'OS', 'web');
    try {
      await expect(authenticate('open it')).resolves.toBe(false);
      expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
    } finally {
      restore.restore();
    }
  });

  it('shares one prompt between concurrent callers and reports it while it is open', async () => {
    let release: () => void = () => {};
    mock.__set({ gate: new Promise<void>((resolve) => (release = resolve)) });

    expect(isAuthenticating()).toBe(false);
    const first = authenticate('open it');
    const second = authenticate('open it');
    expect(isAuthenticating()).toBe(true);

    release();
    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledTimes(1);
    expect(isAuthenticating()).toBe(false);
  });

  it('opens a new prompt once the previous one has settled', async () => {
    await authenticate('open it');
    await authenticate('open it');
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledTimes(2);
  });
});

describe('session', () => {
  it('starts locked', () => {
    expect(isSessionUnlocked()).toBe(false);
  });

  it('markUnlocked unlocks and relock locks again', () => {
    markUnlocked();
    expect(isSessionUnlocked()).toBe(true);
    relock();
    expect(isSessionUnlocked()).toBe(false);
  });

  it('a successful prompt does not unlock by itself', async () => {
    await authenticate('open it');
    expect(isSessionUnlocked()).toBe(false);
  });
});
