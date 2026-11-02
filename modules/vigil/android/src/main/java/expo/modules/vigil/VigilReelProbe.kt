package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.graphics.Rect
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * What the reel counter reads from another app's screen, in one place. Only view ids, bounds,
 * list positions (`rowIndex`, the item's place in its list) and node identities: never
 * text, content descriptions, usernames, captions or what the video shows. Every node is let go
 * at once (released before Android 13); every call is wrapped, because the other app can change
 * or die between two calls.
 */
object VigilReelProbe {
  /** At most this many children are looked at to find the page on screen (pagers hold 1 to 3). */
  private const val MAX_CHILDREN = 6

  /** The scrolling view's identity, id and size (the indexed path). */
  fun scroller(event: AccessibilityEvent): VigilScroller? {
    val node = source(event) ?: return null
    return try {
      val bounds = Rect()
      node.getBoundsInScreen(bounds)
      VigilScroller(node.hashCode(), node.viewIdResourceName, bounds.width(), bounds.height())
    } catch (_: Exception) {
      null
    } finally {
      release(node)
    }
  }

  /** The event's view, owned by the caller (release it). */
  fun source(event: AccessibilityEvent): AccessibilityNodeInfo? = try {
    event.source
  } catch (_: Exception) {
    null
  }

  /**
   * The pager now (after a swipe came to rest): its size, its orientation and the page covering its
   * centre. Null when the view is gone.
   */
  fun pager(node: AccessibilityNodeInfo): VigilPagerSample? = try {
    if (!node.refresh()) {
      null
    } else {
      val bounds = Rect()
      node.getBoundsInScreen(bounds)
      val info = node.collectionInfo
      val horizontal = info != null && info.columnCount > 1 && info.rowCount <= 1
      VigilPagerSample(
        identity = node.hashCode(),
        viewId = node.viewIdResourceName,
        width = bounds.width(),
        height = bounds.height(),
        horizontal = horizontal,
        scrollable = node.isScrollable,
        page = page(node, bounds)
      )
    }
  } catch (_: Exception) {
    null
  }

  /**
   * The rule's pager or page by id in the app's active window (the app searches its own views;
   * nothing else is read). For a swipe whose event came from somewhere else in the screen.
   */
  fun findPager(service: AccessibilityService, packageName: String, rule: VigilReelRule): AccessibilityNodeInfo? {
    if (rule.pagerIds.isEmpty() && rule.pageIds.isEmpty()) return null
    val root = try {
      service.rootInActiveWindow
    } catch (_: Exception) {
      null
    } ?: return null
    try {
      if (root.packageName?.toString() != packageName) return null
      for (id in rule.pagerIds) firstVisible(root, "$packageName:id/$id")?.let { return it }
      for (id in rule.pageIds) {
        val page = firstVisible(root, "$packageName:id/$id") ?: continue
        val parent = try {
          page.parent
        } catch (_: Exception) {
          null
        }
        release(page)
        if (parent != null) return parent
      }
      return null
    } catch (_: Exception) {
      return null
    } finally {
      release(root)
    }
  }

  fun release(node: AccessibilityNodeInfo?) {
    if (node == null || Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return
    try {
      @Suppress("DEPRECATION")
      node.recycle()
    } catch (_: Exception) {
      // Already released.
    }
  }

  private fun firstVisible(root: AccessibilityNodeInfo, viewId: String): AccessibilityNodeInfo? {
    val found = try {
      root.findAccessibilityNodeInfosByViewId(viewId)
    } catch (_: Exception) {
      null
    } ?: return null
    var chosen: AccessibilityNodeInfo? = null
    for (node in found) {
      if (chosen == null && node.isVisibleToUser) chosen = node else release(node)
    }
    return chosen
  }

  /** The child covering the pager's centre, with its share of the pager's height. */
  private fun page(pager: AccessibilityNodeInfo, bounds: Rect): VigilPageSample? {
    if (bounds.height() <= 0) return null
    val centreX = bounds.centerX()
    val centreY = bounds.centerY()
    val count = pager.childCount.coerceAtMost(MAX_CHILDREN)
    val child = Rect()
    for (i in 0 until count) {
      val node = try {
        pager.getChild(i)
      } catch (_: Exception) {
        null
      } ?: continue
      try {
        node.getBoundsInScreen(child)
        if (!child.contains(centreX, centreY)) continue
        val visible = Rect(child)
        if (!visible.intersect(bounds)) continue
        return VigilPageSample(
          identity = node.hashCode(),
          viewId = node.viewIdResourceName,
          rowIndex = node.collectionItemInfo?.rowIndex,
          fillShare = visible.height().toFloat() / bounds.height()
        )
      } catch (_: Exception) {
        continue
      } finally {
        release(node)
      }
    }
    return null
  }
}
