jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundFetchResult: { NewData: 1, Failed: 2 },
}));

import { pickBodyForReminder } from '../NotificationScheduler';
import { Mitzvah, Reminder } from '@/types/mitzvah';

const baseMitzvah: Mitzvah = {
  id: 'test',
  name: { he: 'בדיקה' },
  icon: 'test',
  timeType: 'range-within-day',
  category: 'daily-morning',
  computeWindow: () => null,
  defaultReminders: [],
  skipOn: [],
  nuschaotSupported: ['ashkenaz'],
};

describe('pickBodyForReminder', () => {
  it('rotates variants deterministically by trigger day', () => {
    const reminder: Reminder = {
      anchor: 'start',
      offsetMin: 0,
      label: 'fallback',
      bodyVariants: ['variant-0', 'variant-1', 'variant-2'],
    };
    const triggers = [
      new Date('2026-05-06T00:00:00Z'),
      new Date('2026-05-07T00:00:00Z'),
      new Date('2026-05-08T00:00:00Z'),
    ];

    const result = triggers.map((trigger) => pickBodyForReminder(reminder, baseMitzvah, trigger));
    const expected = triggers.map((trigger) => reminder.bodyVariants![Math.floor(trigger.getTime() / 86_400_000) % 3]);
    expect(result).toEqual(expected);
    expect(new Set(result).size).toBe(3);
  });

  it('returns the same variant for the same trigger', () => {
    const reminder: Reminder = {
      anchor: 'start',
      offsetMin: 0,
      label: 'fallback',
      bodyVariants: ['first', 'second', 'third'],
    };
    const trigger = new Date('2026-05-06T12:00:00Z');
    expect(pickBodyForReminder(reminder, baseMitzvah, trigger)).toBe(pickBodyForReminder(reminder, baseMitzvah, trigger));
  });

  it('falls back to the label and appends text content when requested', () => {
    const reminder: Reminder = {
      anchor: 'start',
      offsetMin: 0,
      label: 'fallback',
      includeContentInBody: true,
    };
    const mitzvah: Mitzvah = {
      ...baseMitzvah,
      contentBlocks: [
        { type: 'text', he: 'טקסט' },
        { type: 'blessing', he: 'ברכה' },
        { type: 'link', he: 'קישור', url: 'https://example.com' },
      ],
    };
    expect(pickBodyForReminder(reminder, mitzvah, new Date('2026-05-06T00:00:00Z'))).toBe('fallback\nטקסט\nברכה');
  });
});
