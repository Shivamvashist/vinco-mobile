package expo.modules.vigil

/*
 * The reel panel (a tap on the badge) and the blocking card (every reel past the allowance).
 *
 *   Panel                                   Blocking card
 *   +--------------------------------+      +--------------------------------+
 *   | REELS TODAY                    |      | (laurel, porphyry)             |
 *   |        .-------.               |      | 47 reels, past your budget     |  Marcellus
 *   |       (  18    )  thin ring    |      | The tone's one line, muted.    |
 *   |        '-------'               |      |                                |
 *   |        of 30                   |      | [        Leave        ]        |  gold primary
 *   |   1 of 3 passes used           |      |   Reel pass +12 . 20 denarii   |  quiet
 *   | [ Reel pass +12 . 20 denarii ] |      |            Close               |  Vigil only
 *   |            Close               |      +--------------------------------+
 *   +--------------------------------+
 *
 * Both sit centred on a scrim in a card at most 360 dp wide. The panel closes on the scrim, Back
 * or Close. The blocking card takes every touch so the feed below can't scroll; at Vigil the scrim,
 * Back and Close dismiss it, at Guard and Imperium Back means Leave.
 */

import android.content.Context
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/** What the reel overlays can do. Each card runs at most one action. */
class VigilReelActions(val onClose: () -> Unit, val onPass: () -> Unit, val onLeave: () -> Unit)

/** The panel a tap on the badge opens: today's count against the allowance, and the pass. */
class VigilReelPanelView(context: Context, words: VigilReelWords, palette: VigilPalette, state: VigilReelState, actions: VigilReelActions) {
  private var acted = false
  val root = VigilPanelRoot(context) { once(actions.onClose) }
  val card: View

  init {
    val column = reelColumn(context, palette)
    column.addView(eyebrow(context, palette, words.get("panelTitle")), VigilViews.matchWidth())
    val stageColor = when (VigilReelPolicy.stage(state.count, state.allowance)) {
      VigilReelStage.CALM -> palette.text
      VigilReelStage.NEAR -> palette.accent
      VigilReelStage.OVER -> palette.danger
    }
    val ring = FrameLayout(context).apply {
      contentDescription = words.get("badgeLabel")
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
    }
    ring.addView(
      VigilRing(context, palette.border, stageColor, VigilType.dp(context, 3f)).apply {
        setFraction(if (state.allowance > 0) state.count.toFloat() / state.allowance else 1f)
      },
      FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
    )
    ring.addView(
      VigilViews.timeText(context, state.count.toString(), 34f, stageColor).apply { gravity = Gravity.CENTER },
      FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER)
    )
    column.addView(ring, LinearLayout.LayoutParams(dp(context, 120), dp(context, 120)).apply {
      gravity = Gravity.CENTER_HORIZONTAL
      topMargin = dp(context, 16)
    })
    column.addView(centered(context, words.get("panelCount"), 14f, palette.textMuted), VigilViews.matchWidth().apply {
      topMargin = dp(context, 12)
    })
    if (state.passes > 0) {
      column.addView(centered(context, words.get("panelPasses"), 13f, palette.textMuted), VigilViews.matchWidth().apply {
        topMargin = dp(context, 4)
      })
    }
    addPassRow(context, column, words, palette, state) { once(actions.onPass) }
    column.addView(VigilViews.quietButton(context, palette, words.get("close")) { once(actions.onClose) }, VigilViews.matchWidth().apply {
      topMargin = dp(context, 4)
    })
    card = column
    mount(context, root, column, palette) { once(actions.onClose) }
  }

  private fun once(action: () -> Unit) {
    if (acted) return
    acted = true
    action()
  }
}

