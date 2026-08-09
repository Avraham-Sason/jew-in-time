import appConfig from '../../../app.json';

// expo-notifications only uses setExactAndAllowWhileIdle when canScheduleExactAlarms() is true;
// otherwise Doze batches the alarm and a time-window reminder can arrive after its window closed.
// There is no JS API to detect that at runtime, so the manifest is the only guarantee — which
// makes this config the thing worth pinning.
describe('exact alarm configuration', () => {
  const android = appConfig.expo.android;

  it('declares USE_EXACT_ALARM so Android 13+ grants exact alarms at install', () => {
    expect(android.permissions).toContain('USE_EXACT_ALARM');
  });

  it('still declares SCHEDULE_EXACT_ALARM for Android 12, where USE_EXACT_ALARM does not exist', () => {
    expect(android.permissions).toContain('SCHEDULE_EXACT_ALARM');
  });

  // The plugin caps SCHEDULE_EXACT_ALARM at maxSdkVersion=32. Without that cap the permission is
  // present on API 33+, where it is denied by default and triggers Google's declaration form.
  it('registers the plugin that caps SCHEDULE_EXACT_ALARM at Android 12', () => {
    expect(appConfig.expo.plugins).toContain('./scripts/withExactAlarmPermissions');
  });

  it('keeps the wake lock and boot permissions the scheduled alarms depend on', () => {
    expect(android.permissions).toContain('WAKE_LOCK');
    expect(android.permissions).toContain('RECEIVE_BOOT_COMPLETED');
    expect(android.permissions).toContain('POST_NOTIFICATIONS');
  });
});
