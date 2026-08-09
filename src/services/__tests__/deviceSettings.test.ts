const mockSendIntent = jest.fn(async (_action: string) => {});
const mockOpenSettings = jest.fn(async () => {});

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: {
    sendIntent: (action: string) => mockSendIntent(action),
    openSettings: () => mockOpenSettings(),
  },
}));

import { openBatteryOptimizationSettings, supportsBatteryOptimizationSettings } from '../deviceSettings';

describe('battery optimisation settings', () => {
  beforeEach(() => {
    mockSendIntent.mockClear();
    mockOpenSettings.mockClear();
    mockSendIntent.mockImplementation(async () => {});
  });

  it('is offered on Android only', () => {
    expect(supportsBatteryOptimizationSettings()).toBe(true);
  });

  it('opens the battery optimisation list, not the permission dialog', async () => {
    await expect(openBatteryOptimizationSettings()).resolves.toBe(true);
    expect(mockSendIntent).toHaveBeenCalledWith('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    expect(mockOpenSettings).not.toHaveBeenCalled();
  });

  // Some OEM ROMs do not expose that screen at all. Landing the user nowhere would be worse than
  // landing them one tap away.
  it('falls back to the app settings page when the ROM has no such screen', async () => {
    mockSendIntent.mockImplementation(async () => {
      throw new Error('No Activity found to handle Intent');
    });

    await expect(openBatteryOptimizationSettings()).resolves.toBe(false);
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('never rejects, so a dead intent cannot bubble into the UI', async () => {
    mockSendIntent.mockImplementation(async () => {
      throw new Error('boom');
    });
    mockOpenSettings.mockImplementation(async () => {
      throw new Error('also boom');
    });

    await expect(openBatteryOptimizationSettings()).resolves.toBe(false);
  });
});
