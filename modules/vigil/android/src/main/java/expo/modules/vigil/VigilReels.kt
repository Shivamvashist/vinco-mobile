package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

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
 * - Hears scrolls (and, for apps whose rule asks, content changes) from the marked apps only (any
 *   other package is dropped on the first line). A list that reports positions goes straight to
 *   [VigilReelDetector]; any other swipe is looked at once it has come to rest (VigilReelSettler,
 *   VigilReelPages). A reel counts after its dwell.
 * - Counts into [VigilReelStore] (per local day, kept on the phone) and tells JavaScript.
 * - Vigil level and up: the live badge while a marked app is in front (draggable; a tap opens the
 *   reel panel), the budget and milestone cards under the allowance, and past it the blocking card
 *   on every reel counted (VigilReelOverlays).
 * - Which app is in front comes from window state events, checked against the window list
 *   (VigilReelFront) whenever windows change, so the badge comes back after Home, Recents, a lock
 *   or a card that held the focus.
 *
 * Nothing is read from the screen but list ids, sizes and positions; nothing is logged or stored
 * but the day's count. No polling, no wake locks: work happens only on events, plus one delayed
 * check per swipe and per reel.
 */
class VigilReels(private val service: AccessibilityService) {
  private val handler = Handler(Looper.getMainLooper())
  private val detector = VigilReelDetector()
  private val overlays = VigilReelOverlays(service)
  private val settler = VigilReelSettler(handler) { settle, node -> onSettled(settle, node) }
  private var config: VigilReelConfig? = null
  private var keyboards: Set<String> = emptySet()
  /** The app in front (keyboards and the status bar don't change it). */
  private var front: String? = null
  private var hearingContent = false
  private var frontCheckQueued = false
  private val frontCheck = Runnable {
    frontCheckQueued = false
    checkFront()
  }

  /** Reads the settings again (on connecting, and after `configure`). */
  fun reload() {
    config = VigilReelStore.config(service)
    keyboards = VigilApps.keyboards(service)
    val current = config
    if (current == null || current.markedPackages.isEmpty()) {
      detector.reset()
      settler.clear()
      overlays.hideAll()
      hearContent(false)
      return
    }
    front?.let { onWindow(it) }
    queueFrontCheck()
  }

  fun stop() {
    handler.removeCallbacksAndMessages(null)
    settler.clear()
    detector.reset()
    overlays.hideAll()
    hearContent(false)
  }

  /** A window came to the front (the service has already dropped Vinco's own overlay windows). */
  fun onWindow(packageName: String) {
    if (packageName == VigilApps.SYSTEM_UI || packageName in keyboards) return
    front = packageName
    val current = config ?: return
    if (packageName !in current.markedPackages) {
      // Left the reels: a reel still in its dwell doesn't count, and the windows go.
      detector.cancelPending()
      settler.clear()
      overlays.hideAll()
      hearContent(false)
      return
    }
    detector.cancelPending(packageName)
    hearContent(VigilReelRules.of(packageName).contentChanges)
    if (current.level.showsBadge) {
      overlays.showBadge(VigilReelStore.todayCount(service), current)
    } else {
      overlays.hideAll()
    }
  }

  /** Windows were added, removed or moved: check the app in front soon (once per burst). */
  fun onWindowsChanged() {
    if (config?.markedPackages.isNullOrEmpty()) return
    queueFrontCheck()
  }

  fun onScrolled(event: AccessibilityEvent) {
    val current = config ?: return
    val packageName = event.packageName?.toString() ?: return
    if (packageName !in current.markedPackages) return
    // Events from a marked app that isn't the one we think is in front: ask the window list.
    if (packageName != front) queueFrontCheck()
    val className = event.className?.toString().orEmpty()
    val dy = deltaY(event)
    val scroll = VigilScroll(
      packageName = packageName,
      windowId = event.windowId,
      className = className,
      fromIndex = event.fromIndex,
      toIndex = event.toIndex,
      itemCount = event.itemCount,
      deltaX = deltaX(event),
      deltaY = dy
    )
    val rule = VigilReelRules.of(packageName)
    val metrics = service.resources.displayMetrics
    apply(detector.onScroll(scroll, rule, metrics.widthPixels, metrics.heightPixels) { VigilReelProbe.scroller(event) })
    if (!rule.bySettle || packageName != front) return
    // Sideways (tabs, the stories tray): never a reel.
    if (scroll.deltaX != null && dy != null && scroll.deltaX != 0 && dy == 0) return
    val indexed = scroll.fromIndex >= 0 && scroll.toIndex >= 0
    settler.touch(event, packageName, className, dy, indexed, fromScroll = true) {
      detector.onSwipe(packageName, event.windowId, className)
    }
  }

