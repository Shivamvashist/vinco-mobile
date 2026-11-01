package expo.modules.vigil

/*
 * The focus panel: what a tap on the floating bubble opens (never Vinco straight away).
 *
 * Layout plan (one card, centred on a scrim, at most 360 dp wide, 16 dp from the screen edges):
 *
 *   +------------------------------------------+
 *   | (laurel) FOCUS          [Custos . Level I] |  header: mark + eyebrow left, guard chip right
 *   |                                          |
 *   |               .--------.                 |  thin ring (3 dp): the share of the session
 *   |             /   1:24 :07 \               |  still to run, gold on the hairline track.
 *   |             \     left    /              |  h:mm large (Figtree, tabular), :ss half size
 *   |               '--------'                 |  and muted; auto-fits so "2:59:59" never clips
 *   |                                          |
 *   |              Ends 7:40 pm                |  muted, the phone's 12 or 24 hour format
 *   |            Closes in 2:41                |  Imperium only: this app's turn, porphyry
 *   | ---------------------------------------- |  hairline
 *   | COMPANIONS                               |  eyebrow
 *   | [Phone] [app] [app] [app]                |  40 dp icons in 48 dp targets, Phone first;
 *   |                                          |  a tap opens the app; scrolls if many
 *   |      Close           [  Open Vinco  ]    |  quiet secondary, gold primary, 48 dp tall
 *   +------------------------------------------+
 *
 * Behaviour: updates every second while open; a tap outside, Back, or Close dismiss it back to
 * the bubble; Open Vinco goes to the focus screen (vinco://focus). Short screens (landscape) get a
 * smaller ring and the card scrolls. Nothing is overfilled: the companions row hides when there
 * are none, the countdown line shows only under Imperium.
 */

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Drawable
import android.text.format.DateFormat
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.util.Date

/** A companion app in the panel's row. */
data class VigilCompanion(val packageName: String, val label: String, val icon: Drawable?)

/** What the panel shows. `appLeftMs` gives Imperium's countdown for the app in front, or null. */
data class VigilPanelSpec(
  val guard: VigilGuardLevel,
  val startedAt: Long,
  val endsAt: Long,
  val copy: VigilCopy,
  val palette: VigilPalette,
  val companions: List<VigilCompanion>,
  val appLeftMs: () -> Long?
)

/** What the panel's actions do. Each runs at most once per panel. */
class VigilPanelActions(
  val onClose: () -> Unit,
  val onOpenVinco: () -> Unit,
  val onLaunch: (packageName: String) -> Unit
)

/** The window root: a tap on the scrim or Back closes the panel. */
@SuppressLint("ViewConstructor")
class VigilPanelRoot(context: Context, private val onBack: () -> Unit) : VigilRoot(context) {
  override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (event.keyCode == KeyEvent.KEYCODE_BACK) {
      if (event.action == KeyEvent.ACTION_UP) onBack()
      return true
    }
    return super.dispatchKeyEvent(event)
  }
}

class VigilPanel(private val context: Context, private val spec: VigilPanelSpec, actions: VigilPanelActions) {
  private val palette = spec.palette
  private val copy = spec.copy
  private var acted = false

  val root: VigilPanelRoot = VigilPanelRoot(context) { once(actions.onClose) }
  val card: View
  private val ringFrame = FrameLayout(context)
  private val ring = VigilRing(context, palette.border, palette.accent, VigilType.dp(context, 3f))
  private val time = VigilViews.timeText(context, "", TIME_SP, palette.text).apply { gravity = Gravity.CENTER }
  private val ends = VigilViews.text(context, "", VigilType.medium(context), 14f, palette.textMuted).apply {
    gravity = Gravity.CENTER
  }
  private val closing = VigilViews.text(context, "", VigilType.semiBold(context), 13f, palette.danger).apply {
    gravity = Gravity.CENTER
    visibility = View.GONE
  }
  private var ringPx = 0

