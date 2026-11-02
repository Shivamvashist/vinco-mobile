package expo.modules.vigil

import android.os.Handler
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Waits for a swipe in a marked app to come to rest, then hands over the list it happened in.
 *
 * A gesture is the run of events from one list (package, window, class). It is over [QUIET_MS]
 * after its last event; a run of content changes at the latest [MAX_MS] after it began (a page that
 * keeps changing while a video plays still gets looked at, about once every one and a half seconds). Scrolls sum their vertical
 * deltas (Android 9+); content changes carry none. A swipe in progress wins over content changes.
 * The list's node is read once per gesture and released when the gesture ends. Main thread only.
 */
class VigilReelSettler(
  private val handler: Handler,
  private val onSettled: (VigilSettle, AccessibilityNodeInfo) -> Unit
) {
  private class Gesture(
    val key: String,
    val packageName: String,
    val windowId: Int,
    val className: String,
    val node: AccessibilityNodeInfo,
    var netDy: Int?,
    var indexed: Boolean,
    val startedAt: Long,
    val fromScroll: Boolean
  )

  private var gesture: Gesture? = null
  private var lastProbeAt = 0L
  private val settle = Runnable { finish() }

  /**
   * One event in a marked app's list. `dy`: how far it moved down (null: not reported); `indexed`:
   * the event carried item positions. Calls `onSwipeStart` when a new scroll gesture begins.
   */
  fun touch(
    event: AccessibilityEvent,
    packageName: String,
    className: String,
    dy: Int?,
    indexed: Boolean,
    fromScroll: Boolean,
    onSwipeStart: () -> Unit
  ) {
    val now = SystemClock.uptimeMillis()
    val key = "$packageName|${event.windowId}|$className"
    val current = gesture
    if (current != null && current.key == key) {
      if (dy != null) current.netDy = (current.netDy ?: 0) + dy
      if (indexed) current.indexed = true
    } else {
      // Content changes never replace a swipe, and read a new list at most every PROBE_MS.
      if (!fromScroll && current != null && (current.fromScroll || now - lastProbeAt < PROBE_MS)) return
      if (fromScroll) onSwipeStart()
      val node = VigilReelProbe.source(event) ?: return
      lastProbeAt = now
      // A run of content changes keeps the first one's start, so a playing video still settles.
      val startedAt = if (current != null && !current.fromScroll && !fromScroll) current.startedAt else now
      drop()
      gesture = Gesture(key, packageName, event.windowId, className, node, dy, indexed, startedAt, fromScroll)
    }
    val held = gesture ?: return
    // A swipe is judged whole, however slow; only a run of content changes has a deadline.
    val delay = if (held.fromScroll) QUIET_MS else minOf(QUIET_MS, (held.startedAt + MAX_MS - now).coerceAtLeast(0L))
    handler.removeCallbacks(settle)
    handler.postDelayed(settle, delay)
  }

  /** The user left the app: the gesture is forgotten. */
  fun clear() {
    handler.removeCallbacks(settle)
    drop()
  }

  private fun finish() {
    val done = gesture ?: return
    gesture = null
    try {
      onSettled(VigilSettle(done.packageName, done.windowId, done.className, done.netDy, done.indexed), done.node)
    } catch (_: Exception) {
      // The other app changed under us: this gesture is skipped, counting carries on.
    } finally {
      VigilReelProbe.release(done.node)
    }
  }

  private fun drop() {
    gesture?.let { VigilReelProbe.release(it.node) }
    gesture = null
  }

  companion object {
    const val QUIET_MS = 300L
    const val MAX_MS = 1500L
    const val PROBE_MS = 250L
  }
}
