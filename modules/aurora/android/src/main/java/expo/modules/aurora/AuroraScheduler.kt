package expo.modules.aurora

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log

/**
 * Sets and clears the ring with AlarmManager. setAlarmClock is exact, survives Doze and shows the
 * alarm icon in the status bar. Without the exact-alarm permission it falls back to an inexact
 * alarm (it may ring a few minutes late), so the user is never left with no alarm at all.
 */
object AuroraScheduler {
  private const val TAG = "VincoAurora"
  private const val REQUEST_RING = 7300
  private const val REQUEST_SHOW = 7301
  const val ACTION_RING = "expo.modules.aurora.RING"

  fun canScheduleExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return alarmManager(context).canScheduleExactAlarms()
  }

  /** Sets the ring at `ringAt` (epoch millis), replacing any earlier one, and saves it. */
  fun schedule(context: Context, ringAt: Long) {
    val store = AuroraStore(context)
    val manager = alarmManager(context)
    val operation = ringIntent(context)
    manager.cancel(operation)
    if (ringAt <= System.currentTimeMillis()) {
      store.nextRingAt = 0L
      return
    }
    try {
      if (canScheduleExact(context)) {
        val info = AlarmManager.AlarmClockInfo(ringAt, showIntent(context))
        manager.setAlarmClock(info, operation)
      } else {
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ringAt, operation)
      }
    } catch (error: SecurityException) {
      // The permission was taken away between the check and the call.
      Log.w(TAG, "Exact alarm refused, falling back to an inexact one.", error)
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ringAt, operation)
    }
    store.nextRingAt = ringAt
  }

  fun cancel(context: Context) {
    alarmManager(context).cancel(ringIntent(context))
    AuroraStore(context).clearSchedule()
  }

  /**
   * After a ring, a reboot, a time change or a permission change: sets the next ring from the
   * repeat rule, or keeps a one-off ring that is still ahead.
   */
  fun reschedule(context: Context) {
    val store = AuroraStore(context)
    val now = System.currentTimeMillis()
    val fromRule = store.nextFromRepeat(now)
    val saved = store.nextRingAt
    when {
      fromRule > 0L -> schedule(context, fromRule)
      saved > now -> schedule(context, saved)
      else -> store.nextRingAt = 0L
    }
  }

  private fun alarmManager(context: Context): AlarmManager =
    context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun ringIntent(context: Context): PendingIntent {
    val intent = Intent(context, AuroraAlarmReceiver::class.java).setAction(ACTION_RING)
    return PendingIntent.getBroadcast(
      context,
      REQUEST_RING,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  /** Tapping the alarm icon in the status bar opens Aurora's settings in the app. */
  private fun showIntent(context: Context): PendingIntent =
    PendingIntent.getActivity(
      context,
      REQUEST_SHOW,
      deepLink(context, "vinco://aurora"),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

  fun deepLink(context: Context, url: String): Intent =
    Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
}
