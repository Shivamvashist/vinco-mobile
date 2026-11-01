package expo.modules.vigil

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The reel watch's windows over a marked app (Vigil level and up): the live badge and the
 * milestone card. Apart from the focus windows (VigilOverlay), so a focus and the reel watch can
 * both be on screen.
 *
 * - The badge is a small dark pill with the day's count in tabular digits. It never takes a touch
 *   (the app under it works as usual) and turns gold near the budget and porphyry past it.
 * - The card steps in at a milestone. Its "Close" button wakes after [CARD_LOCK_MS]; it also goes
 *   when the user leaves the app, and on its own after [CARD_MAX_MS].
 *
 * Words and colours come from the app (`configure`); missing ones keep the Basalt defaults. With
 * "Display over other apps" they are application overlays; without it, the accessibility overlay.
 * If neither can be drawn, counting carries on without them.
 */
class VigilBadge(private val service: Context) {
  private val windowManager = service.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private var badge: TextView? = null
  private var card: View? = null
  private val hideCardLater = Runnable { hideCard() }

  fun showBadge(count: Int, config: VigilReelConfig) {
    val text = badgeText(count, config)
    val stage = VigilReelPolicy.stage(count, config.budget)
    val existing = badge
    if (existing != null) {
      existing.text = text
      styleBadge(existing, stage, count, config)
      return
    }
    val view = TextView(service).apply {
      this.text = text
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      typeface = Typeface.DEFAULT_BOLD
      // Tabular digits: the pill doesn't jump as the count changes.
      fontFeatureSettings = "tnum"
      gravity = Gravity.CENTER
      minWidth = dp(56)
      minHeight = dp(32)
      setPadding(dp(12), dp(4), dp(12), dp(4))
      elevation = dp(4).toFloat()
    }
    styleBadge(view, stage, count, config)
    val params = params(touchable = false).apply {
      gravity = Gravity.TOP or Gravity.START
      x = dp(12)
      y = dp(88)
    }
    if (add(view, params)) badge = view
  }

  fun hideBadge() {
    badge?.let(::remove)
    badge = null
  }

