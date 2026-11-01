package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent

/** Live counts for JavaScript (`onReel`). Set while the module is alive. */
object VigilReelEvents {
  @Volatile var listener: ((count: Int, day: String) -> Unit)? = null

  fun emit(count: Int, day: String) {
    try {
      listener?.invoke(count, day)
    } catch (_: Exception) {
      // JavaScript gone: counting never depends on it.
    }
  }
}

/**
 * The reel counter at work, driven by the accessibility service on the main thread.
 *
 * - Hears scroll events from the marked apps only (any other package is dropped on the first line)
 *   and asks [VigilReelDetector] whether a new reel is on screen; a reel counts after its dwell.
 * - Counts into [VigilReelStore] (per local day, kept on the phone) and tells JavaScript.
 * - Vigil level and up: the live badge while a marked app is in front, and the milestone card.
 *
 * Nothing is read from the screen but the scrolling view's id, size and positions; nothing is
 * logged or stored but the day's count. No polling, no wake locks: work happens only on events,
 * plus one delayed check per reel for the dwell.
 */
class VigilReels(private val service: AccessibilityService) {
  private val handler = Handler(Looper.getMainLooper())
  private val detector = VigilReelDetector()
  private val badge = VigilBadge(service)
  private var config: VigilReelConfig? = null
  private var keyboards: Set<String> = emptySet()
  /** The app in front (keyboards and the status bar don't change it). */
  private var front: String? = null

  /** Reads the settings again (on connecting, and after `configure`). */
  fun reload() {
    config = VigilReelStore.config(service)
    keyboards = VigilApps.keyboards(service)
    val current = config
    if (current == null || current.markedPackages.isEmpty()) {
      detector.reset()
      badge.hideAll()
      return
    }
    front?.let { onWindow(it) }
  }

  fun stop() {
    handler.removeCallbacksAndMessages(null)
    detector.reset()
    badge.hideAll()
  }

  /** A window came to the front (the service has already dropped Vinco's own overlay windows). */
  fun onWindow(packageName: String) {
    if (packageName == VigilApps.SYSTEM_UI || packageName in keyboards) return
    front = packageName
    val current = config ?: return
    if (packageName !in current.markedPackages) {
      // Left the reels: a reel still in its dwell doesn't count, and the windows go.
      detector.cancelPending()
      badge.hideAll()
      return
    }
    detector.cancelPending(packageName)
    if (current.level.showsBadge) {
      badge.showBadge(VigilReelStore.todayCount(service), current)
    } else {
      badge.hideAll()
    }
  }

  fun onScrolled(event: AccessibilityEvent) {
    val current = config ?: return
    val packageName = event.packageName?.toString() ?: return
    if (packageName !in current.markedPackages) return
    val scroll = VigilScroll(
      packageName = packageName,
      windowId = event.windowId,
      className = event.className?.toString().orEmpty(),
      fromIndex = event.fromIndex,
      toIndex = event.toIndex,
      itemCount = event.itemCount,
      deltaX = deltaX(event),
      deltaY = deltaY(event)
    )
    val metrics = service.resources.displayMetrics
    val decision = detector.onScroll(
      scroll,
      VigilReelRules.of(packageName),
      metrics.widthPixels,
      metrics.heightPixels
    ) { readScroller(event) }
    repeat(decision.countNow) { count() }
    val token = decision.arriveToken ?: return
    handler.postDelayed({ if (detector.confirm(token)) count() }, VigilReelDetector.DWELL_MS)
  }

  private fun count() {
    val current = config ?: return
    val total = VigilReelStore.increment(service)
    VigilReelEvents.emit(total, VigilReelStore.today())
    if (!current.level.showsBadge || front !in current.markedPackages) return
    badge.showBadge(total, current)
    VigilReelPolicy.milestone(total, current.budget, current.level)?.let { badge.showCard(it, total, current) }
  }

  /** The scrolling view's identity, id and size. Nothing else is read; the node is let go at once. */
  private fun readScroller(event: AccessibilityEvent): VigilScroller? {
    val node = try {
      event.source
    } catch (_: Exception) {
      null
    } ?: return null
    return try {
      val bounds = Rect()
      node.getBoundsInScreen(bounds)
      VigilScroller(node.hashCode(), node.viewIdResourceName, bounds.width(), bounds.height())
    } catch (_: Exception) {
      null
    } finally {
      @Suppress("DEPRECATION")
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) node.recycle()
    }
  }

  // Android 9+ reports how far a scroll moved; -1 on both means "not reported".
  private fun deltaX(event: AccessibilityEvent): Int? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && !noDeltas(event)) event.scrollDeltaX else null

  private fun deltaY(event: AccessibilityEvent): Int? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && !noDeltas(event)) event.scrollDeltaY else null

  private fun noDeltas(event: AccessibilityEvent): Boolean =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && event.scrollDeltaX == -1 && event.scrollDeltaY == -1
}
