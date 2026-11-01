package expo.modules.vigil

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.os.SystemClock
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.TextView
import kotlin.math.abs

/**
 * The reel badge over a marked app (Vigil level and up): a small pill with the day's count in
 * tabular digits, marble, gold near the allowance, porphyry past it.
 *
 * It can be moved and tapped: a drag past the touch slop moves it, and on release it glides to
 * the nearer side; a tap (no drag) runs `onTap` (the reel panel). Its side and height are kept in
 * prefs (VigilReelStore), so it comes back where it was left, and it is clamped into the screen
 * again after a rotation or a size change. Every window call is on the main thread and wrapped,
 * so a WindowManager error never reaches the accessibility service.
 */
class VigilBadge(private val context: Context, private val windows: VigilReelWindows) {
  private var root: VigilRoot? = null
  private var pill: TextView? = null
  private var params: WindowManager.LayoutParams? = null
  private var snap: ValueAnimator? = null
  private var lastTapAt = 0L
  private var onTap: () -> Unit = {}

  val isShown: Boolean get() = root != null

  fun show(count: Int, allowance: Int, config: VigilReelConfig, onTap: () -> Unit) {
    this.onTap = onTap
    val words = VigilReelWords(config, count, allowance)
    val palette = VigilReelWords.palette(config)
    val existing = pill
    val existingParams = params
    if (existing != null && existingParams != null && existingParams.type == windows.overlayType()) {
      style(existing, words, palette, count, allowance)
      return
    }
    // First time, or the overlay permission changed: (re)create it with the type allowed now.
    hide()
    val text = VigilViews.timeText(context, "", 15f, palette.text).apply {
      typeface = VigilType.semiBold(context)
      gravity = Gravity.CENTER
      minWidth = VigilType.dp(context, 56)
      minHeight = VigilType.dp(context, 44)
      setPadding(VigilType.dp(context, 14), 0, VigilType.dp(context, 14), 0)
      elevation = VigilType.dp(context, 6f)
      importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
    style(text, words, palette, count, allowance)
    val view = VigilRoot(context).apply {
      setPadding(VigilType.dp(context, 4), VigilType.dp(context, 4), VigilType.dp(context, 4), VigilType.dp(context, 8))
      clipToPadding = false
      isClickable = true
      addView(text, FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT))
      contentDescription = text.contentDescription
    }
    view.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED)
    val layout = windows.params(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT).apply {
      gravity = Gravity.TOP or Gravity.START
    }
    place(layout, view.measuredWidth, view.measuredHeight)
    attachDrag(view, layout)
    view.onConfigChanged = { reposition() }
    if (!windows.add(view, layout)) return
    root = view
    pill = text
    params = layout
  }

  fun hide() {
    snap?.cancel()
    snap = null
    root?.let(windows::remove)
    root = null
    pill = null
    params = null
  }

  private fun style(view: TextView, words: VigilReelWords, palette: VigilPalette, count: Int, allowance: Int) {
    view.text = words.get(if (count == 1) "badgeOne" else "badge")
    val stage = VigilReelPolicy.stage(count, allowance)
    val line = when (stage) {
      VigilReelStage.CALM -> palette.text
      VigilReelStage.NEAR -> palette.accent
      VigilReelStage.OVER -> palette.danger
    }
    view.setTextColor(line)
    view.background = GradientDrawable().apply {
      setColor(palette.surface)
      cornerRadius = VigilType.dp(context, 999f)
      setStroke(VigilViews.hairline(context), if (stage == VigilReelStage.CALM) palette.border else palette.alpha(line, 0.7f))
    }
    val description = "${words.get("badgeLabel")} ${words.get("badgeHint")}"
    view.contentDescription = description
    root?.contentDescription = description
  }

  /** The kept side and height, inside the screen. */
  private fun place(layout: WindowManager.LayoutParams, width: Int, height: Int) {
    val (screenW, screenH) = windows.screenSize()
    val (atStart, yFraction) = VigilReelStore.badgePlace(context)
    val margin = VigilType.dp(context, EDGE_DP)
    layout.x = if (atStart) margin else (screenW - width - margin).coerceAtLeast(0)
    val minY = VigilType.dp(context, TOP_DP)
    val maxY = (screenH - height - VigilType.dp(context, BOTTOM_DP)).coerceAtLeast(minY)
    layout.y = (yFraction * screenH).toInt().coerceIn(minY, maxY)
  }

  /** After a rotation or a size change: back on its side, inside the new screen. */
  private fun reposition() {
    val view = root ?: return
    val layout = params ?: return
    snap?.cancel()
    place(layout, view.width.takeIf { it > 0 } ?: view.measuredWidth, view.height.takeIf { it > 0 } ?: view.measuredHeight)
    windows.update(view, layout)
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun attachDrag(view: View, layout: WindowManager.LayoutParams) {
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    var moved = false
    val slop = VigilType.dp(context, 8f)
    // Screen readers and switch access click it like a button.
    view.setOnClickListener {
      val now = SystemClock.elapsedRealtime()
      if (now - lastTapAt < TAP_DEBOUNCE_MS) return@setOnClickListener
      lastTapAt = now
      VigilViews.tick(view)
      onTap()
    }
    view.setOnTouchListener { touched, event ->
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          snap?.cancel()
          downX = event.rawX
          downY = event.rawY
          startX = layout.x
          startY = layout.y
          moved = false
          touched.animate().scaleX(0.94f).scaleY(0.94f).setDuration(90L).start()
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = event.rawX - downX
          val dy = event.rawY - downY
          if (abs(dx) > slop || abs(dy) > slop) moved = true
          if (moved) {
            val (screenW, screenH) = windows.screenSize()
            layout.x = (startX + dx).toInt().coerceIn(0, (screenW - touched.width).coerceAtLeast(0))
            layout.y = (startY + dy).toInt().coerceIn(0, (screenH - touched.height).coerceAtLeast(0))
            windows.update(touched, layout)
          }
          true
        }
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          touched.animate().scaleX(1f).scaleY(1f).setDuration(120L).start()
          if (moved) snapToSide(touched, layout) else if (event.actionMasked == MotionEvent.ACTION_UP) touched.performClick()
          true
        }
        else -> false
      }
    }
  }

  /** Glides to the nearer side and keeps the place for next time. */
  private fun snapToSide(view: View, layout: WindowManager.LayoutParams) {
    val (screenW, screenH) = windows.screenSize()
    val margin = VigilType.dp(context, EDGE_DP)
    val atStart = layout.x + view.width / 2 < screenW / 2
    val minY = VigilType.dp(context, TOP_DP)
    val maxY = (screenH - view.height - VigilType.dp(context, BOTTOM_DP)).coerceAtLeast(minY)
    layout.y = layout.y.coerceIn(minY, maxY)
    VigilReelStore.saveBadgePlace(context, atStart, layout.y.toFloat() / screenH.coerceAtLeast(1))
    val target = if (atStart) margin else (screenW - view.width - margin).coerceAtLeast(0)
    snap?.cancel()
    snap = ValueAnimator.ofInt(layout.x, target).apply {
      duration = SNAP_MS
      interpolator = DecelerateInterpolator(1.8f)
      addUpdateListener {
        if (root !== view) {
          cancel()
          return@addUpdateListener
        }
        layout.x = it.animatedValue as Int
        windows.update(view, layout)
      }
      start()
    }
  }

  private companion object {
    const val SNAP_MS = 220L
    const val TAP_DEBOUNCE_MS = 500L
    const val EDGE_DP = 8
    const val TOP_DP = 48
    const val BOTTOM_DP = 96
  }
}

