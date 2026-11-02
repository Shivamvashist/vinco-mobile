package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

/**
 * The Vigil's accessibility service. It listens for window state changes (which app is in front,
 * for the focus guard), window list changes, and scrolls (the reel counter, marked apps only; plus
 * content changes while a marked app whose rule needs them is in front). For a list in a marked
 * app it reads the list's id, size and positions, never text or what is on screen (VigilReels). The system starts it when the user turns it on and again after a reboot; on
 * connecting it reads any running focus from the store and carries on guarding.
 */
class VigilService : AccessibilityService() {
  private var guard: VigilGuard? = null
  private var unlockReceiver: BroadcastReceiver? = null
  private var reels: VigilReels? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    val created = VigilGuard(this)
    guard = created
    running = this
    created.reload()
    reels = VigilReels(this).also { safely { it.reload() } }
    // Unlocks can only be heard by a running component since Android 8: the "Are you up?" prompt.
    if (unlockReceiver == null) unlockReceiver = VigilWake.register(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    // The service runs in Vinco's process: an error here would close the app. Nothing gets out.
    try {
      handle(event)
    } catch (_: Exception) {
      // This one event is skipped; the next one is handled as usual.
    }
  }

  private fun handle(event: AccessibilityEvent) {
    when (event.eventType) {
      // The reel counter (VigilReels): scrolls and content changes in the marked apps only (every
      // other package is dropped there), and window list changes (which app is really in front).
      AccessibilityEvent.TYPE_VIEW_SCROLLED -> reels?.onScrolled(event)
      AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> reels?.onContentChanged(event)
      AccessibilityEvent.TYPE_WINDOWS_CHANGED -> reels?.onWindowsChanged()
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
        val packageName = event.packageName?.toString() ?: return
        val className = event.className?.toString()
        // Vinco's own overlay windows must not count as Vinco being in front: only its activities do.
        if (packageName == this.packageName && !isOwnActivity(className)) return
        // Apart, so a reel error never keeps the focus guard from hearing the window.
        safely { reels?.onWindow(packageName) }
        guard?.onWindow(packageName, className)
      }
    }
  }

  override fun onInterrupt() = Unit

  override fun onUnbind(intent: Intent?): Boolean {
    VigilWake.unregister(this, unlockReceiver)
    unlockReceiver = null
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    VigilWake.unregister(this, unlockReceiver)
    unlockReceiver = null
    guard?.stop()
    guard = null
    reels?.stop()
    reels = null
    if (running === this) running = null
    super.onDestroy()
  }

  private inline fun safely(block: () -> Unit) {
    try {
      block()
    } catch (_: Exception) {
      // The reel watch skips this one; the service and the app carry on.
    }
  }

  private fun isOwnActivity(className: String?): Boolean {
    if (className.isNullOrBlank()) return false
    return try {
      packageManager.getActivityInfo(ComponentName(packageName, className), 0)
      true
    } catch (_: Exception) {
      false
    }
  }

  companion object {
    @Volatile private var running: VigilService? = null

    /** Tells the running service (if any) that the focus changed. Safe from any thread. */
    fun refresh() {
      val service = running ?: return
      service.mainExecutorCompat().execute { service.guard?.reload() }
    }

    /** Tells the running service (if any) that the reel watch's settings changed. Safe from any thread. */
    fun refreshReels() {
      val service = running ?: return
      service.mainExecutorCompat().execute { service.safely { service.reels?.reload() } }
    }

    /** Whether the user has turned the service on in the phone's accessibility settings. */
    fun isEnabled(context: Context): Boolean {
      val expected = ComponentName(context, VigilService::class.java)
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: return false
      return enabled.split(':').any { entry ->
        ComponentName.unflattenFromString(entry)?.let { it == expected } ?: false
      }
    }
  }
}

private fun Context.mainExecutorCompat(): java.util.concurrent.Executor =
  androidx.core.content.ContextCompat.getMainExecutor(this)
