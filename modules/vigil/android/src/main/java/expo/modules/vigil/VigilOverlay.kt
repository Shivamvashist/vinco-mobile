package expo.modules.vigil

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import kotlin.math.abs

/**
 * The Vigil's windows over other apps: one notice card at a time (the alert, the nudge, the rest
 * notice), the floating bubble (the focus timer, or Imperium's countdown) and the focus panel a tap
 * on the bubble opens (VigilPanel).
 *
 * With "Display over other apps" granted they are application overlays; without it they use the
 * accessibility overlay the service may draw. If the permission is taken away mid-focus, the next
 * update re-creates the bubble with the other type. If both fail, the guard still works, just
 * without the windows.
 *
 * Motion: cards and the panel fade in with a small scale and slide (200 to 240 ms) and leave in
 * 180 ms; the system's animator scale (and "remove animations") applies. `hideAll` removes at once.
 */
class VigilOverlay(private val service: Context) {
  private val windowManager = service.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val handler = Handler(Looper.getMainLooper())

  /** The session's colours. Set when a focus is read. */
  var palette = VigilPalette()

  private var card: View? = null
  private var bubble: VigilViews.Bubble? = null
  private var bubbleParams: WindowManager.LayoutParams? = null
  private var panel: VigilPanel? = null
  private var panelParams: WindowManager.LayoutParams? = null
  private val leaving = mutableSetOf<View>()
  private var snap: ValueAnimator? = null
  private var lastTapAt = 0L

  /** Where the bubble sits, kept for the session: the side it snapped to and its height on screen. */
  private var bubbleAtStart = false
  private var bubbleYFraction = DEFAULT_Y_FRACTION

  private val hideCard = Runnable { removeCard(animate = true) }
  private val panelTick = object : Runnable {
    override fun run() {
      val open = panel ?: return
      val params = panelParams
      if (params != null && params.type != overlayType()) {
        // The overlay permission changed under it: close; the bubble comes back with the other type.
        hidePanel(animate = false)
        return
      }
      open.refresh()
      handler.postDelayed(this, 1000L - System.currentTimeMillis() % 1000L + 20L)
    }
  }

  val isPanelShown: Boolean get() = panel != null

  /** A new focus: the bubble starts again at its usual place. */
  fun resetPlace() {
    bubbleAtStart = false
    bubbleYFraction = DEFAULT_Y_FRACTION
  }

  // Card -----------------------------------------------------------------------------------------

  /** A notice near the top. With actions it is touchable; it leaves after `autoHideMs` either way. */
  fun showCard(notice: VigilNotice, autoHideMs: Long, onPrimary: (() -> Unit)?) {
    removeCard(animate = false)
    val view = VigilViews.notice(
      service,
      palette,
      notice,
      onPrimary = {
        removeCard(animate = false)
        onPrimary?.invoke()
      },
      onSecondary = { removeCard(animate = true) }
    )
    val touchable = notice.primary != null
    val params = baseParams(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = VigilType.dp(service, 32)
      if (!touchable) flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
    }
    if (!add(view, params)) return
    card = view
    view.alpha = 0f
    view.translationY = -VigilType.dp(service, 12f)
    view.scaleX = ENTER_SCALE
    view.scaleY = ENTER_SCALE
    view.animate().alpha(1f).translationY(0f).scaleX(1f).scaleY(1f)
      .setDuration(ENTER_MS).setInterpolator(DecelerateInterpolator(1.6f))
      .withStartAction { VigilViews.tick(view) }
      .start()
    handler.postDelayed(hideCard, autoHideMs)
  }

  fun removeCard(animate: Boolean) {
    handler.removeCallbacks(hideCard)
    val view = card ?: return
    card = null
    leave(view, animate) { it.animate().alpha(0f).translationY(-VigilType.dp(service, 8f)).scaleX(EXIT_SCALE).scaleY(EXIT_SCALE) }
  }

  // Bubble ---------------------------------------------------------------------------------------