  init {
    root.setBackgroundColor(palette.scrim)
    root.isClickable = true
    root.setOnClickListener { once(actions.onClose) }
    root.onConfigChanged = { sizeRing() }
    // Back reaches the panel only while its window has focus.
    root.isFocusable = true
    root.isFocusableInTouchMode = true

    card = buildCard(actions)
    val holder = FrameLayout(context).apply {
      setPadding(dp(16), dp(24), dp(16), dp(24))
      clipToPadding = false
      isClickable = true
      setOnClickListener { once(actions.onClose) }
      addView(card, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER_HORIZONTAL))
    }
    val scroll = ScrollView(context).apply {
      isVerticalScrollBarEnabled = false
      overScrollMode = View.OVER_SCROLL_NEVER
      clipToPadding = false
      addView(holder)
    }
    root.addView(scroll, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
    sizeRing()
    refresh()
  }

  /** The time, the ring and Imperium's countdown, from the clock now. Called every second. */
  fun refresh() {
    val now = System.currentTimeMillis()
    val left = (spec.endsAt - now).coerceAtLeast(0L)
    val total = (spec.endsAt - spec.startedAt).coerceAtLeast(1L)
    ring.setFraction(left.toFloat() / total.toFloat())

    val seconds = (left + 999L) / 1000L
    val main = "${seconds / 3600}:${((seconds % 3600) / 60).toString().padStart(2, '0')}"
    val tail = ":${(seconds % 60).toString().padStart(2, '0')}"
    VigilViews.fitText(time, VigilViews.timeSpan(main, tail, palette.textMuted), TIME_SP, timeMaxWidth())
    time.contentDescription = "$main$tail ${copy.left}"

    val appLeft = spec.appLeftMs()
    if (appLeft != null && appLeft > 0L) {
      closing.text = "${copy.closingIn} ${VigilPolicy.formatLeft(appLeft)}"
      closing.visibility = View.VISIBLE
    } else {
      closing.visibility = View.GONE
    }
  }

