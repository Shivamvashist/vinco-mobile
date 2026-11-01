package expo.modules.vigil

/**
 * The reel overlays' words and colours, from what the app sent with `configure`
 * (src/hooks/useReelWatch.ts `reelOverlayCopy`, src/copy/guard.ts `reels.overlay`). Placeholders
 * "{count}", "{budget}" (the allowance), "{passes}", "{max}", "{reels}" and "{price}" are filled here.
 * Anything missing keeps the safe English defaults below.
 */
class VigilReelWords(private val config: VigilReelConfig, private val count: Int, private val allowance: Int) {
  fun get(key: String): String {
    val template = config.words[key]?.takeIf { it.isNotBlank() } ?: DEFAULTS[key] ?: return ""
    return template
      .replace("{count}", count.toString())
      .replace("{budget}", allowance.toString())
      .replace("{passes}", config.passesToday().toString())
      .replace("{max}", config.passMax.toString())
      .replace("{reels}", config.passReels.toString())
      .replace("{price}", config.passPrice.toString())
  }

  companion object {
    val DEFAULTS = mapOf(
      "badge" to "{count} reels",
      "badgeOne" to "1 reel",
      "badgeLabel" to "{count} reels today. Budget {budget}.",
      "badgeHint" to "Shows your reels today",
      "budgetTitle" to "Budget reached: {count} reels",
      "budgetBody" to "That was the budget you set. Close the app and win the day back.",
      "milestoneTitle" to "{count} reels today",
      "milestoneBody" to "Is this what you came for? Close the app and choose.",
      "close" to "Close",
      "panelTitle" to "Reels today",
      "panelCount" to "{count} of {budget}",
      "panelPasses" to "{passes} of {max} passes used",
      "passAction" to "Reel pass +{reels}",
      "passPrice" to "{price} denarii",
      "passesUsed" to "All {max} passes used today. The count starts again at midnight.",
      "passShort" to "A pass costs {price} denarii. Earn them by holding the line.",
      "blockTitle" to "{count} reels, past your budget",
      "blockBody" to "Budget spent. Leave the feed and take the day back.",
      "leave" to "Leave"
    )

    /** The reel colours (surface, border, text, muted, near, onNear, over) as the overlays' palette. */
    fun palette(config: VigilReelConfig): VigilPalette {
      val c = config.colors
      val values = buildMap {
        c["surface"]?.let { put("surface", it); put("surfaceRaised", it) }
        c["border"]?.let { put("border", it) }
        c["text"]?.let { put("text", it) }
        c["muted"]?.let { put("textMuted", it) }
        c["near"]?.let { put("accent", it) }
        c["onNear"]?.let { put("onAccent", it) }
        c["over"]?.let { put("danger", it) }
      }
      return VigilPalette.from(values, "dark")
    }
  }
}
