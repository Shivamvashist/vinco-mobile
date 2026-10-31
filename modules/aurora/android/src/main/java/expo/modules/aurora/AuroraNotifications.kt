package expo.modules.aurora

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * The alarm's notification on the "aurora" channel. Its full-screen intent opens the ring screen
 * (vinco://alarm) over the lock screen. There is no snooze and no silent stop: the only action
 * opens the ring screen, where the mission waits.
 */
object AuroraNotifications {
  const val CHANNEL_ID = "aurora"
  const val RING_ID = 7310
  const val TIMED_OUT_ID = 7311
  private const val REQUEST_OPEN = 7302
  private const val REQUEST_FULL_SCREEN = 7303
  private const val ALARM_URL = "vinco://alarm"

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val channel = NotificationChannel(
      CHANNEL_ID,
      AuroraStore(context).labels.channelName,
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      // The ring service plays the sound and the vibration itself, on the alarm stream.
      setSound(null, null)
      enableVibration(false)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setBypassDnd(true)
    }
    manager.createNotificationChannel(channel)
  }

  fun buildRinging(context: Context): Notification {
    ensureChannel(context)
    val labels = AuroraStore(context).labels
    val open = openAlarm(context, REQUEST_OPEN)
    return NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(smallIcon(context))
      .setContentTitle(labels.title)
      .setContentText(labels.body)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setContentIntent(open)
      .setFullScreenIntent(openAlarm(context, REQUEST_FULL_SCREEN), true)
      .addAction(0, labels.action, open)
      .build()
  }

  /** After the 10-minute safety stop: a quiet note that Aurora gave up. */
  fun showTimedOut(context: Context) {
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
    val labels = AuroraStore(context).labels
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(smallIcon(context))
      .setContentTitle(labels.timedOutTitle)
      .setContentText(labels.timedOutBody)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setAutoCancel(true)
      .setContentIntent(
        PendingIntent.getActivity(
          context,
          REQUEST_OPEN,
          AuroraScheduler.deepLink(context, "vinco://"),
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
      )
      .build()
    try {
      NotificationManagerCompat.from(context).notify(TIMED_OUT_ID, notification)
    } catch (_: SecurityException) {
      // Notifications were turned off in the meantime.
    }
  }

  fun cancelAll(context: Context) {
    val manager = NotificationManagerCompat.from(context)
    manager.cancel(RING_ID)
  }

  fun areEnabled(context: Context): Boolean =
    NotificationManagerCompat.from(context).areNotificationsEnabled()

  /** Android 14+ lets the user switch off full-screen alarms for an app. */
  fun canUseFullScreenIntent(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 34) return true
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return manager.canUseFullScreenIntent()
  }

  fun fullScreenSettingsIntent(context: Context): Intent =
    if (Build.VERSION.SDK_INT >= 34) {
      Intent(
        Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
        Uri.parse("package:${context.packageName}")
      )
    } else {
      notificationSettingsIntent(context)
    }

  fun notificationSettingsIntent(context: Context): Intent =
    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
      .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)

  private fun openAlarm(context: Context, requestCode: Int): PendingIntent =
    PendingIntent.getActivity(
      context,
      requestCode,
      AuroraScheduler.deepLink(context, ALARM_URL),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

  /** The app's monochrome notification icon if the build has one, else the launcher icon. */
  private fun smallIcon(context: Context): Int {
    val res = context.resources
    val notificationIcon = res.getIdentifier("notification_icon", "drawable", context.packageName)
    if (notificationIcon != 0) return notificationIcon
    return context.applicationInfo.icon
  }
}
