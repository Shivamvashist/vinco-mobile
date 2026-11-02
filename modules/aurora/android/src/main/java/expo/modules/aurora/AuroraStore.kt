package expo.modules.aurora

import android.content.Context
import android.content.SharedPreferences
import java.util.Calendar

/** What the notification says. Written by the app in the user's tone (src/copy/aurora.ts). */
data class AuroraLabels(
  val channelName: String,
  val title: String,
  val body: String,
  val action: String,
  val timedOutTitle: String,
  val timedOutBody: String
)

/**
 * Aurora's own small store on the phone (SharedPreferences): the next ring, the repeat rule (so
 * the next ring can be set after a ring or a reboot without the app), the notification labels,
 * when the ringing started, and the user's alarm volume while Aurora rings at full volume.
 */
class AuroraStore(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  var nextRingAt: Long
    get() = prefs.getLong(KEY_NEXT, 0L)
    set(value) = prefs.edit().putLong(KEY_NEXT, value).apply()

  /** Minutes after midnight, or -1 for a one-off ring. */
  var repeatMinutes: Int
    get() = prefs.getInt(KEY_MINUTES, -1)
    set(value) = prefs.edit().putInt(KEY_MINUTES, value).apply()

  /** Bit 0 = Monday ... bit 6 = Sunday, like the app's weeks. */
  var repeatDays: Int
    get() = prefs.getInt(KEY_DAYS, 0)
    set(value) = prefs.edit().putInt(KEY_DAYS, value).apply()

  /** When the current ringing started, or 0 when silent. Written at once (commit). */
  var ringingSince: Long
    get() = prefs.getLong(KEY_RINGING, 0L)
    set(value) {
      prefs.edit().putLong(KEY_RINGING, value).commit()
    }

  /** The alarm volume before Aurora raised it, or -1 when there is nothing to restore. */
  var savedAlarmVolume: Int
    get() = prefs.getInt(KEY_SAVED_VOLUME, -1)
    set(value) {
      prefs.edit().putInt(KEY_SAVED_VOLUME, value).commit()
    }

  var labels: AuroraLabels
    get() = AuroraLabels(
      channelName = prefs.getString(KEY_CHANNEL, null) ?: "Aurora alarm",
      title = prefs.getString(KEY_TITLE, null) ?: "Aurora",
      body = prefs.getString(KEY_BODY, null) ?: "Time to rise. Open Vinco to stop the alarm.",
      action = prefs.getString(KEY_ACTION, null) ?: "Stop",
      timedOutTitle = prefs.getString(KEY_TIMED_OUT_TITLE, null) ?: "Aurora stopped",
      timedOutBody = prefs.getString(KEY_TIMED_OUT_BODY, null) ?: "It rang for 10 minutes."
    )
    set(value) {
      prefs.edit()
        .putString(KEY_CHANNEL, value.channelName)
        .putString(KEY_TITLE, value.title)
        .putString(KEY_BODY, value.body)
        .putString(KEY_ACTION, value.action)
        .putString(KEY_TIMED_OUT_TITLE, value.timedOutTitle)
        .putString(KEY_TIMED_OUT_BODY, value.timedOutBody)
        .apply()
    }

  fun isRinging(now: Long = System.currentTimeMillis()): Boolean {
    val since = ringingSince
    return since > 0L && now - since < AuroraRingService.MAX_RING_MS
  }

  fun clearSchedule() {
    prefs.edit().remove(KEY_NEXT).remove(KEY_MINUTES).remove(KEY_DAYS).apply()
  }

  /** The next ring after `now` from the repeat rule, or 0 when there is no rule. */
  fun nextFromRepeat(now: Long = System.currentTimeMillis()): Long =
    nextRingFrom(repeatMinutes, repeatDays, now)

  companion object {
    private const val PREFS_NAME = "vinco.aurora"
    private const val KEY_NEXT = "nextRingAt"
    private const val KEY_MINUTES = "repeatMinutes"
    private const val KEY_DAYS = "repeatDays"
    private const val KEY_RINGING = "ringingSince"
    private const val KEY_SAVED_VOLUME = "savedAlarmVolume"
    private const val KEY_CHANNEL = "labelChannel"
    private const val KEY_TITLE = "labelTitle"
    private const val KEY_BODY = "labelBody"
    private const val KEY_ACTION = "labelAction"
    private const val KEY_TIMED_OUT_TITLE = "labelTimedOutTitle"
    private const val KEY_TIMED_OUT_BODY = "labelTimedOutBody"

    /** Same rule as getNextRing in src/features/aurora/aurora.ts. */
    fun nextRingFrom(minutes: Int, daysMask: Int, now: Long): Long {
      if (minutes !in 0 until 1440 || daysMask and 0x7F == 0) return 0L
      for (offset in 0..7) {
        val candidate = Calendar.getInstance().apply {
          timeInMillis = now
          add(Calendar.DAY_OF_YEAR, offset)
          set(Calendar.HOUR_OF_DAY, minutes / 60)
          set(Calendar.MINUTE, minutes % 60)
          set(Calendar.SECOND, 0)
          set(Calendar.MILLISECOND, 0)
        }
        // Calendar: Sunday = 1 ... Saturday = 7. Monday-first: Monday = 0 ... Sunday = 6.
        val weekday = (candidate.get(Calendar.DAY_OF_WEEK) + 5) % 7
        if (candidate.timeInMillis > now && (daysMask shr weekday) and 1 == 1) {
          return candidate.timeInMillis
        }
      }
      return 0L
    }
  }
}
