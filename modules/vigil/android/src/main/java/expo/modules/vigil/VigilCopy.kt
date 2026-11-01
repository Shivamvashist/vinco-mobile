package expo.modules.vigil

import org.json.JSONObject

/**
 * The words the overlays show. Written by the app (src/copy/focus.ts `overlay`, passed in
 * `startFocus`); these are only the fallbacks for keys the app didn't send.
 */
data class VigilCopy(
  val alertTitle: String = "Focus is on",
  val alertBody: String = "This app is outside your focus.",
  val nudgeTitle: String = "Back to the line",
  val nudgeBody: String = "Three minutes away from your focus.",
  val openVinco: String = "Open Vinco",
  val backToFocus: String = "Back to focus",
  val dismiss: String = "Not now",
  val close: String = "Close",
  /** Followed by the countdown, as in "Closes in 2:41". */
  val closingIn: String = "Closes in",
  val restingTitle: String = "This app is resting",
  /** Followed by the time left, as in "Opens again in 1:20". */
  val cooldown: String = "Opens again in",
  val panelTitle: String = "Focus",
  /** Under the big time in the panel. */
  val left: String = "left",
  /** Followed by the end time, as in "Ends 7:40 pm". */
  val endsAt: String = "Ends",
  val companions: String = "Companions",
  val guardCustos: String = "Custos · Level I",
  val guardImperium: String = "Imperium · Level II",
  val guardSilentium: String = "Silentium · Level III",
  /** The bubble's hint for screen readers. */
  val bubbleHint: String = "Shows your focus"
) {
  fun guardName(level: VigilGuardLevel): String = when (level) {
    VigilGuardLevel.CUSTOS -> guardCustos
    VigilGuardLevel.IMPERIUM -> guardImperium
    VigilGuardLevel.SILENTIUM -> guardSilentium
  }

  fun toMap(): Map<String, String> = mapOf(
    "alertTitle" to alertTitle,
    "alertBody" to alertBody,
    "nudgeTitle" to nudgeTitle,
    "nudgeBody" to nudgeBody,
    "openVinco" to openVinco,
    "backToFocus" to backToFocus,
    "dismiss" to dismiss,
    "close" to close,
    "closingIn" to closingIn,
    "restingTitle" to restingTitle,
    "cooldown" to cooldown,
    "panelTitle" to panelTitle,
    "left" to left,
    "endsAt" to endsAt,
    "companions" to companions,
    "guardCustos" to guardCustos,
    "guardImperium" to guardImperium,
    "guardSilentium" to guardSilentium,
    "bubbleHint" to bubbleHint
  )

  fun toJson(): JSONObject = JSONObject(toMap())

  companion object {
    /** Unknown keys are ignored; missing or blank ones keep the fallback. */
    fun from(values: Map<String, String>): VigilCopy {
      val base = VigilCopy()
      fun pick(key: String, fallback: String) = values[key]?.takeIf { it.isNotBlank() }?.take(MAX_LEN) ?: fallback
      return VigilCopy(
        alertTitle = pick("alertTitle", base.alertTitle),
        alertBody = pick("alertBody", base.alertBody),
        nudgeTitle = pick("nudgeTitle", base.nudgeTitle),
        nudgeBody = pick("nudgeBody", base.nudgeBody),
        openVinco = pick("openVinco", base.openVinco),
        backToFocus = pick("backToFocus", base.backToFocus),
        dismiss = pick("dismiss", base.dismiss),
        close = pick("close", base.close),
        closingIn = pick("closingIn", base.closingIn),
        restingTitle = pick("restingTitle", base.restingTitle),
        cooldown = pick("cooldown", base.cooldown),
        panelTitle = pick("panelTitle", base.panelTitle),
        left = pick("left", base.left),
        endsAt = pick("endsAt", base.endsAt),
        companions = pick("companions", base.companions),
        guardCustos = pick("guardCustos", base.guardCustos),
        guardImperium = pick("guardImperium", base.guardImperium),
        guardSilentium = pick("guardSilentium", base.guardSilentium),
        bubbleHint = pick("bubbleHint", base.bubbleHint)
      )
    }

    fun fromJson(json: JSONObject?): VigilCopy {
      if (json == null) return VigilCopy()
      val values = mutableMapOf<String, String>()
      json.keys().forEach { key -> values[key] = json.optString(key) }
      return from(values)
    }

    private const val MAX_LEN = 120
  }
}
