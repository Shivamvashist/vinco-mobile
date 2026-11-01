package expo.modules.vigil

import android.annotation.SuppressLint
import android.content.Context
import android.content.res.ColorStateList
import android.content.res.Configuration
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.graphics.drawable.RippleDrawable
import android.os.Build
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.TextPaint
import android.text.TextUtils
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

/** A notice card: one title, one line, maybe a time, maybe two actions (primary and quiet). */
data class VigilNotice(
  val title: String,
  val body: String,
  /** Shown in the tabular time style at the right, as in "1:20". */
  val time: String? = null,
  /** Porphyry instead of laurel gold (Imperium's countdown and rest). */
  val urgent: Boolean = false,
  val primary: String? = null,
  val secondary: String? = null
)

/** What the floating bubble shows. */
data class VigilBubbleState(
  val time: String,
  /** A small word before the time ("Closes in"), or null for the plain focus timer. */
  val label: String?,
  val urgent: Boolean,
  val description: String
)

/** A LinearLayout never wider than `maxWidthPx`: cards stay a comfortable width on tablets and in landscape. */
@SuppressLint("ViewConstructor")
class VigilColumn(context: Context, private val maxWidthPx: Int) : LinearLayout(context) {
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val size = MeasureSpec.getSize(widthMeasureSpec)
    val spec = if (size > maxWidthPx) MeasureSpec.makeMeasureSpec(maxWidthPx, MeasureSpec.getMode(widthMeasureSpec)) else widthMeasureSpec
    super.onMeasure(spec, heightMeasureSpec)
  }
}

/** A window root that hears rotation and screen size changes. */
open class VigilRoot(context: Context) : FrameLayout(context) {
  var onConfigChanged: (() -> Unit)? = null

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    onConfigChanged?.invoke()
  }
}

/**
 * The overlay views, built in code in Vinco's design language: the active palette's surface with
 * a hairline border, rounded corners, Marcellus for the one title, Figtree for the rest, the time
 * in tabular figures, one gold primary action and one quiet secondary. No Material defaults.
 */
object VigilViews {
  const val CARD_MAX_WIDTH_DP = 440
  private const val CARD_RADIUS_DP = 22f

  fun dp(context: Context, value: Int): Int = VigilType.dp(context, value)

  // Notice card --------------------------------------------------------------------------------