  fun showCard(milestone: VigilReelMilestone, count: Int, config: VigilReelConfig) {
    hideCard()
    val words = config.words
    val (titleKey, bodyKey) = when (milestone) {
      VigilReelMilestone.BUDGET -> "budgetTitle" to "budgetBody"
      VigilReelMilestone.EVERY -> "milestoneTitle" to "milestoneBody"
    }
    val title = VigilReelPolicy.fill(words[titleKey] ?: DEFAULT_WORDS.getValue(titleKey), count, config.budget)
    val body = VigilReelPolicy.fill(words[bodyKey] ?: DEFAULT_WORDS.getValue(bodyKey), count, config.budget)
    val close = words["close"] ?: DEFAULT_WORDS.getValue("close")
    val view = cardView(title, body, close, config)
    val params = params(touchable = true).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      width = WindowManager.LayoutParams.MATCH_PARENT
      y = dp(140)
    }
    if (add(view, params)) {
      card = view
      handler.postDelayed(hideCardLater, CARD_MAX_MS)
    }
  }

  fun hideCard() {
    handler.removeCallbacks(hideCardLater)
    card?.let(::remove)
    card = null
  }

  fun hideAll() {
    hideCard()
    hideBadge()
    handler.removeCallbacksAndMessages(null)
  }

  private fun badgeText(count: Int, config: VigilReelConfig): String {
    val key = if (count == 1) "badgeOne" else "badge"
    return VigilReelPolicy.fill(config.words[key] ?: DEFAULT_WORDS.getValue(key), count, config.budget)
  }

  private fun styleBadge(view: TextView, stage: VigilReelStage, count: Int, config: VigilReelConfig) {
    val line = when (stage) {
      VigilReelStage.CALM -> color(config, "text")
      VigilReelStage.NEAR -> color(config, "near")
      VigilReelStage.OVER -> color(config, "over")
    }
    view.setTextColor(line)
    view.background = rounded(color(config, "surface"), 16, if (stage == VigilReelStage.CALM) color(config, "border") else line)
    val label = config.words["badgeLabel"] ?: DEFAULT_WORDS.getValue("badgeLabel")
    view.contentDescription = VigilReelPolicy.fill(label, count, config.budget)
  }

  private fun cardView(title: String, body: String, close: String, config: VigilReelConfig): View {
    val pad = dp(20)
    val inner = LinearLayout(service).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(pad, pad, pad, pad)
      background = rounded(color(config, "surface"), 20, color(config, "border"))
      elevation = dp(8).toFloat()
    }
    inner.addView(text(title, 20f, color(config, "text"), bold = true))
    inner.addView(text(body, 16f, color(config, "muted"), bold = false).apply { setPadding(0, dp(6), 0, 0) })
    val button = text(close, 16f, color(config, "onNear"), bold = true).apply {
      gravity = Gravity.CENTER
      minHeight = dp(48)
      background = rounded(color(config, "near"), 14, null)
      contentDescription = close
      isEnabled = false
      alpha = 0.4f
      setOnClickListener { hideCard() }
    }
    inner.addView(
      button,
      LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
        .apply { topMargin = dp(16) }
    )
    // The card can be closed after a short pause, so the step-in is read, not swiped away.
    handler.postDelayed({
      button.isEnabled = true
      button.alpha = 1f
    }, CARD_LOCK_MS)
    return LinearLayout(service).apply {
      setPadding(dp(16), 0, dp(16), 0)
      addView(inner, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
    }
  }

  private fun text(value: String, sizeSp: Float, color: Int, bold: Boolean) = TextView(service).apply {
    text = value
    setTextColor(color)
    setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
    if (bold) typeface = Typeface.DEFAULT_BOLD
  }

  private fun params(touchable: Boolean): WindowManager.LayoutParams {
    val type = if (VigilOverlay.canDrawOverlays(service)) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
    }
    var flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
    if (!touchable) flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
    return WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      type,
      flags,
      PixelFormat.TRANSLUCENT
    )
  }

  private fun add(view: View, params: WindowManager.LayoutParams): Boolean = try {
    windowManager.addView(view, params)
    true
  } catch (_: Exception) {
    false
  }

  private fun remove(view: View) {
    try {
      windowManager.removeView(view)
    } catch (_: Exception) {
      // Already gone.
    }
  }

  private fun rounded(fill: Int, radiusDp: Int, stroke: Int?) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = dp(radiusDp).toFloat()
    if (stroke != null) setStroke(dp(1), stroke)
  }

  private fun color(config: VigilReelConfig, role: String): Int {
    val value = config.colors[role] ?: DEFAULT_COLORS.getValue(role)
    return try {
      Color.parseColor(value)
    } catch (_: Exception) {
      Color.parseColor(DEFAULT_COLORS.getValue(role))
    }
  }

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), service.resources.displayMetrics).toInt()

  companion object {
    const val CARD_LOCK_MS = 5_000L
    const val CARD_MAX_MS = 60_000L

    /** Basalt, for a build that hasn't heard from the app yet. */
    private val DEFAULT_COLORS = mapOf(
      "surface" to "#26221E",
      "border" to "#3B352E",
      "text" to "#ECE5D8",
      "muted" to "#A99F90",
      "near" to "#D2AC55",
      "onNear" to "#1D1A17",
      "over" to "#D0697D"
    )

    private val DEFAULT_WORDS = mapOf(
      "badge" to "{count} reels",
      "badgeOne" to "1 reel",
      "badgeLabel" to "{count} reels today. Budget {budget}.",
      "budgetTitle" to "Budget reached",
      "budgetBody" to "{count} reels today. That was the budget. Close the app and win the day back.",
      "milestoneTitle" to "{count} reels",
      "milestoneBody" to "{count} reels so far today. Is this what you came for?",
      "close" to "Close"
    )
  }
}
