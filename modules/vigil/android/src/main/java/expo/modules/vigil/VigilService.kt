package expo.modules.vigil

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

/**
 * The Vigil's accessibility service. It only listens for window state changes (which app is in
 * front) and never reads window content. The system starts it when the user turns it on and again
 * after a reboot; on connecting it reads any running focus from the store and carries on guarding.
 */
class VigilService : AccessibilityService() {
  private var guard: VigilGuard? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    val created = VigilGuard(this)
    guard = created
    running = this
    created.reload()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val packageName = event.packageName?.toString() ?: return
    val className = event.className?.toString()
    // Vinco's own overlay windows must not count as Vinco being in front: only its activities do.
    if (packageName == this.packageName && !isOwnActivity(className)) return
    guard?.onWindow(packageName, className)
  }

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    guard?.stop()
    guard = null
    if (running === this) running = null
    super.onDestroy()
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
