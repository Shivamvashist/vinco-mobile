package expo.modules.vigil

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.PowerManager
import androidx.core.content.ContextCompat
import java.util.Calendar

/**
 * Last night's rest as the phone saw it: when the screen went dark for the night and when it
 * came back on. Read by the wake sheet (default bedtime) and the alarm's wake-up log
 * (src/features/sleep/nightRest.ts). Only two timestamps per piece are kept, in their own
 * SharedPreferences file: nothing about what was on screen or which app was open.
 *
 * The rule, in plain words:
 * - A "piece" is one stretch with the screen off of at least PIECE_MIN (30 min). Shorter ones
 *   (a notification lighting the screen, a glance at the time) are ignored.
 * - A piece joins the current chain when the screen was on for at most JOIN_GAP (15 min) between
 *   the chain's end and the piece's start: waking at 3 am to check the time doesn't split the night.
 * - The night starts at the first piece in the chain that began inside the bedtime window
 *   (WINDOW_FROM, 7 pm, to WINDOW_UNTIL, 6 am), so an evening with the phone face down that rolls
 *   into the night does not move bedtime to the afternoon.
 * - Once that night spans REST_MIN to REST_MAX (3 to 16 hours) it is saved, and saved again each
 *   time the chain grows, so the morning's last screen-on ends it.
 *
 * Limits: screen on and off broadcasts can only be heard by a running receiver (Android never
 * delivers them to the manifest), so this only learns while VigilService runs (the guard service
 * turned on). The phone's screen being dark is not the same as sleeping: the user can always edit.
 */
object VigilNight {
  private const val PREFS_NAME = "vinco.vigil.night"
  private const val KEY_OFF_AT = "offAt"
  private const val KEY_CHAIN_END = "chainEnd"
  private const val KEY_NIGHT_START = "nightStart"
  private const val KEY_SLEPT_AT = "sleptAt"
  private const val KEY_WOKE_AT = "wokeAt"
  private const val MINUTE_MS = 60_000L
  private const val PIECE_MIN = 30 * MINUTE_MS
  private const val JOIN_GAP = 15 * MINUTE_MS
  private const val REST_MIN = 3 * 60 * MINUTE_MS
  private const val REST_MAX = 16 * 60 * MINUTE_MS
  /** The bedtime window, in minutes from local midnight: a night starts from 7 pm to 6 am. */
  private const val WINDOW_FROM = 19 * 60
  private const val WINDOW_UNTIL = 6 * 60

  /** Last night's rest as (sleptAt, wokeAt) epoch milliseconds, or null when none is known. */
  @Synchronized
  fun read(context: Context): Pair<Long, Long>? {
    // The screen may have come on a moment ago with the broadcast still on its way (the alarm).
    if (VigilService.isRunning() && isInteractive(context)) onScreenOn(context, System.currentTimeMillis())
    val p = prefs(context)
    val sleptAt = p.getLong(KEY_SLEPT_AT, 0L)
    val wokeAt = p.getLong(KEY_WOKE_AT, 0L)
    if (sleptAt <= 0L || wokeAt <= sleptAt) return null
    return Pair(sleptAt, wokeAt)
  }

  @Synchronized
  fun onScreenOff(context: Context, now: Long) {
    val p = prefs(context)
    // Already dark (a repeated broadcast): keep the earlier start.
    if (p.getLong(KEY_OFF_AT, 0L) > 0L) return
    p.edit().putLong(KEY_OFF_AT, now).apply()
  }

  @Synchronized
  fun onScreenOn(context: Context, now: Long) {
    val p = prefs(context)
    val offAt = p.getLong(KEY_OFF_AT, 0L)
    if (offAt <= 0L) return
    val edit = p.edit().remove(KEY_OFF_AT)
    // Too short to matter, or the clock went backwards.
    if (now <= offAt || now - offAt < PIECE_MIN) {
      edit.apply()
      return
    }
    val chainEnd = p.getLong(KEY_CHAIN_END, 0L)
    var nightStart = p.getLong(KEY_NIGHT_START, 0L)
    val joins = chainEnd > 0L && offAt >= chainEnd && offAt - chainEnd <= JOIN_GAP
    if (!joins) {
      nightStart = if (isInWindow(offAt)) offAt else 0L
    } else if (nightStart <= 0L && isInWindow(offAt)) {
      nightStart = offAt
    }
    edit.putLong(KEY_CHAIN_END, now).putLong(KEY_NIGHT_START, nightStart)
    val span = now - nightStart
    if (nightStart > 0L && span in REST_MIN..REST_MAX) {
      edit.putLong(KEY_SLEPT_AT, nightStart).putLong(KEY_WOKE_AT, now)
    }
    edit.apply()
  }

  /** The service just started: if the screen is dark, the dark stretch starts now. */
  @Synchronized
  fun onServiceStart(context: Context) {
    val p = prefs(context)
    if (isInteractive(context)) {
      // We don't know when this screen came on: drop a dark start from before.
      p.edit().remove(KEY_OFF_AT).apply()
    } else if (p.getLong(KEY_OFF_AT, 0L) <= 0L) {
      p.edit().putLong(KEY_OFF_AT, System.currentTimeMillis()).apply()
    }
  }

  /** The screen on and off receiver, registered by VigilService while it runs. */
  fun register(context: Context): BroadcastReceiver {
    try {
      onServiceStart(context)
    } catch (_: Exception) {
      // A missed start only costs tonight's estimate.
    }
    val receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context, intent: Intent?) {
        // Runs in Vinco's process with the guard service: nothing may get out.
        try {
          val now = System.currentTimeMillis()
          when (intent?.action) {
            Intent.ACTION_SCREEN_OFF -> onScreenOff(context, now)
            Intent.ACTION_SCREEN_ON -> onScreenOn(context, now)
          }
        } catch (_: Exception) {
          // This one is skipped; the next screen change is heard as usual.
        }
      }
    }
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_SCREEN_ON)
    }
    ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
    return receiver
  }

  /** Stops listening. A dark stretch still open can't be finished now, so it is dropped. */
  fun unregister(context: Context, receiver: BroadcastReceiver?) {
    if (receiver == null) return
    try {
      context.unregisterReceiver(receiver)
    } catch (_: IllegalArgumentException) {
      // Already gone.
    }
    try {
      synchronized(this) { prefs(context).edit().remove(KEY_OFF_AT).apply() }
    } catch (_: Exception) {
      // Nothing to drop.
    }
  }

  private fun isInWindow(at: Long): Boolean {
    val calendar = Calendar.getInstance().apply { timeInMillis = at }
    val minutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
    return minutes >= WINDOW_FROM || minutes < WINDOW_UNTIL
  }

  private fun isInteractive(context: Context): Boolean {
    val power = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return true
    return power.isInteractive
  }

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