  /** A content change in the app in front (heard only where the rule asks for it). */
  fun onContentChanged(event: AccessibilityEvent) {
    val current = config ?: return
    val packageName = event.packageName?.toString() ?: return
    if (packageName !in current.markedPackages) return
    if (packageName != front) {
      queueFrontCheck()
      return
    }
    val rule = VigilReelRules.of(packageName)
    if (!rule.contentChanges || !rule.bySettle) return
    if (event.contentChangeTypes and AccessibilityEvent.CONTENT_CHANGE_TYPE_SUBTREE == 0) return
    val className = event.className?.toString().orEmpty()
    // Pages come and go inside a list or a pager; elsewhere only where pages are told apart by view.
    if (!rule.byPageIdentity && LISTS.none { className.contains(it) }) return
    settler.touch(event, packageName, className, null, indexed = false, fromScroll = false) {}
  }

  private fun onSettled(settle: VigilSettle, node: AccessibilityNodeInfo) {
    val current = config ?: return
    if (settle.packageName != front || settle.packageName !in current.markedPackages) return
    val rule = VigilReelRules.of(settle.packageName)
    var pager = VigilReelProbe.pager(node)
    if (pager?.page == null) {
      // The event came from elsewhere on the screen: look for the app's own pager by id.
      VigilReelProbe.findPager(service, settle.packageName, rule)?.let { found ->
        try {
          VigilReelProbe.pager(found)?.let { pager = it }
        } finally {
          VigilReelProbe.release(found)
        }
      }
    }
    val sample = pager ?: return
    val metrics = service.resources.displayMetrics
    apply(detector.onSettled(settle, sample, rule, metrics.widthPixels, metrics.heightPixels))
  }

  private fun apply(decision: VigilReelDecision) {
    repeat(decision.countNow) { count() }
    val token = decision.arriveToken ?: return
    handler.postDelayed({ guarded { if (detector.confirm(token)) count() } }, VigilReelDetector.DWELL_MS)
  }

  private fun count() {
    val current = config ?: return
    val total = VigilReelStore.increment(service)
    VigilReelEvents.emit(total, VigilReelStore.today())
    if (!current.level.showsBadge || front !in current.markedPackages) return
    overlays.onCounted(total, current)
  }

  private fun queueFrontCheck() {
    if (frontCheckQueued) return
    frontCheckQueued = true
    handler.postDelayed(frontCheck, FRONT_CHECK_MS)
  }

  /** The window list says which app is in front: catch up if the events missed it. */
  private fun checkFront() = guarded {
    val current = config ?: return@guarded
    val top = VigilReelFront.topApp(service) ?: return@guarded
    val badgeMissing = top in current.markedPackages && current.level.showsBadge && !overlays.isBadgeShown
    if (top != front || badgeMissing) onWindow(top)
  }

  private fun hearContent(on: Boolean) {
    if (on == hearingContent) return
    hearingContent = on
    VigilReelFront.hearContentChanges(service, on)
  }

  private inline fun guarded(block: () -> Unit) {
    try {
      block()
    } catch (_: Exception) {
      // An error here must never reach the accessibility service (it runs in Vinco's process).
    }
  }

  // Android 9+ reports how far a scroll moved; -1 on both means "not reported".
  private fun deltaX(event: AccessibilityEvent): Int? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && !noDeltas(event)) event.scrollDeltaX else null

  private fun deltaY(event: AccessibilityEvent): Int? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && !noDeltas(event)) event.scrollDeltaY else null

  private fun noDeltas(event: AccessibilityEvent): Boolean =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && event.scrollDeltaX == -1 && event.scrollDeltaY == -1

  private companion object {
    /** After a burst of window changes, the window list is read once. */
    const val FRONT_CHECK_MS = 250L
    /** Class names of the lists and pagers whose content changes are worth a look. */
    val LISTS = listOf("RecyclerView", "ViewPager", "Pager", "ListView", "GridView", "ScrollView")
  }
}
