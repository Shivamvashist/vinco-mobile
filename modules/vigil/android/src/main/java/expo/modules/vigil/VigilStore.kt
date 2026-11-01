package expo.modules.vigil

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject

/** A running focus, as the phone keeps it. Times are wall-clock milliseconds. */
data class VigilSession(
  val guard: VigilGuardLevel,
  val startedAt: Long,
  val endsAt: Long,
  val allowedPackages: Set<String>,
  val copy: VigilCopy,
  /** `SystemClock.elapsedRealtime()` at which the focus ends, valid only on `bootCount`. */
  val elapsedEndsAt: Long,
  val bootCount: Int,
  /** The overlays' colours (the palette active when the focus began). */
  val palette: VigilPalette = VigilPalette()
)

enum class VigilGuardLevel(val key: String) {
  CUSTOS("custos"),
  IMPERIUM("imperium"),
  SILENTIUM("silentium");

  companion object {
    fun of(key: String?): VigilGuardLevel? = entries.firstOrNull { it.key == key }
  }
}

/**
 * The Vigil's own small store (SharedPreferences "vinco.vigil"): the running focus and, for
 * Imperium, when each app's 3 minutes end. It survives Vinco being closed and the phone restarting,
 * so the accessibility service (restarted by the system) can pick the focus up on its own.
 */
class VigilStore(context: Context) {
  private val appContext = context.applicationContext
  private val prefs: SharedPreferences = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun save(session: VigilSession) {
    prefs.edit()
      .putString(KEY_GUARD, session.guard.key)
      .putLong(KEY_STARTED, session.startedAt)
      .putLong(KEY_ENDS, session.endsAt)
      .putString(KEY_ALLOWED, JSONArray(session.allowedPackages.toList()).toString())
      .putString(KEY_COPY, session.copy.toJson().toString())
      .putLong(KEY_ELAPSED_ENDS, session.elapsedEndsAt)
      .putInt(KEY_BOOT, session.bootCount)
      .putString(KEY_PALETTE, session.palette.toJson().toString())
      .remove(KEY_APP_WINDOWS)
      .commit()
  }

  fun clear() {
    prefs.edit().clear().commit()
  }

  /**
   * The running focus, or null. The hard stop lives here: once the focus is over (by the wall clock,
   * or by the time measured since it began on this boot) it is cleared and never comes back.
   */
  fun activeSession(): VigilSession? {
    val session = read() ?: return null
    if (isOver(session)) {
      clear()
      return null
    }
    return session
  }

  fun isOver(session: VigilSession): Boolean {
    if (System.currentTimeMillis() >= session.endsAt) return true
    val sameBoot = session.bootCount != UNKNOWN_BOOT && session.bootCount == bootCount(appContext)
    return sameBoot && SystemClock.elapsedRealtime() >= session.elapsedEndsAt
  }

  /** Imperium: package to the moment its 3 minutes end (the cooldown follows). */
  fun readAppWindows(): MutableMap<String, Long> {
    val result = mutableMapOf<String, Long>()
    val raw = prefs.getString(KEY_APP_WINDOWS, null) ?: return result
    try {
      val json = JSONObject(raw)
      json.keys().forEach { key -> result[key] = json.optLong(key) }
    } catch (_: Exception) {
      // A damaged entry only resets the per-app timers.
    }
    return result
  }

  fun saveAppWindows(windows: Map<String, Long>) {
    prefs.edit().putString(KEY_APP_WINDOWS, JSONObject(windows.toMap()).toString()).apply()
  }

  private fun read(): VigilSession? {
    val guard = VigilGuardLevel.of(prefs.getString(KEY_GUARD, null)) ?: return null
    val allowed = mutableSetOf<String>()
    try {
      val array = JSONArray(prefs.getString(KEY_ALLOWED, "[]"))
      for (index in 0 until array.length()) array.optString(index).takeIf { it.isNotBlank() }?.let(allowed::add)
    } catch (_: Exception) {
      // No list: only the always-allowed apps.
    }
    val copy = try {
      VigilCopy.fromJson(prefs.getString(KEY_COPY, null)?.let(::JSONObject))
    } catch (_: Exception) {
      VigilCopy()
    }
    val palette = try {
      VigilPalette.fromJson(prefs.getString(KEY_PALETTE, null)?.let(::JSONObject))
    } catch (_: Exception) {
      VigilPalette()
    }
    return VigilSession(
      guard = guard,
      startedAt = prefs.getLong(KEY_STARTED, 0L),
      endsAt = prefs.getLong(KEY_ENDS, 0L),
      allowedPackages = allowed,
      copy = copy,
      elapsedEndsAt = prefs.getLong(KEY_ELAPSED_ENDS, 0L),
      bootCount = prefs.getInt(KEY_BOOT, UNKNOWN_BOOT),
      palette = palette
    )
  }

  companion object {
    const val PREFS_NAME = "vinco.vigil"
    const val UNKNOWN_BOOT = -1
    private const val KEY_GUARD = "guard"
    private const val KEY_STARTED = "startedAt"
    private const val KEY_ENDS = "endsAt"
    private const val KEY_ALLOWED = "allowedPackages"
    private const val KEY_COPY = "copy"
    private const val KEY_ELAPSED_ENDS = "elapsedEndsAt"
    private const val KEY_BOOT = "bootCount"
    private const val KEY_PALETTE = "palette"
    private const val KEY_APP_WINDOWS = "appWindows"

    /** Which boot of the phone this is, so measured time is never compared across a restart. */
    fun bootCount(context: Context): Int =
      Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT, UNKNOWN_BOOT)
  }
}
