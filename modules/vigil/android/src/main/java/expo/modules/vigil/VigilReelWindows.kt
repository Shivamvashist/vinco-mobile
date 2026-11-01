package expo.modules.vigil

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator

/**
 * The reel watch's windows over a marked app: the badge (VigilBadge), the panel a tap on it opens,
 * the blocking card past the allowance, and the budget and milestone cards. One of panel, block or
 * card at a time; the block replaces the others and is refreshed in place, never stacked.
 *
 * With "Display over other apps" they are application overlays, otherwise the accessibility
 * overlay. Every add, update and remove runs on the main thread (the service's) and is wrapped, so
 * a WindowManager error never stops counting or the service.
 */
class VigilReelWindows(private val context: Context) {
  private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private var panel: VigilReelPanelView? = null
  private var block: VigilReelBlockView? = null
  private var card: View? = null

  val isBlockShown: Boolean get() = block != null

  fun showPanel(view: VigilReelPanelView) {
    hideFloating()
    if (!add(view.root, fullScreen())) return
    panel = view
    enter(view.root, view.card)
  }

  /** Shows the blocking card, or refreshes the one on screen with this count. */
  fun showBlock(create: () -> VigilReelBlockView, refresh: (VigilReelBlockView) -> Unit) {
    val shown = block
    if (shown != null && shown.root.isAttachedToWindow) {
      refresh(shown)
      VigilViews.tick(shown.card)
      return
    }
    hideFloating()
    val view = create()
    if (!add(view.root, fullScreen())) return
    block = view
    enter(view.root, view.card)
  }

  /** A budget or milestone card near the top. Never over the blocking card. */
  fun showCard(view: View, autoHideMs: Long) {
    if (block != null) return
    hideFloating()
    val layout = params(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = VigilType.dp(context, 32)
    }
    if (!add(view, layout)) return
    card = view
    enter(view, view)
    view.postDelayed({ if (card === view) hideCard() }, autoHideMs)
  }

  fun hidePanel() {
    panel?.root?.let(::remove)
    panel = null
  }

  fun hideBlock() {
    block?.root?.let(::remove)
    block = null
  }

  fun hideCard() {
    card?.let(::remove)
    card = null
  }

  /** Panel, block and card (the badge is VigilBadge's). */
  fun hideFloating() {
    hidePanel()
    hideBlock()
    hideCard()
  }

  fun overlayType(): Int = if (VigilOverlay.canDrawOverlays(context)) {
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
  } else {
    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
  }

  fun params(width: Int, height: Int): WindowManager.LayoutParams = WindowManager.LayoutParams(
    width,
    height,
    overlayType(),
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
    PixelFormat.TRANSLUCENT
  ).apply { windowAnimations = 0 }

  fun add(view: View, layout: WindowManager.LayoutParams): Boolean = try {
    windowManager.addView(view, layout)
    true
  } catch (_: Exception) {
    false
  }

  fun update(view: View, layout: WindowManager.LayoutParams) {
    try {
      windowManager.updateViewLayout(view, layout)
    } catch (_: Exception) {
      // Removed meanwhile.
    }
  }

  fun remove(view: View) {
    view.animate().cancel()
    if (view.parent == null && !view.isAttachedToWindow) return
    try {
      windowManager.removeView(view)
    } catch (_: Exception) {
      // Already gone.
    }
  }

  fun screenSize(): Pair<Int, Int> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      try {
        val bounds = windowManager.currentWindowMetrics.bounds
        return bounds.width() to bounds.height()
      } catch (_: Exception) {
        // Fall through to the display's size.
      }
    }
    val metrics = DisplayMetrics()
    @Suppress("DEPRECATION")
    windowManager.defaultDisplay.getRealMetrics(metrics)
    return metrics.widthPixels to metrics.heightPixels
  }

  /** A full-screen window that takes every touch and Back (the panel and the blocking card). */
  private fun fullScreen(): WindowManager.LayoutParams =
    params(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT).apply {
      flags = (flags and WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE.inv()) or WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM
      gravity = Gravity.CENTER
    }

  private fun enter(root: View, card: View) {
    root.alpha = 0f
    root.animate().alpha(1f).setDuration(ENTER_MS).start()
    card.scaleX = 0.95f
    card.scaleY = 0.95f
    card.animate().scaleX(1f).scaleY(1f).setDuration(ENTER_MS).setInterpolator(DecelerateInterpolator(1.8f))
      .withStartAction { VigilViews.tick(card) }
      .start()
  }

  private companion object {
    const val ENTER_MS = 220L
  }
}
