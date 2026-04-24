jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

const mockGetForeground = jest.fn();
const mockRequestForeground = jest.fn();
const mockGetCurrentPosition = jest.fn();

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: (...args: unknown[]) => mockGetForeground(...args),
  requestForegroundPermissionsAsync: (...args: unknown[]) => mockRequestForeground(...args),
  getCurrentPositionAsync: (...args: unknown[]) => mockGetCurrentPosition(...args),
  Accuracy: { Balanced: 3 },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundFetchResult: { NewData: 1, Failed: 2 },
}));

import { StorageService } from '../StorageService';
import { LocationService } from '../LocationService';
import { CompletionService } from '../CompletionService';
import { CITIES } from '@/data/cities';
import { NotificationScheduler } from '../NotificationScheduler';
import { useCompletionsStore } from '@/stores/useCompletionsStore';

describe('Services', () => {
  beforeEach(() => {
    StorageService.clear();
    useCompletionsStore.setState({ completions: {}, skipped: {} });
    mockGetForeground.mockReset();
    mockRequestForeground.mockReset();
    mockGetCurrentPosition.mockReset();
  });

  it('5.1 StorageService roundtrip JSON', () => {
    StorageService.set('k', { a: 1 });
    expect(StorageService.get<{ a: number }>('k')).toEqual({ a: 1 });
  });

  it('5.2 CompletionService.markDone calls cancelForMitzvah', async () => {
    const spy = jest.spyOn(NotificationScheduler, 'cancelForMitzvah').mockResolvedValue();
    await CompletionService.markDone('tefillin');
    expect(spy).toHaveBeenCalledWith('tefillin', expect.any(Date));
    spy.mockRestore();
  });

  it('5.2b CompletionService.markSkipped calls cancelForMitzvah', async () => {
    const spy = jest.spyOn(NotificationScheduler, 'cancelForMitzvah').mockResolvedValue();
    await CompletionService.markSkipped('tefillin');
    expect(spy).toHaveBeenCalledWith('tefillin', expect.any(Date));
    expect(CompletionService.isSkipped('tefillin')).toBe(true);
    spy.mockRestore();
  });

  it('5.3 LocationService GPS success → returns gps source', async () => {
    mockGetForeground.mockResolvedValue({ granted: true, canAskAgain: true });
    mockGetCurrentPosition.mockResolvedValue({ coords: { latitude: 31.7, longitude: 35.2 } });
    const r = await LocationService.getCurrentLocation();
    expect(r.status).toBe('ready');
    expect(r.source).toBe('gps');
    expect(r.location.lat).toBeCloseTo(31.7);
  });

  it('5.4 LocationService denied → fallback CITIES[0]', async () => {
    mockGetForeground.mockResolvedValue({ granted: false, canAskAgain: false });
    const r = await LocationService.getCurrentLocation();
    expect(r.status).toBe('denied');
    expect(r.source).toBe('manual');
    expect(r.location).toEqual(CITIES[0]);
  });

  it('5.5 LocationService timeout → fallback', async () => {
    mockGetForeground.mockResolvedValue({ granted: true, canAskAgain: true });
    mockGetCurrentPosition.mockImplementation(() => new Promise(() => {}));
    const r = await LocationService.getCurrentLocation(50);
    expect(r.status).toBe('timeout');
    expect(r.source).toBe('manual');
  });
});