/** The blocking card past the allowance. One at a time: a new reel refreshes it in place. */
class VigilReelBlockView(
  context: Context,
  words: VigilReelWords,
  palette: VigilPalette,
  state: VigilReelState,
  closable: Boolean,
  actions: VigilReelActions
) {
  private var acted = false
  val root = VigilPanelRoot(context) { once(if (closable) actions.onClose else actions.onLeave) }
  val card: View
  private val title: TextView

  init {
    val column = reelColumn(context, palette)
    column.addView(VigilViews.mark(context, palette, palette.danger, 36), LinearLayout.LayoutParams(dp(context, 36), dp(context, 36)))
    title = VigilViews.text(context, words.get("blockTitle"), VigilType.display(context), 22f, palette.text).apply {
      // A new count is read out by screen readers without moving their focus.
      accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
    }
    column.addView(title, VigilViews.matchWidth().apply { topMargin = dp(context, 14) })
    column.addView(
      VigilViews.text(context, words.get("blockBody"), VigilType.medium(context), 15f, palette.textMuted),
      VigilViews.matchWidth().apply { topMargin = dp(context, 8) }
    )
    column.addView(VigilViews.primaryButton(context, palette, words.get("leave")) { once(actions.onLeave) }, VigilViews.matchWidth().apply {
      topMargin = dp(context, 20)
    })
    if (state.canPass) {
      val label = "${words.get("passAction")} · ${words.get("passPrice")}"
      column.addView(VigilViews.quietButton(context, palette, label) { once(actions.onPass) }, VigilViews.matchWidth().apply {
        topMargin = dp(context, 4)
      })
    }
    if (closable) {
      column.addView(VigilViews.quietButton(context, palette, words.get("close")) { once(actions.onClose) }, VigilViews.matchWidth())
    }
    card = column
    mount(context, root, column, palette) { if (closable) once(actions.onClose) }
  }

  /** A new reel while it is up: the new count in the title, said again to screen readers. */
  fun refresh(words: VigilReelWords) {
    title.text = words.get("blockTitle")
  }

  private fun once(action: () -> Unit) {
    if (acted) return
    acted = true
    action()
  }
}

/** What the reel cards show. */
data class VigilReelState(val count: Int, val allowance: Int, val passes: Int, val canPass: Boolean, val passesLeft: Boolean)

/** The pass: the gold button with its price, or one muted line saying why not. */
private fun addPassRow(context: Context, column: LinearLayout, words: VigilReelWords, palette: VigilPalette, state: VigilReelState, onPass: () -> Unit) {
  val top = VigilViews.matchWidth().apply { topMargin = dp(context, 18) }
  if (state.canPass) {
    val label = "${words.get("passAction")} · ${words.get("passPrice")}"
    column.addView(VigilViews.primaryButton(context, palette, label, onPass), top)
    return
  }
  val reason = if (!state.passesLeft) words.get("passesUsed") else words.get("passShort")
  column.addView(centered(context, reason, 13f, palette.textMuted), top)
}

private fun reelColumn(context: Context, palette: VigilPalette) = VigilColumn(context, dp(context, 360)).apply {
  orientation = LinearLayout.VERTICAL
  setPadding(dp(context, 20), dp(context, 18), dp(context, 20), dp(context, 14))
  background = VigilViews.surface(context, palette, 26f)
  elevation = VigilType.dp(context, 16f)
  isClickable = true
}

private fun eyebrow(context: Context, palette: VigilPalette, value: String): TextView =
  VigilViews.text(context, value.uppercase(), VigilType.semiBold(context), 11f, palette.textMuted).apply {
    letterSpacing = 0.14f
    maxLines = 1
  }

private fun centered(context: Context, value: String, sizeSp: Float, color: Int): TextView =
  VigilViews.text(context, value, VigilType.medium(context), sizeSp, color).apply { gravity = Gravity.CENTER }

/** The card centred on the scrim, scrolling on short screens; a tap on the scrim runs `onScrim`. */
private fun mount(context: Context, root: VigilPanelRoot, card: View, palette: VigilPalette, onScrim: () -> Unit) {
  root.setBackgroundColor(palette.scrim)
  root.isClickable = true
  root.isFocusable = true
  root.isFocusableInTouchMode = true
  root.setOnClickListener { onScrim() }
  val holder = FrameLayout(context).apply {
    setPadding(dp(context, 16), dp(context, 24), dp(context, 16), dp(context, 24))
    clipToPadding = false
    isClickable = true
    setOnClickListener { onScrim() }
    addView(card, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER_HORIZONTAL))
  }
  val scroll = ScrollView(context).apply {
    isVerticalScrollBarEnabled = false
    overScrollMode = View.OVER_SCROLL_NEVER
    addView(holder)
  }
  root.addView(scroll, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER))
}

private fun dp(context: Context, value: Int) = VigilType.dp(context, value)
