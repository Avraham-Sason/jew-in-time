import { Linking, Platform } from 'react-native';

// Exact alarms are necessary but not sufficient: OEM battery managers (Xiaomi, Huawei, some
// Samsung) still defer or kill scheduled work. Exempting the app is the one thing only the user
// can do, so the app has to be able to take them straight there.
//
// Deliberately the SETTINGS LIST intent, not REQUEST_IGNORE_BATTERY_OPTIMIZATIONS: the direct
// dialog needs a permission Google Play restricts to a narrow set of app categories, while this
// screen needs none.
const BATTERY_SETTINGS_INTENT = 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS';

export function supportsBatteryOptimizationSettings(): boolean {
  return Platform.OS === 'android';
}

export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    await Linking.openSettings().catch(() => {});
    return false;
  }
  try {
    await Linking.sendIntent(BATTERY_SETTINGS_INTENT);
    return true;
  } catch {
    // Some OEM ROMs do not expose that screen. The app's own settings page is always reachable and
    // is one tap from the battery controls on every device.
    await Linking.openSettings().catch(() => {});
    return false;
  }
}
