package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityWindowInfo

/**
 * Which app is really in front, asked of the window list, and which events the service hears.
 *
 * Window state events alone can leave the reel watch with a stale idea of the app in front: a
 * focusable card of Vinco's over the app keeps the focus while the user goes Home, Recents or locks
 * the screen, and some phones send no event when an app comes back from Recents. The window list
 * (`flagRetrieveInteractiveWindows`) is the truth: the top application window. Only its package
 * name is read. Main thread; every call wrapped.
 */
object VigilReelFront {
  /** The package of the app window in front: the focused one, else the active one, else the top one. */
  fun topApp(service: AccessibilityService): String? {
    val windows = try {
      service.windows
    } catch (_: Exception) {
      null
    } ?: return null
    try {
      val apps = windows.filter { it.type == AccessibilityWindowInfo.TYPE_APPLICATION }
      val chosen = apps.firstOrNull { it.isFocused }
        ?: apps.firstOrNull { it.isActive }
        ?: apps.maxByOrNull { it.layer }
        ?: return null
      return rootPackage(chosen)
    } catch (_: Exception) {
      return null
    } finally {
      release(windows)
    }
  }

  /**
   * Content changes are heard only while a marked app whose rule needs them is in front (pagers that
   * page without scrolls); everywhere else they would be thousands of events for nothing.
   */
  fun hearContentChanges(service: AccessibilityService, on: Boolean) {
    try {
      val info = service.serviceInfo ?: return
      val type = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
      val next = if (on) info.eventTypes or type else info.eventTypes and type.inv()
      if (next == info.eventTypes) return
      info.eventTypes = next
      service.serviceInfo = info
    } catch (_: Exception) {
      // The service is going away: nothing to change.
    }
  }

  private fun rootPackage(window: AccessibilityWindowInfo): String? {
    val root: AccessibilityNodeInfo? = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        // Just the root, none of the tree below it.
        window.getRoot(AccessibilityNodeInfo.FLAG_PREFETCH_ANCESTORS)
      } else {
        window.root
      }
    } catch (_: Exception) {
      null
    }
    return try {
      root?.packageName?.toString()
    } catch (_: Exception) {
      null
    } finally {
      VigilReelProbe.release(root)
    }
  }

  private fun release(windows: List<AccessibilityWindowInfo>) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return
    for (window in windows) {
      try {
        @Suppress("DEPRECATION")
        window.recycle()
      } catch (_: Exception) {
        // Already released.
      }
    }
  }
}
