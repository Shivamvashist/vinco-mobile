package expo.modules.vigil

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView

/**
 * The overlay views, built in code: a dark rounded card in Vinco's Basalt colours with laurel gold,
 * large readable text, and buttons at least 48 dp tall.
 */
object VigilViews {
  private val SURFACE = Color.parseColor("#26221E")
  private val BORDER = Color.parseColor("#3B352E")
  private val TEXT = Color.parseColor("#ECE5D8")
  private val TEXT_MUTED = Color.parseColor("#A99F90")
  private val ACCENT = Color.parseColor("#D2AC55")
  private val ON_ACCENT = Color.parseColor("#1D1A17")
  private val DANGER = Color.parseColor("#D0697D")

  fun dp(context: Context, value: Int): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), context.resources.displayMetrics).toInt()

  fun card(context: Context, title: String, body: String, button: String?, onButton: () -> Unit): View {
    val pad = dp(context, 20)
    val layout = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(pad, pad, pad, pad)
      background = rounded(context, SURFACE, 20, BORDER)
      elevation = dp(context, 8).toFloat()
    }
    layout.addView(text(context, title, 20f, TEXT, bold = true))
    layout.addView(
      text(context, body, 16f, TEXT_MUTED, bold = false).apply { setPadding(0, dp(context, 6), 0, 0) }
    )
    if (button != null) {
      val action = text(context, button, 16f, ON_ACCENT, bold = true).apply {
        gravity = Gravity.CENTER
        minHeight = dp(context, 48)
        background = rounded(context, ACCENT, 14, null)
        isClickable = true
        contentDescription = button
        setOnClickListener { onButton() }
      }
      val params = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
      ).apply { topMargin = dp(context, 16) }
      layout.addView(action, params)
    }
    // A side margin so the card never touches the screen's edges.
    return LinearLayout(context).apply {
      setPadding(dp(context, 16), 0, dp(context, 16), 0)
      addView(
        layout,
        LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
      )
    }
  }

  fun bubble(context: Context, label: String, urgent: Boolean): TextView =
    text(context, label, 17f, TEXT, bold = true).apply {
      gravity = Gravity.CENTER
      minWidth = dp(context, 72)
      minHeight = dp(context, 48)
      setPadding(dp(context, 14), dp(context, 8), dp(context, 14), dp(context, 8))
      elevation = dp(context, 6).toFloat()
      isClickable = true
      styleBubble(context, this, urgent)
    }

  fun styleBubble(context: Context, view: TextView, urgent: Boolean) {
    view.background = rounded(context, SURFACE, 24, if (urgent) DANGER else ACCENT)
    view.setTextColor(if (urgent) DANGER else ACCENT)
    view.contentDescription = view.text
  }

  private fun text(context: Context, value: String, sizeSp: Float, color: Int, bold: Boolean) =
    TextView(context).apply {
      text = value
      setTextColor(color)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
      if (bold) typeface = Typeface.DEFAULT_BOLD
    }

  private fun rounded(context: Context, fill: Int, radiusDp: Int, stroke: Int?) = GradientDrawable().apply {
    setColor(fill)
    cornerRadius = dp(context, radiusDp).toFloat()
    if (stroke != null) setStroke(dp(context, 1), stroke)
  }
}
