package expo.modules.vigil

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/** The guard levels of the reel watch (src/features/guard/guard.ts `GuardLevel`). */
enum class VigilReelLevel(val key: String) {
  PAX("pax"),
  VIGIL("vigil"),
  GUARD("guard"),
  IMPERIUM("imperium");

  /** Vigil and up: the floating badge and the milestone cards. Guard and Imperium add more in 1.1 and 1.2. */
  val showsBadge: Boolean get() = this != PAX

  companion object {
    fun of(key: String?): VigilReelLevel = entries.firstOrNull { it.key == key } ?: PAX
  }
}

/** What the app last sent with `configure` (src/hooks/useReelWatch.ts). */
data class VigilReelConfig(
  val level: VigilReelLevel = VigilReelLevel.PAX,
  val budget: Int = 30,
  val markedPackages: Set<String> = emptySet(),
  /** The overlay words (src/copy/guard.ts `reels.overlay`), with "{count}" and "{budget}" filled in here. */
  val words: Map<String, String> = emptyMap(),
  /** The overlay colours as "#RRGGBB" (surface, border, text, near, over). */
  val colors: Map<String, String> = emptyMap()
)

/**
 * The reel counts and the reel watch's settings, in their own SharedPreferences file
 * ("vinco.vigil.reels"), apart from the focus store "vinco.vigil" that a focus ending clears.
 *
 * Counts are kept per local day ("yyyy-MM-dd" in the phone's time zone at the moment of counting):
 * a new day starts at 0 at midnight, and a clock or time zone change simply counts into the day it
 * now is (a day already seen picks up where it left off). Today's count is a plain int, so counting
 * is O(1); past days sit in a small JSON object touched only when the day changes. The last
 * [KEEP_DAYS] days are kept. Shared by the service and the module (one process), so every call is
 * synchronised.
 */
object VigilReelStore {
  private const val PREFS_NAME = "vinco.vigil.reels"
  private const val KEY_DAY = "day"
  private const val KEY_COUNT = "count"
  private const val KEY_HISTORY = "history"
  private const val KEY_CONFIGURED = "configured"
  private const val KEY_LEVEL = "level"
  private const val KEY_BUDGET = "budget"
  private const val KEY_MARKED = "marked"
  private const val KEY_COPY = "copy"
  private const val KEY_COLORS = "colors"
  private const val KEEP_DAYS = 60
  private const val MAX_TEXT = 160
  private const val MAX_PACKAGES = 50
  private val COLOR = Regex("^#[0-9A-Fa-f]{6}$")

  @Volatile private var cachedConfig: VigilReelConfig? = null

  /** Saves the settings. Packages are trimmed and capped; text is capped. */
  @Synchronized
  fun saveConfig(context: Context, config: VigilReelConfig) {
    val clean = config.copy(
      budget = config.budget.coerceIn(1, 10_000),
      markedPackages = config.markedPackages.map { it.trim() }.filter { it.isNotEmpty() }.take(MAX_PACKAGES).toSet(),
      words = config.words.mapValues { it.value.take(MAX_TEXT) },
      colors = config.colors.filterValues { it.matches(COLOR) }
    )
    prefs(context).edit()
      .putBoolean(KEY_CONFIGURED, true)
      .putString(KEY_LEVEL, clean.level.key)
      .putInt(KEY_BUDGET, clean.budget)
      .putString(KEY_MARKED, clean.markedPackages.joinToString("\n"))
      .putString(KEY_COPY, JSONObject(clean.words).toString())
      .putString(KEY_COLORS, JSONObject(clean.colors).toString())
      .apply()
    cachedConfig = clean
  }

  /** The settings, or null until the app has sent them once (nothing is counted before that). */
  @Synchronized
  fun config(context: Context): VigilReelConfig? {
    cachedConfig?.let { return it }
    val p = prefs(context)
    if (!p.getBoolean(KEY_CONFIGURED, false)) return null
    val read = VigilReelConfig(
      level = VigilReelLevel.of(p.getString(KEY_LEVEL, null)),
      budget = p.getInt(KEY_BUDGET, 30),
      markedPackages = p.getString(KEY_MARKED, null).orEmpty().split('\n').filter { it.isNotBlank() }.toSet(),
      words = readMap(p.getString(KEY_COPY, null)),
      colors = readMap(p.getString(KEY_COLORS, null))
    )
    cachedConfig = read
    return read
  }

  /** Counts one reel today. Returns today's new count. */
  @Synchronized
  fun increment(context: Context): Int {
    val p = prefs(context)
    val today = today()
    val count = rollTo(p, today) + 1
    p.edit().putString(KEY_DAY, today).putInt(KEY_COUNT, count).apply()
    return count
  }

  /** Reels counted today (0 on a new day). */
  @Synchronized
  fun todayCount(context: Context): Int {
    val p = prefs(context)
    val today = today()
    return if (p.getString(KEY_DAY, null) == today) p.getInt(KEY_COUNT, 0) else historyOf(p)[today] ?: 0
  }

  /** Every kept day with its count, today included, oldest first. */
  @Synchronized
  fun days(context: Context): List<Pair<String, Int>> {
    val p = prefs(context)
    val all = historyOf(p).toMutableMap()
    p.getString(KEY_DAY, null)?.let { all[it] = p.getInt(KEY_COUNT, 0) }
    return all.entries.sortedBy { it.key }.map { it.key to it.value }
  }

  fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)

  /**
   * Makes `day` the current one and returns its count so far. When the stored day differs (midnight,
   * or the clock moved), the old day goes into the history and `day` resumes from it if it is there.
   */
  private fun rollTo(p: SharedPreferences, day: String): Int {
    val stored = p.getString(KEY_DAY, null)
    if (stored == day) return p.getInt(KEY_COUNT, 0)
    val history = historyOf(p).toMutableMap()
    if (stored != null) history[stored] = p.getInt(KEY_COUNT, 0)
    val resumed = history.remove(day) ?: 0
    val kept = history.entries.sortedByDescending { it.key }.take(KEEP_DAYS - 1)
    val json = JSONObject()
    for ((key, value) in kept) json.put(key, value)
    p.edit().putString(KEY_HISTORY, json.toString()).putString(KEY_DAY, day).putInt(KEY_COUNT, resumed).apply()
    return resumed
  }

  private fun historyOf(p: SharedPreferences): Map<String, Int> {
    val raw = p.getString(KEY_HISTORY, null) ?: return emptyMap()
    return try {
      val json = JSONObject(raw)
      json.keys().asSequence().associateWith { json.optInt(it, 0) }
    } catch (_: Exception) {
      emptyMap()
    }
  }

  private fun readMap(raw: String?): Map<String, String> {
    if (raw == null) return emptyMap()
    return try {
      val json = JSONObject(raw)
      json.keys().asSequence().associateWith { json.optString(it) }
    } catch (_: Exception) {
      emptyMap()
    }
  }

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

}
