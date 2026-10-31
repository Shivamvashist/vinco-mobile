package expo.modules.vigil

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/** What the app last sent for the "Are you up?" prompt (src/hooks/useWakeWatch.ts). */
data class WakeWatch(
  val enabled: Boolean = false,
  val fromMinutes: Int = 180,
  val untilMinutes: Int = 720,
  /** The local day (yyyy-MM-dd) the user last logged waking up, or null. */
  val awakeDay: String? = null,
  val title: String = "Are you up?",
  val body: String = "Log your wake-up in Vinco.",
  val channelName: String = "Wake-up check"
)

/**
 * "Are you up?": when the phone is unlocked inside the wake window and today's wake-up isn't
 * logged, one quiet notification (at most once per local day) that opens Today's wake-up flow.
 * The unlock receiver lives in VigilService, so the prompt only works while the guard service is on.
 * The watch sits in its own SharedPreferences file, apart from the focus store (which clears itself).
 */
object VigilWake {
  const val CHANNEL_ID = "vinco.wake"
  const val NOTIFICATION_ID = 7410
  private const val REQUEST_OPEN = 7411
  private const val WAKE_URL = "vinco://veni?wake=1"
  private const val PREFS_NAME = "vinco.vigil.wake"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_FROM = "fromMinutes"
  private const val KEY_UNTIL = "untilMinutes"
  private const val KEY_AWAKE_DAY = "awakeDay"
  private const val KEY_PROMPTED_DAY = "promptedDay"
  private const val KEY_TITLE = "title"
  private const val KEY_BODY = "body"
  private const val KEY_CHANNEL = "channelName"
  private const val MAX_LEN = 120
  private const val MINUTES_PER_DAY = 24 * 60

  fun save(context: Context, watch: WakeWatch) {
    val defaults = WakeWatch()
    fun clean(value: String, fallback: String) = value.trim().takeIf { it.isNotEmpty() }?.take(MAX_LEN) ?: fallback
    prefs(context).edit()
      .putBoolean(KEY_ENABLED, watch.enabled)
      .putInt(KEY_FROM, watch.fromMinutes.coerceIn(0, MINUTES_PER_DAY))
      .putInt(KEY_UNTIL, watch.untilMinutes.coerceIn(0, MINUTES_PER_DAY))
      .putString(KEY_AWAKE_DAY, watch.awakeDay?.takeIf { it.isNotBlank() })
      .putString(KEY_TITLE, clean(watch.title, defaults.title))
      .putString(KEY_BODY, clean(watch.body, defaults.body))
      .putString(KEY_CHANNEL, clean(watch.channelName, defaults.channelName))
      .apply()
    // Logged (or switched off): a prompt still on screen no longer has a job.
    if (!watch.enabled || watch.awakeDay == today()) cancel(context)
  }

  fun read(context: Context): WakeWatch {
    val p = prefs(context)
    val defaults = WakeWatch()
    return WakeWatch(
      enabled = p.getBoolean(KEY_ENABLED, false),
      fromMinutes = p.getInt(KEY_FROM, defaults.fromMinutes),
      untilMinutes = p.getInt(KEY_UNTIL, defaults.untilMinutes),
      awakeDay = p.getString(KEY_AWAKE_DAY, null),
      title = p.getString(KEY_TITLE, null) ?: defaults.title,
      body = p.getString(KEY_BODY, null) ?: defaults.body,
      channelName = p.getString(KEY_CHANNEL, null) ?: defaults.channelName
    )
  }

  /** Called on every unlock: one prefs read, and a notification at most once a day. */
  fun onUnlock(context: Context) {
    val watch = read(context)
    if (!watch.enabled) return
    val now = Calendar.getInstance()
    val minutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    if (minutes < watch.fromMinutes || minutes >= watch.untilMinutes) return
    val today = dayKey(now)
    if (watch.awakeDay == today) return
    if (prefs(context).getString(KEY_PROMPTED_DAY, null) == today) return
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
    if (post(context, watch)) prefs(context).edit().putString(KEY_PROMPTED_DAY, today).apply()
  }

  fun cancel(context: Context) {
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }

  /** The unlock receiver, registered by VigilService while it runs. */
  fun register(context: Context): BroadcastReceiver {
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_USER_PRESENT) return
        try {
          onUnlock(context)
        } catch (_: Exception) {
          // A failed prompt must never take the guard service down.
        }
      }
    }
    // A system broadcast, so the receiver need not be exported to other apps.
    ContextCompat.registerReceiver(
      context,
      receiver,
      IntentFilter(Intent.ACTION_USER_PRESENT),
      ContextCompat.RECEIVER_NOT_EXPORTED
    )
    return receiver
  }

  fun unregister(context: Context, receiver: BroadcastReceiver?) {
    if (receiver == null) return
    try {
      context.unregisterReceiver(receiver)
    } catch (_: IllegalArgumentException) {
      // Already gone.
    }
  }

  private fun post(context: Context, watch: WakeWatch): Boolean {
    ensureChannel(context, watch.channelName)
    val open = PendingIntent.getActivity(
      context,
      REQUEST_OPEN,
      Intent(Intent.ACTION_VIEW, Uri.parse(WAKE_URL)).apply {
        setPackage(context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      },
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(smallIcon(context))
      .setContentTitle(watch.title)
      .setContentText(watch.body)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setAutoCancel(true)
      .setContentIntent(open)
      .build()
    return try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
      true
    } catch (_: SecurityException) {
      // Notifications were turned off in the meantime.
      false
    }
  }

  private fun ensureChannel(context: Context, name: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_DEFAULT)
    )
  }

  /** The app's monochrome notification icon if the build has one, else the launcher icon. */
  private fun smallIcon(context: Context): Int {
    val res = context.resources
    val notificationIcon = res.getIdentifier("notification_icon", "drawable", context.packageName)
    if (notificationIcon != 0) return notificationIcon
    return context.applicationInfo.icon
  }

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private fun today(): String = dayKey(Calendar.getInstance())

  private fun dayKey(calendar: Calendar): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(calendar.time)
}
