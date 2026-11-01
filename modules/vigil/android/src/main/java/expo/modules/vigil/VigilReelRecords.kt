package expo.modules.vigil

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * What `configure` receives from JavaScript (src/features/guard/bridge.ts `toNativeReelConfig`):
 * the level, the daily budget, the marked apps, and the overlay's words and colours.
 */
class ReelWatchConfig : Record {
  @Field val level: String = "pax"
  @Field val reelBudget: Int = 30
  @Field val markedPackages: List<String> = emptyList()

  /** Overlay words (VigilBadge keys), with "{count}" and "{budget}" placeholders. Missing keys keep the defaults. */
  @Field val copy: Map<String, String> = emptyMap()

  /** Overlay colours as "#RRGGBB" (VigilBadge roles). Missing ones keep Basalt. */
  @Field val colors: Map<String, String> = emptyMap()

  /** The reel pass: the phone's day it belongs to, how many today, the purse, and its rules. */
  @Field val passDay: String = ""
  @Field val passes: Int = 0
  @Field val denarii: Int = 0
  @Field val passPrice: Int = 20
  @Field val passReels: Int = 12
  @Field val passMax: Int = 3

  fun toConfig(): VigilReelConfig = VigilReelConfig(
    level = VigilReelLevel.of(level),
    budget = reelBudget,
    markedPackages = markedPackages.toSet(),
    words = copy,
    colors = colors,
    passDay = passDay,
    passes = passes,
    denarii = denarii,
    passPrice = passPrice,
    passReels = passReels,
    passMax = passMax
  )
}

/** The kept days for JavaScript: `[{ day: "yyyy-MM-dd", count }]`, oldest first. */
fun reelDaysForJs(days: List<Pair<String, Int>>): List<Map<String, Any>> =
  days.map { (day, count) -> mapOf("day" to day, "count" to count) }
