jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 'public' },
}));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({ registerTaskAsync: jest.fn(), BackgroundFetchResult: {} }));

// Previously this file re-declared its own copy of buildTriggerTime — the shipped one was not even
// exported, so a sign flip in the real implementation could never fail a test here.
import { buildTriggerTime } from '../NotificationScheduler';
import { Reminder } from '@/types/mitzvah';

const window = {
  start: new Date(2026, 4, 6, 6, 0, 0),
  end: new Date(2026, 4, 6, 10, 0, 0),
};

describe('buildTriggerTime', () => {
  it('16.1 offsets forward from the window start', () => {
    const r: Reminder = { anchor: 'start', offsetMin: 30, label: 'x' };
    expect(buildTriggerTime(r, window).getTime()).toBe(window.start.getTime() + 30 * 60_000);
  });

  it('16.2 a zero offset fires exactly at the anchor', () => {
    expect(buildTriggerTime({ anchor: 'start', offsetMin: 0, label: 'x' }, window).getTime()).toBe(
      window.start.getTime(),
    );
    expect(buildTriggerTime({ anchor: 'end', offsetMin: 0, label: 'x' }, window).getTime()).toBe(window.end.getTime());
  });

  it('16.3 a negative offset on the end anchor lands BEFORE the window closes', () => {
    const r: Reminder = { anchor: 'end', offsetMin: -45, label: 'x' };
    const trigger = buildTriggerTime(r, window);
    expect(trigger.getTime()).toBe(window.end.getTime() - 45 * 60_000);
    expect(trigger.getTime()).toBeLessThan(window.end.getTime());
    expect(trigger.getTime()).toBeGreaterThan(window.start.getTime());
  });

  it('16.4 a positive offset on the end anchor lands after the window — the scheduler drops these', () => {
    const r: Reminder = { anchor: 'end', offsetMin: 30, label: 'x' };
    expect(buildTriggerTime(r, window).getTime()).toBeGreaterThan(window.end.getTime());
  });
});
