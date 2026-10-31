package expo.modules.vigil

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import kotlin.math.abs

/**
 * The Vigil's windows over other apps: one card at a time (the alert, the nudge, the cooldown
 * notice) and the small floating bubble (the focus timer, or Imperium's countdown).
 *
 * With "Display over other apps" granted they are application overlays; without it they use the
 * accessibility overlay the service is allowed to draw. If both fail, the guard still works, just
 * without the windows.
 */
class VigilOverlay(private val service: Context) {
  private val windowManager = service.getSystemService(Context.WINDOW_SERVICE) as WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private var card: View? = null
  private var bubble: TextView? = null
  private var bubbleParams: WindowManager.LayoutParams? = null
  private val hideCard = Runnable { removeCard() }

  /** A card near the top. With a button, it stays until tapped or `autoHideMs` passes. */
  fun showCard(title: String, body: String, button: String?, autoHideMs: Long, onButton: (() -> Unit)?) {
    removeCard()
    val view = VigilViews.card(service, title, body, button) {
      removeCard()
      onButton?.invoke()
    }
    val params = baseParams(WindowManager.LayoutParams.WRAP_CONTENT).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = VigilViews.dp(service, 48)
      width = WindowManager.LayoutParams.MATCH_PARENT
      if (button == null) flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
    }
    if (add(view, params)) {
      card = view
      handler.postDelayed(hideCard, autoHideMs)
    }
  }

  fun removeCard() {
    handler.removeCallbacks(hideCard)
    card?.let(::remove)
    card = null
  }

  /** Shows or updates the bubble. A tap runs `onTap`; a drag moves it. */
  fun showBubble(text: String, urgent: Boolean, onTap: () -> Unit) {
    val existing = bubble
    if (existing != null) {
      existing.text = text
      VigilViews.styleBubble(service, existing, urgent)
      return
    }
    val view = VigilViews.bubble(service, text, urgent)
    val params = baseParams(WindowManager.LayoutParams.WRAP_CONTENT).apply {
      gravity = Gravity.TOP or Gravity.END
      x = VigilViews.dp(service, 12)
      y = VigilViews.dp(service, 140)
    }
    attachDrag(view, params, onTap)
    if (add(view, params)) {
      bubble = view
      bubbleParams = params
    }
  }

  fun hideBubble() {
    bubble?.let(::remove)
    bubble = null
    bubbleParams = null
  }

  fun hideAll() {
    removeCard()
    hideBubble()
  }

  private fun baseParams(height: Int): WindowManager.LayoutParams {
    val type = if (canDrawOverlays(service)) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
    }
    return WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      height,
      type,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT
    )
  }

  private fun add(view: View, params: WindowManager.LayoutParams): Boolean = try {
    windowManager.addView(view, params)
    true
  } catch (_: Exception) {
    // No overlay allowed right now: the guard carries on without it.
    false
  }

  private fun remove(view: View) {
    try {
      windowManager.removeView(view)
    } catch (_: Exception) {
      // Already gone.
    }
  }

  @SuppressLint("ClickableViewAccessibility")
  private fun attachDrag(view: View, params: WindowManager.LayoutParams, onTap: () -> Unit) {
    var downX = 0f
    var downY = 0f
    var startX = 0
    var startY = 0
    var moved = false
    view.setOnTouchListener { touched, event ->
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          downX = event.rawX
          downY = event.rawY
          startX = params.x
          startY = params.y
          moved = false
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = event.rawX - downX
          val dy = event.rawY - downY
          if (abs(dx) > TAP_SLOP || abs(dy) > TAP_SLOP) moved = true
          if (moved) {
            // Gravity END: x grows to the left.
            params.x = (startX - dx).toInt().coerceAtLeast(0)
            params.y = (startY + dy).toInt().coerceAtLeast(0)
            try {
              windowManager.updateViewLayout(touched, params)
            } catch (_: Exception) {
              // Removed mid-drag.
            }
          }
          true
        }
        MotionEvent.ACTION_UP -> {
          if (!moved) {
            touched.performClick()
            onTap()
          }
          true
        }
        else -> false
      }
    }
  }

  companion object {
    private const val TAP_SLOP = 12f

    fun canDrawOverlays(context: Context): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)
  }
}
