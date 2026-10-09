jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

jest.mock('@/services/crashReporting', () => ({ captureException: jest.fn() }));

import { AppState } from 'react-native';
import { StorageService } from '@/services/StorageService';
import { captureException } from '@/services/crashReporting';
import {
  LAST_ERROR_KEY,
  clearLastError,
  getLastError,
  reportError,
  subscribeToLastError,
  useLastError,
} from '../errors';

const NOW = 1_700_000_000_000;
const captureExceptionMock = captureException as jest.Mock;

describe('error channel', () => {
  beforeEach(() => {
    clearLastError();
    captureExceptionMock.mockReset();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('reportError stores the last error under errors:last and serves it', () => {
    reportError('schedule', new Error('boom'));
    const expected = { scope: 'schedule', message: 'boom', at: NOW };
    expect(StorageService.get(LAST_ERROR_KEY)).toEqual(expected);
    expect(LAST_ERROR_KEY).toBe('errors:last');
    expect(getLastError()).toEqual(expected);
  });

  it('reportError turns a thrown non-Error into its string', () => {
    reportError('reset', 'plain text');
    expect(getLastError()).toEqual({ scope: 'reset', message: 'plain text', at: NOW });
  });

  it('the newest error replaces the older one', () => {
    reportError('schedule', new Error('first'));
    reportError('storage', new Error('second'));
    expect(getLastError()).toEqual({ scope: 'storage', message: 'second', at: NOW });
    expect(StorageService.get(LAST_ERROR_KEY)).toEqual({ scope: 'storage', message: 'second', at: NOW });
  });

  it('reportError notifies every listener once, and an unsubscribed one no more', () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = subscribeToLastError(first);
    const unsubscribeSecond = subscribeToLastError(second);
    reportError('schedule', new Error('a'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    unsubscribeFirst();
    reportError('schedule', new Error('b'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    unsubscribeSecond();
  });

  it('a listener reads the new error when it is notified', () => {
    const seen: unknown[] = [];
    const unsubscribe = subscribeToLastError(() => seen.push(getLastError()));
    reportError('completion', new Error('x'));
    clearLastError();
    unsubscribe();
    expect(seen).toEqual([{ scope: 'completion', message: 'x', at: NOW }, null]);
  });

  it('hands the error and its scope to the crash reporter', () => {
    const error = new Error('boom');
    reportError('schedule', error);
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(error, { scope: 'schedule' });
  });

  it('warns in development with the scope and the original error', () => {
    const error = new Error('boom');
    reportError('storage', error);
    expect(console.warn).toHaveBeenCalledWith('[errors] storage', error);
  });

  it('clearLastError removes the stored copy and notifies', () => {
    reportError('schedule', new Error('boom'));
    const listener = jest.fn();
    const unsubscribe = subscribeToLastError(listener);
    clearLastError();
    unsubscribe();
    expect(getLastError()).toBeNull();
    expect(StorageService.get(LAST_ERROR_KEY)).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps the same snapshot object between reads, which useSyncExternalStore needs', () => {
    reportError('schedule', new Error('boom'));
    expect(getLastError()).toBe(getLastError());
  });

  it('never throws into the code it reports on, and still serves and notifies', () => {
    jest.spyOn(StorageService, 'set').mockImplementation(() => {
      throw new Error('disk full');
    });
    captureExceptionMock.mockImplementation(() => {
      throw new Error('reporter down');
    });
    const listener = jest.fn();
    const unsubscribe = subscribeToLastError(listener);
    expect(() => reportError('storage', new Error('boom'))).not.toThrow();
    unsubscribe();
    expect(getLastError()).toEqual({ scope: 'storage', message: 'boom', at: NOW });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clearLastError does not throw when storage fails', () => {
    reportError('schedule', new Error('boom'));
    jest.spyOn(StorageService, 'delete').mockImplementation(() => {
      throw new Error('disk gone');
    });
    expect(() => clearLastError()).not.toThrow();
    expect(getLastError()).toBeNull();
  });

  it('reads the error a previous launch stored, once, on first access', () => {
    const stored = { scope: 'schedule', message: 'from last launch', at: 123 };
    jest.isolateModules(() => {
      const { StorageService: freshStorage } = require('@/services/StorageService');
      freshStorage.set('errors:last', stored);
      const fresh = require('../errors');
      expect(fresh.getLastError()).toEqual(stored);
      expect(fresh.getLastError()).toBe(fresh.getLastError());
    });
  });

  it('an unreadable store reads as no error', () => {
    jest.isolateModules(() => {
      const { StorageService: freshStorage } = require('@/services/StorageService');
      jest.spyOn(freshStorage, 'get').mockImplementation(() => {
        throw new Error('mmkv unavailable');
      });
      const fresh = require('../errors');
      expect(fresh.getLastError()).toBeNull();
    });
  });

  describe('returning to the foreground', () => {
    const STORED = { scope: 'schedule', message: 'written by a background task', at: 456 };

    function mockAppState() {
      let handler: (state: string) => void = () => {};
      const remove = jest.fn();
      jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
        handler = listener as (state: string) => void;
        return { remove };
      });
      return { fire: (state: string) => handler(state), remove };
    }

    it('picks up an error another JS context stored, and notifies once', () => {
      const appState = mockAppState();
      const listener = jest.fn();
      const unsubscribe = subscribeToLastError(listener);
      StorageService.set(LAST_ERROR_KEY, STORED);
      expect(getLastError()).toBeNull();
      appState.fire('active');
      appState.fire('active');
      unsubscribe();
      expect(getLastError()).toEqual(STORED);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('picks up an error that another JS context cleared', () => {
      reportError('schedule', new Error('boom'));
      const appState = mockAppState();
      const listener = jest.fn();
      const unsubscribe = subscribeToLastError(listener);
      StorageService.delete(LAST_ERROR_KEY);
      appState.fire('active');
      unsubscribe();
      expect(getLastError()).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('stays silent when the stored value is the one it already holds', () => {
      reportError('schedule', new Error('boom'));
      const appState = mockAppState();
      const listener = jest.fn();
      const unsubscribe = subscribeToLastError(listener);
      appState.fire('active');
      unsubscribe();
      expect(listener).not.toHaveBeenCalled();
    });

    it('re-reads only on active', () => {
      const appState = mockAppState();
      const listener = jest.fn();
      const unsubscribe = subscribeToLastError(listener);
      StorageService.set(LAST_ERROR_KEY, STORED);
      appState.fire('background');
      appState.fire('inactive');
      unsubscribe();
      expect(getLastError()).toBeNull();
      expect(listener).not.toHaveBeenCalled();
    });

    it('keeps the cached error when the store cannot be read', () => {
      reportError('schedule', new Error('boom'));
      const appState = mockAppState();
      const listener = jest.fn();
      const unsubscribe = subscribeToLastError(listener);
      jest.spyOn(StorageService, 'get').mockImplementation(() => {
        throw new Error('mmkv unavailable');
      });
      expect(() => appState.fire('active')).not.toThrow();
      unsubscribe();
      expect(getLastError()).toEqual({ scope: 'schedule', message: 'boom', at: NOW });
      expect(listener).not.toHaveBeenCalled();
    });

    it('stops listening to the app state once unsubscribed', () => {
      const appState = mockAppState();
      subscribeToLastError(jest.fn())();
      expect(appState.remove).toHaveBeenCalledTimes(1);
    });
  });

  it('useLastError subscribes through the channel and returns its snapshot', () => {
    const React = require('react');
    const spy = jest.spyOn(React, 'useSyncExternalStore').mockImplementation((_subscribe, getSnapshot) => {
      return (getSnapshot as () => unknown)();
    });
    expect(useLastError()).toBeNull();
    reportError('reset', new Error('boom'));
    expect(useLastError()).toEqual({ scope: 'reset', message: 'boom', at: NOW });
    expect(spy).toHaveBeenLastCalledWith(subscribeToLastError, getLastError, getLastError);
  });
});
