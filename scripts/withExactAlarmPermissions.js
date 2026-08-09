const { withAndroidManifest } = require('expo/config-plugins');

// Exact alarms, without the Play Console declaration form.
//
// expo-notifications only calls setExactAndAllowWhileIdle when AlarmManager.canScheduleExactAlarms()
// is true; otherwise it silently falls back to setAndAllowWhileIdle, which Doze batches — a candle
// lighting reminder can then arrive after sunset.
//
//   API <= 32 : USE_EXACT_ALARM does not exist yet, but SCHEDULE_EXACT_ALARM is granted on install.
//   API >= 33 : USE_EXACT_ALARM is granted on install for alarm/reminder apps. SCHEDULE_EXACT_ALARM
//               is denied by default AND is what triggers Google's declaration form.
//
// So SCHEDULE_EXACT_ALARM is capped at maxSdkVersion=32: it covers Android 12 and is simply absent
// on the versions where it would cost a policy review. app.json's `android.permissions` array
// cannot express maxSdkVersion, which is why this has to be a manifest plugin.
const CAPPED_AT_ANDROID_12 = '32';

module.exports = function withExactAlarmPermissions(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] ?? [];

    for (const permission of manifest['uses-permission']) {
      if (permission.$?.['android:name'] === 'android.permission.SCHEDULE_EXACT_ALARM') {
        permission.$['android:maxSdkVersion'] = CAPPED_AT_ANDROID_12;
      }
    }

    return modConfig;
  });
};