  /** Shows or updates the bubble. A tap runs `onTap` (debounced); a drag moves it and it snaps to a side. */
  fun showBubble(state: VigilBubbleState, onTap: () -> Unit) {
    val existing = bubble
    val existingParams = bubbleParams
    if (existing != null && existingParams != null) {
      if (existingParams.type == overlayType()) {
        existing.update(state)
        return
      }
      // The overlay permission changed: draw it again with the type allowed now.
      hideBubble(animate = false)
    }
    val view = VigilViews.Bubble(service, palette)
    view.update(state)
    view.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED)
    val params = baseParams(WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT).apply {
      gravity = Gravity.TOP or Gravity.START
    }
    place(params, view.measuredWidth, view.measuredHeight)
    attachDrag(view, params, onTap)
    view.onConfigChanged = { reposition() }
    // When the time grows or shrinks on the right side, keep the bubble's edge on the edge.
    view.addOnLayoutChangeListener { _, left, _, right, _, oldLeft, _, oldRight, _ ->
      if (right - left != oldRight - oldLeft && !bubbleAtStart) reposition()
    }
    if (!add(view, params)) return
    bubble = view
    bubbleParams = params
    view.alpha = 0f
    view.scaleX = 0.85f
    view.scaleY = 0.85f
    view.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(ENTER_MS).setInterpolator(DecelerateInterpolator(1.6f)).start()
  }

  /** Removes the bubble, and the panel with it. */
  fun hideBubble(animate: Boolean = true) {
    hidePanel(animate)
    snap?.cancel()
    snap = null
    val view = bubble ?: return
    bubble = null
    bubbleParams = null
    leave(view, animate) { it.animate().alpha(0f).scaleX(0.9f).scaleY(0.9f) }
  }

  // Panel ----------------------------------------------------------------------------------------

  /** Opens the focus panel over the app in front. Ignored while one is open. */
  fun showPanel(spec: VigilPanelSpec, actions: VigilPanelActions) {
    if (panel != null) return
    val created = VigilPanel(
      service,
      spec,
      VigilPanelActions(
        onClose = { hidePanel(animate = true) },
        onOpenVinco = {
          hidePanel(animate = false)
          actions.onOpenVinco()
        },
        onLaunch = { packageName ->
          hidePanel(animate = false)
          actions.onLaunch(packageName)
        }
      )
    )
    val params = baseParams(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT).apply {
      // Focusable, so Back reaches it; the keyboard of the app below is left alone.
      flags = (flags and WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE.inv()) or WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM
      gravity = Gravity.CENTER
    }
    if (!add(created.root, params)) return
    panel = created
    panelParams = params
    created.root.alpha = 0f
    created.root.animate().alpha(1f).setDuration(ENTER_MS).start()
    created.card.scaleX = 0.94f
    created.card.scaleY = 0.94f
    created.card.translationY = VigilType.dp(service, 16f)
    created.card.animate().scaleX(1f).scaleY(1f).translationY(0f)
      .setDuration(PANEL_ENTER_MS).setInterpolator(DecelerateInterpolator(1.8f))
      .withStartAction { VigilViews.tick(created.card) }
      .start()
    handler.removeCallbacks(panelTick)
    handler.postDelayed(panelTick, 1000L - System.currentTimeMillis() % 1000L + 20L)
  }

  fun hidePanel(animate: Boolean = true) {
    handler.removeCallbacks(panelTick)
    val open = panel ?: return
    panel = null
    panelParams = null
    if (animate) {
      open.card.animate().scaleX(EXIT_SCALE).scaleY(EXIT_SCALE).setDuration(EXIT_MS).setInterpolator(AccelerateInterpolator()).start()
    }
    leave(open.root, animate) { it.animate().alpha(0f) }
  }

  /** Everything off at once, without animation: the focus ended, a call came in, or the service stops. */
  fun hideAll() {
    handler.removeCallbacksAndMessages(null)
    snap?.cancel()
    snap = null
    listOfNotNull(card, bubble, panel?.root).forEach(::removeNow)
    card = null
    bubble = null
    bubbleParams = null
    panel = null
    panelParams = null
    leaving.toList().forEach(::removeNow)
    leaving.clear()
  }

  // Windows --------------------------------------------------------------------------------------

  private fun overlayType(): Int = if (canDrawOverlays(service)) {
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
  } else {
    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
  }

  private fun baseParams(width: Int, height: Int): WindowManager.LayoutParams =
    WindowManager.LayoutParams(
      width,
      height,
      overlayType(),
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT
    ).apply {
      // The views animate themselves: no system window animation on top.
      windowAnimations = 0
    }

  private fun add(view: View, params: WindowManager.LayoutParams): Boolean = try {
    windowManager.addView(view, params)
    true
  } catch (_: Exception) {
    // No overlay allowed right now: the guard carries on without it.
    false
  }

  /** Animates a window out (or not), then removes it. A safety timer removes it if the animation never ends. */
  private fun leave(view: View, animate: Boolean, animation: (View) -> android.view.ViewPropertyAnimator) {
    if (!animate || !view.isAttachedToWindow) {
      removeNow(view)
      return
    }
    leaving.add(view)
    animation(view).setDuration(EXIT_MS).setInterpolator(AccelerateInterpolator()).withEndAction { removeNow(view) }.start()
    handler.postDelayed({ removeNow(view) }, EXIT_MS + 120L)
  }

  private fun removeNow(view: View) {
    leaving.remove(view)
    view.animate().cancel()
    if (view.parent == null && !view.isAttachedToWindow) return
    try {
      windowManager.removeView(view)
    } catch (_: Exception) {
      // Already gone.
    }
  }

  // Bubble placement -----------------------------------------------------------------------------

  private fun screenSize(): Pair<Int, Int> {
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

  /** Puts the bubble on its remembered side and height, inside the screen. */
  private fun place(params: WindowManager.LayoutParams, width: Int, height: Int) {
    val (screenW, screenH) = screenSize()
    val margin = VigilType.dp(service, EDGE_DP)
    params.x = if (bubbleAtStart) margin else (screenW - width - margin).coerceAtLeast(0)
    val minY = VigilType.dp(service, TOP_DP)
    val maxY = (screenH - height - VigilType.dp(service, BOTTOM_DP)).coerceAtLeast(minY)
    params.y = (bubbleYFraction * screenH).toInt().coerceIn(minY, maxY)
  }

  /** After a rotation or a size change. */
  private fun reposition() {
    val view = bubble ?: return
    val params = bubbleParams ?: return
    if (snap?.isRunning == true) return
    place(params, view.width.takeIf { it > 0 } ?: view.measuredWidth, view.height.takeIf { it > 0 } ?: view.measuredHeight)
    update(view, params)
  }

  private fun update(view: View, params: WindowManager.LayoutParams) {
    try {
      windowManager.updateViewLayout(view, params)
    } catch (_: Exception) {
      // Removed meanwhile.
    }
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun attachDrag(view: View, params: WindowManager.LayoutParams, onTap: () -> Unit) {
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    var moved = false
    val slop = VigilType.dp(service, 8f)
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
          startX = params.x
          startY = params.y
          moved = false
          touched.animate().scaleX(0.94f).scaleY(0.94f).setDuration(90L).start()
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = event.rawX - downX
          val dy = event.rawY - downY
          if (abs(dx) > slop || abs(dy) > slop) moved = true
          if (moved) {
            val (screenW, screenH) = screenSize()
            params.x = (startX + dx).toInt().coerceIn(0, (screenW - touched.width).coerceAtLeast(0))
            params.y = (startY + dy).toInt().coerceIn(0, (screenH - touched.height).coerceAtLeast(0))
            update(touched, params)
          }
          true
        }
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          touched.animate().scaleX(1f).scaleY(1f).setDuration(120L).start()
          if (moved) {
            snapToSide(touched, params)
          } else if (event.actionMasked == MotionEvent.ACTION_UP) {
            touched.performClick()
          }
          true
        }
        else -> false
      }
    }
  }

  /** Glides to the nearer side and remembers the place for the rest of the session. */
  private fun snapToSide(view: View, params: WindowManager.LayoutParams) {
    val (screenW, screenH) = screenSize()
    val margin = VigilType.dp(service, EDGE_DP)
    bubbleAtStart = params.x + view.width / 2 < screenW / 2
    val minY = VigilType.dp(service, TOP_DP)
    val maxY = (screenH - view.height - VigilType.dp(service, BOTTOM_DP)).coerceAtLeast(minY)
    params.y = params.y.coerceIn(minY, maxY)
    bubbleYFraction = params.y.toFloat() / screenH.coerceAtLeast(1)
    val target = if (bubbleAtStart) margin else (screenW - view.width - margin).coerceAtLeast(0)
    snap?.cancel()
    snap = ValueAnimator.ofInt(params.x, target).apply {
      duration = SNAP_MS
      interpolator = DecelerateInterpolator(1.8f)
      addUpdateListener {
        if (bubble !== view) {
          cancel()
          return@addUpdateListener
        }
        params.x = it.animatedValue as Int
        update(view, params)
      }
      start()
    }
  }

  companion object {
    private const val ENTER_MS = 220L
    private const val PANEL_ENTER_MS = 240L
    private const val EXIT_MS = 180L
    private const val SNAP_MS = 220L
    private const val ENTER_SCALE = 0.97f
    private const val EXIT_SCALE = 0.98f
    private const val TAP_DEBOUNCE_MS = 500L
    private const val EDGE_DP = 8
    private const val TOP_DP = 48
    private const val BOTTOM_DP = 96
    private const val DEFAULT_Y_FRACTION = 0.18f

    fun canDrawOverlays(context: Context): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)
  }
}