  private fun buildCard(actions: VigilPanelActions): View {
    val column = VigilColumn(context, dp(MAX_WIDTH_DP)).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(20), dp(18), dp(20), dp(16))
      background = VigilViews.surface(context, palette, 26f)
      elevation = VigilType.dp(context, 16f)
      isClickable = true
    }
    column.addView(header())

    ringFrame.addView(ring, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    val center = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
    }
    center.addView(time, VigilViews.matchWidth())
    center.addView(
      VigilViews.text(context, copy.left, VigilType.medium(context), 12f, palette.textMuted).apply {
        gravity = Gravity.CENTER
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
      },
      VigilViews.matchWidth().apply { topMargin = dp(2) }
    )
    ringFrame.addView(center, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
    column.addView(ringFrame, LinearLayout.LayoutParams(dp(160), dp(160)).apply {
      gravity = Gravity.CENTER_HORIZONTAL
      topMargin = dp(18)
    })

    ends.text = "${copy.endsAt} ${DateFormat.getTimeFormat(context).format(Date(spec.endsAt))}"
    column.addView(ends, VigilViews.matchWidth().apply { topMargin = dp(16) })
    column.addView(closing, VigilViews.matchWidth().apply { topMargin = dp(4) })

    if (spec.companions.isNotEmpty()) {
      column.addView(VigilViews.divider(context, palette), LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, VigilViews.hairline(context)).apply {
        topMargin = dp(18)
      })
      column.addView(eyebrow(copy.companions), VigilViews.matchWidth().apply { topMargin = dp(14) })
      column.addView(companionRow(actions), VigilViews.matchWidth().apply { topMargin = dp(8) })
    }

    val buttons = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }
    buttons.addView(
      VigilViews.quietButton(context, palette, copy.close) { once(actions.onClose) },
      LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    )
    buttons.addView(
      VigilViews.primaryButton(context, palette, copy.openVinco) { once(actions.onOpenVinco) },
      LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply { marginStart = dp(8) }
    )
    column.addView(buttons, VigilViews.matchWidth().apply { topMargin = dp(18) })
    return column
  }

  private fun header(): View {
    val row = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
    }
    row.addView(VigilViews.mark(context, palette, palette.accent, 28), LinearLayout.LayoutParams(dp(28), dp(28)))
    row.addView(eyebrow(copy.panelTitle), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
      marginStart = dp(10)
    })
    val chip = VigilViews.text(context, copy.guardName(spec.guard), VigilType.semiBold(context), 12f, palette.accent).apply {
      maxLines = 1
      setPadding(dp(10), dp(5), dp(10), dp(5))
      background = android.graphics.drawable.GradientDrawable().apply {
        setColor(palette.alpha(palette.accent, 0.12f))
        cornerRadius = VigilType.dp(context, 999f)
      }
    }
    row.addView(chip, VigilViews.wrap().apply { marginStart = dp(8) })
    return row
  }

  private fun eyebrow(value: String): TextView =
    VigilViews.text(context, value.uppercase(), VigilType.semiBold(context), 11f, palette.textMuted).apply {
      letterSpacing = 0.14f
      maxLines = 1
    }

  private fun companionRow(actions: VigilPanelActions): View {
    val row = LinearLayout(context).apply { orientation = LinearLayout.HORIZONTAL }
    for (app in spec.companions) {
      val target = FrameLayout(context).apply {
        isClickable = true
        contentDescription = app.label
        background = android.graphics.drawable.GradientDrawable().apply {
          setColor(palette.alpha(palette.text, 0.05f))
          cornerRadius = VigilType.dp(context, 14f)
        }
        setOnClickListener { view ->
          VigilViews.tick(view)
          once { actions.onLaunch(app.packageName) }
        }
      }
      val icon = ImageView(context).apply {
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        scaleType = ImageView.ScaleType.FIT_CENTER
        if (app.icon != null) setImageDrawable(app.icon)
      }
      target.addView(icon, FrameLayout.LayoutParams(dp(36), dp(36), Gravity.CENTER))
      row.addView(target, LinearLayout.LayoutParams(dp(52), dp(52)).apply { marginEnd = dp(8) })
    }
    return HorizontalScrollView(context).apply {
      isHorizontalScrollBarEnabled = false
      overScrollMode = View.OVER_SCROLL_NEVER
      addView(row)
    }
  }

  /** A smaller ring on short screens (landscape), then the time fitted again. */
  private fun sizeRing() {
    val short = context.resources.configuration.screenHeightDp in 1 until 520
    ringPx = dp(if (short) 120 else 160)
    (ringFrame.layoutParams as? LinearLayout.LayoutParams)?.let {
      it.width = ringPx
      it.height = ringPx
      ringFrame.layoutParams = it
    }
    refresh()
  }

  private fun timeMaxWidth(): Int = (ringPx - dp(3) * 2 - dp(18) * 2).coerceAtLeast(dp(60))

  private fun once(action: () -> Unit) {
    if (acted) return
    acted = true
    action()
  }

  private fun dp(value: Int) = VigilType.dp(context, value)

  companion object {
    private const val MAX_WIDTH_DP = 360
    private const val TIME_SP = 40f
  }
}

/** The companions for the panel: the Phone app first, then the Comites, each with its icon. */
object VigilCompanions {
  fun load(context: Context, allowed: Set<String>): List<VigilCompanion> {
    val pm = context.packageManager
    val dialer = VigilApps.dialerPackage(context)
    val ordered = buildList {
      if (dialer != null) add(dialer)
      allowed.filter { it != dialer && it != context.packageName }.sorted().forEach(::add)
    }
    return ordered.mapNotNull { pkg ->
      try {
        if (pm.getLaunchIntentForPackage(pkg) == null) return@mapNotNull null
        val info = pm.getApplicationInfo(pkg, 0)
        VigilCompanion(pkg, pm.getApplicationLabel(info).toString().ifBlank { pkg }, pm.getApplicationIcon(info))
      } catch (_: Exception) {
        null
      }
    }.take(MAX)
  }

  /** Opens a companion. False when it can't be opened. */
  fun launch(context: Context, packageName: String): Boolean {
    val intent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return false
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return try {
      context.startActivity(intent)
      true
    } catch (_: Exception) {
      false
    }
  }

  private const val MAX = 8
}
