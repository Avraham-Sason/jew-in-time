const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RECEIVER_NAME = '.notifications.MitzvahNotificationService';
const NOTIFICATION_EVENT_ACTION = 'expo.modules.notifications.NOTIFICATION_EVENT';
const SETUP_ACTIONS = [
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.REBOOT',
  'android.intent.action.QUICKBOOT_POWERON',
  'com.htc.intent.action.QUICKBOOT_POWERON',
  'android.intent.action.MY_PACKAGE_REPLACED',
];

function getAndroidPackageName(config) {
  const packageName = config.android?.package;
  if (!packageName) {
    throw new Error('withMitzvahNotificationAction requires expo.android.package');
  }
  return packageName;
}

function addReceiver(androidManifest) {
  const application = androidManifest.manifest.application?.[0];
  if (!application) return androidManifest;

  const receivers = application.receiver ?? [];
  application.receiver = receivers.filter((receiver) => receiver.$?.['android:name'] !== RECEIVER_NAME);
  application.receiver.push({
    $: {
      'android:name': RECEIVER_NAME,
      'android:enabled': 'true',
      'android:exported': 'false',
    },
    'intent-filter': [
      {
        $: { 'android:priority': '999' },
        action: [NOTIFICATION_EVENT_ACTION, ...SETUP_ACTIONS].map((name) => ({
          $: { 'android:name': name },
        })),
      },
    ],
  });

  return androidManifest;
}

function kotlinSource(packageName) {
  return `package ${packageName}.notifications

import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.service.NotificationsService

class MitzvahNotificationService : NotificationsService() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent == null) return
    dismissMarkDoneNotification(context, intent)
    super.onReceive(context, intent)
  }

  @Suppress("DEPRECATION")
  private fun dismissMarkDoneNotification(context: Context, intent: Intent) {
    if (intent.action != NotificationsService.NOTIFICATION_EVENT_ACTION) return
    if (intent.getStringExtra(NotificationsService.EVENT_TYPE_KEY) != RECEIVE_RESPONSE_TYPE) return

    val action = intent.getParcelableExtra<NotificationAction>(NotificationsService.NOTIFICATION_ACTION_KEY)
    if (action?.identifier != MARK_DONE_ACTION) return

    val notification = intent.getParcelableExtra<Notification>(NotificationsService.NOTIFICATION_KEY)
    val identifier = notification?.notificationRequest?.identifier ?: return
    NotificationManagerCompat.from(context).cancel(identifier, EXPO_NOTIFICATION_ID)
  }

  private companion object {
    const val MARK_DONE_ACTION = "MARK_DONE"
    const val RECEIVE_RESPONSE_TYPE = "receiveResponse"
    const val EXPO_NOTIFICATION_ID = 0
  }
}
`;
}

module.exports = function withMitzvahNotificationAction(config) {
  config = withAndroidManifest(config, (modConfig) => {
    modConfig.modResults = addReceiver(modConfig.modResults);
    return modConfig;
  });

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const packageName = getAndroidPackageName(modConfig);
      const packagePath = packageName.replace(/\./g, path.sep);
      const targetDir = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'src', 'main', 'java', packagePath, 'notifications');
      await fs.promises.mkdir(targetDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(targetDir, 'MitzvahNotificationService.kt'),
        kotlinSource(packageName),
      );
      return modConfig;
    },
  ]);
};