  /**
   * ```
   * [laurel]  Title (Marcellus)              1:20
   *           One line (Figtree, muted)
   *                         Not now   [ Back to focus ]
   * ```
   */
  fun notice(context: Context, palette: VigilPalette, notice: VigilNotice, onPrimary: () -> Unit, onSecondary: () -> Unit): View {
    val tint = if (notice.urgent) palette.danger else palette.accent
    val card = VigilColumn(context, dp(context, CARD_MAX_WIDTH_DP)).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(context, 18), dp(context, 16), dp(context, 18), dp(context, 16))
      background = surface(context, palette, CARD_RADIUS_DP)
      elevation = VigilType.dp(context, 10f)
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
      contentDescription = listOfNotNull(notice.title, notice.body, notice.time).joinToString(". ")
    }

    val top = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }
    top.addView(mark(context, palette, tint, 30), LinearLayout.LayoutParams(dp(context, 30), dp(context, 30)))
    val words = LinearLayout(context).apply { orientation = LinearLayout.VERTICAL }
    words.addView(
      text(context, notice.title, VigilType.display(context), 18f, palette.text).apply {
        maxLines = 2
        ellipsize = TextUtils.TruncateAt.END
      }
    )
    words.addView(
      text(context, notice.body, VigilType.medium(context), 14f, palette.textMuted).apply {
        maxLines = 2
        ellipsize = TextUtils.TruncateAt.END
        setPadding(0, dp(context, 2), 0, 0)
      }
    )
    top.addView(
      words,
      LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply { marginStart = dp(context, 12) }
    )
    if (notice.time != null) {
      top.addView(
        timeText(context, notice.time, 22f, tint).apply { setPadding(dp(context, 12), 0, 0, 0) },
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)
      )
    }
    card.addView(top)

    if (notice.primary != null) {
      val row = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.END or Gravity.CENTER_VERTICAL
      }
      if (notice.secondary != null) {
        row.addView(quietButton(context, palette, notice.secondary, onSecondary), wrap())
      }
      row.addView(
        primaryButton(context, palette, notice.primary, onPrimary),
        wrap().apply { marginStart = dp(context, 8) }
      )
      card.addView(row, matchWidth().apply { topMargin = dp(context, 14) })
    }

    // Room around the card for its shadow, centred in the window's width.
    return VigilRoot(context).apply {
      setPadding(dp(context, 16), dp(context, 8), dp(context, 16), dp(context, 16))
      clipToPadding = false
      addView(
        card,
        FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER_HORIZONTAL)
      )
    }
  }

  // Bubble --------------------------------------------------------------------------------------

  /** The pill: the laurel and the time; Imperium adds "Closes in" before it. */
  class Bubble(context: Context, palette: VigilPalette) : VigilRoot(context) {
    private val pill = LinearLayout(context)
    private val glyph = VigilLaurel(context, palette.accent)
    private val label = text(context, "", VigilType.medium(context), 12f, palette.textMuted)
    private val time = timeText(context, "", 16f, palette.text)
    private var shownUrgent: Boolean? = null
    private val tones = palette

    init {
      pill.orientation = LinearLayout.HORIZONTAL
      pill.gravity = Gravity.CENTER_VERTICAL
      pill.minimumHeight = dp(context, 44)
      pill.setPadding(dp(context, 12), dp(context, 6), dp(context, 14), dp(context, 6))
      pill.elevation = VigilType.dp(context, 6f)
      pill.addView(glyph, LinearLayout.LayoutParams(dp(context, 18), dp(context, 18)))
      pill.addView(label, wrap().apply { marginStart = dp(context, 8) })
      pill.addView(time, wrap().apply { marginStart = dp(context, 6) })
      // The widest time it shows ("59:59"), so the pill never jumps as the seconds turn.
      time.minWidth = Layout.getDesiredWidth("00:00", TextPaint(time.paint)).toInt() + 1
      time.gravity = Gravity.CENTER
      setPadding(dp(context, 4), dp(context, 4), dp(context, 4), dp(context, 8))
      clipToPadding = false
      addView(pill, FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT))
      isClickable = true
      isFocusable = false
    }

    fun update(state: VigilBubbleState) {
      time.text = state.time
      label.text = state.label.orEmpty()
      label.visibility = if (state.label == null) View.GONE else View.VISIBLE
      contentDescription = state.description
      if (shownUrgent != state.urgent) {
        shownUrgent = state.urgent
        val tint = if (state.urgent) tones.danger else tones.accent
        pill.background = GradientDrawable().apply {
          setColor(tones.surface)
          cornerRadius = VigilType.dp(context, 999f)
          setStroke(hairline(context), tones.alpha(tint, if (state.urgent) 0.7f else 0.45f))
        }
        glyph.setColor(tint)
        time.setTextColor(if (state.urgent) tones.danger else tones.text)
      }
    }
  }

  // Shared pieces ------------------------------------------------------------------------------

  /** The laurel on a soft round tint of `color`. */
  fun mark(context: Context, palette: VigilPalette, color: Int, sizeDp: Int): View = FrameLayout(context).apply {
    background = GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(palette.alpha(color, 0.14f))
    }
    val inner = dp(context, (sizeDp * 0.6f).toInt())
    addView(VigilLaurel(context, color), FrameLayout.LayoutParams(inner, inner, Gravity.CENTER))
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  /** The gold pill: the one thing to do. At least 48 dp tall. */
  fun primaryButton(context: Context, palette: VigilPalette, label: String, onTap: () -> Unit): TextView =
    button(context, label, palette.onAccent, onTap).apply {
      background = ripple(context, palette, GradientDrawable().apply {
        setColor(palette.accent)
        cornerRadius = VigilType.dp(context, 999f)
      })
    }

  /** The quiet one: text only, muted, the same height. */
  fun quietButton(context: Context, palette: VigilPalette, label: String, onTap: () -> Unit): TextView =
    button(context, label, palette.textMuted, onTap).apply {
      background = ripple(context, palette, GradientDrawable().apply {
        setColor(android.graphics.Color.TRANSPARENT)
        cornerRadius = VigilType.dp(context, 999f)
      })
    }

  private fun button(context: Context, label: String, color: Int, onTap: () -> Unit): TextView =
    text(context, label, VigilType.semiBold(context), 15f, color).apply {
      gravity = Gravity.CENTER
      minHeight = dp(context, 48)
      minWidth = dp(context, 64)
      maxLines = 1
      ellipsize = TextUtils.TruncateAt.END
      setPadding(dp(context, 18), 0, dp(context, 18), 0)
      isClickable = true
      contentDescription = label
      setOnClickListener { view ->
        tick(view)
        onTap()
      }
    }

  /** The card surface: the palette's surface, a hairline border, rounded corners. */
  fun surface(context: Context, palette: VigilPalette, radiusDp: Float): GradientDrawable = GradientDrawable().apply {
    setColor(if (palette.dark) palette.surface else palette.surfaceRaised)
    cornerRadius = VigilType.dp(context, radiusDp)
    setStroke(hairline(context), palette.border)
  }

  fun divider(context: Context, palette: VigilPalette): View = View(context).apply {
    setBackgroundColor(palette.border)
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
  }

  fun text(context: Context, value: String, face: Typeface, sizeSp: Float, color: Int): TextView = TextView(context).apply {
    text = value
    typeface = face
    setTextColor(color)
    setTextSize(TypedValue.COMPLEX_UNIT_PX, VigilType.sp(context, sizeSp))
    includeFontPadding = false
    setLineSpacing(0f, 1.15f)
  }

  /** Figtree with tabular figures, so the digits never shift as they count down. */
  fun timeText(context: Context, value: String, sizeSp: Float, color: Int): TextView =
    text(context, value, VigilType.medium(context), sizeSp, color).apply {
      fontFeatureSettings = "tnum"
      maxLines = 1
      ellipsize = null
      setHorizontallyScrolling(false)
    }

  /** "1:24" with ":07" smaller and muted: the panel's time, as the focus screen shows it. */
  fun timeSpan(main: String, seconds: String, mutedColor: Int): CharSequence {
    val all = SpannableString(main + seconds)
    all.setSpan(RelativeSizeSpan(0.5f), main.length, all.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    all.setSpan(ForegroundColorSpan(mutedColor), main.length, all.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    return all
  }

  /**
   * Sets `value` at `baseSizeSp`, shrinking it (down to half) until it fits `maxWidthPx`, so the time
   * never clips: "2:59:59" at the largest font size included.
   */
  fun fitText(view: TextView, value: CharSequence, baseSizeSp: Float, maxWidthPx: Int) {
    val base = VigilType.sp(view.context, baseSizeSp)
    val floor = base * 0.5f
    val paint = TextPaint(view.paint)
    var size = base
    if (maxWidthPx > 0) {
      paint.textSize = size
      while (size > floor && Layout.getDesiredWidth(value, paint) > maxWidthPx) {
        size -= base * 0.04f
        paint.textSize = size
      }
    }
    if (view.textSize != size) view.setTextSize(TypedValue.COMPLEX_UNIT_PX, size.coerceAtLeast(floor))
    view.text = value
  }

  /** A light haptic tick, where the phone has one and allows it. Fails quietly. */
  fun tick(view: View) {
    try {
      val kind = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.CLOCK_TICK
      view.performHapticFeedback(kind)
    } catch (_: Exception) {
      // No motor, or haptics off: nothing to do.
    }
  }

  fun hairline(context: Context): Int = maxOf(1, VigilType.dp(context, 0.75f).toInt())

  fun wrap() = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT)

  fun matchWidth() = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)

  private fun ripple(context: Context, palette: VigilPalette, content: GradientDrawable): Drawable {
    val mask = GradientDrawable().apply {
      setColor(android.graphics.Color.WHITE)
      cornerRadius = VigilType.dp(context, 999f)
    }
    return RippleDrawable(ColorStateList.valueOf(palette.alpha(palette.text, 0.14f)), content, mask)
  }
}
