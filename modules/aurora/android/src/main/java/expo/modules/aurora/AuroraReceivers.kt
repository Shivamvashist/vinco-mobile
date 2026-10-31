package expo.modules.aurora

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Fires at ring time: starts the ringing and sets the next ring from the repeat rule. */
class AuroraAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != AuroraScheduler.ACTION_RING) return
    try {
      AuroraRingService.start(context)
    } catch (error: Exception) {
      Log.e("VincoAurora", "Could not start the ringing.", error)
    }
    val store = AuroraStore(context)
    store.nextRingAt = 0L
    AuroraScheduler.reschedule(context)
  }
}

/** After a reboot, an app update, a clock change or the exact-alarm permission changing. */
class AuroraBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      ACTION_EXACT_PERMISSION_CHANGED -> {
        // A ringing that a reboot cut short is over.
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) AuroraStore(context).ringingSince = 0L
        AuroraScheduler.reschedule(context)
      }
    }
  }

  companion object {
    private const val ACTION_EXACT_PERMISSION_CHANGED =
      "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED"
  }
}
